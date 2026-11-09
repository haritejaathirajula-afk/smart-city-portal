const db = require('../config/db');
const env = require('../config/env');

/**
 * Health check endpoint
 * GET /api/health
 */
async function getHealth(req, res) {
  const uptime = process.uptime();
  const dbStatus = await db.checkConnection();

  const healthData = {
    status: 'ok',
    service: 'Smart City Service Portal API',
    version: '1.0.0',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime)}s`,
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
    },
    database: dbStatus,
  };

  res.status(200).json({
    success: true,
    data: healthData,
  });
}

module.exports = {
  getHealth,
};
