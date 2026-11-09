const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');

const os = require('os');

function getNetworkIps() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ name, address: iface.address });
      }
    }
  }
  return addresses;
}

const server = app.listen(env.port, '0.0.0.0', async () => {
  const networkIps = getNetworkIps();
  console.log(`====================================================`);
  console.log(`🚀 Smart City Service Portal API Server running`);
  console.log(`📍 Local URL:    http://localhost:${env.port}`);
  if (networkIps.length > 0) {
    networkIps.forEach((net) => {
      console.log(`📱 Wi-Fi/LAN (${net.name}): http://${net.address}:${env.port}`);
    });
  }
  console.log(`🏥 Health Check: http://localhost:${env.port}/api/health`);
  console.log(`🌍 Environment:  ${env.nodeEnv}`);
  console.log(`🌐 For ANY network access (Mobile 4G/5G, Remote): run 'npm run tunnel'`);
  console.log(`====================================================`);

  // Check initial DB connectivity
  const dbCheck = await db.checkConnection();
  if (dbCheck.connected) {
    console.log(`✅ [Database] Connected successfully to MySQL (${env.db.host}:${env.db.port}/${env.db.database})`);
    try {
      const [tables] = await db.query('SHOW TABLES');
      if (tables.length === 0) {
        console.log('⚡ Empty database detected. Auto-initializing schema & seed data...');
        const initDatabase = require('./database/initDb');
        const seedDatabase = require('./database/seedDb');
        await initDatabase();
        await seedDatabase();
        console.log('✅ Auto-initialization complete.');
      }
    } catch (autoErr) {
      console.warn('Auto-init check notice:', autoErr.message);
    }
  } else {
    console.warn(`⚠️ [Database] Notice: ${dbCheck.message}`);
    console.warn(`👉 The server will continue running. MySQL connection will be established once MySQL server is started.`);
  }
});

// Graceful shutdown handling
function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('🔒 HTTP server closed.');
    try {
      const pool = db.getPool();
      if (pool) {
        await pool.end();
        console.log('🔒 MySQL connection pool closed.');
      }
    } catch (err) {
      console.error('Error closing database pool:', err.message);
    }
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
