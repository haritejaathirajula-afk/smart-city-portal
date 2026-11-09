const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../config/env');

async function initDatabase() {
  console.log('====================================================');
  console.log('🛠️  Starting Smart City Database Initialization');
  console.log(`📍 Connecting to MySQL server at ${env.db.host}:${env.db.port} as '${env.db.user}'...`);
  console.log('====================================================');

  let connection;
  try {
    // Connect without selecting database first
    connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      multipleStatements: true,
    });

    console.log('✅ Connected to MySQL Server.');

    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    let schemaSql = fs.readFileSync(schemaPath, 'utf8');
    if (env.db.database && env.db.database !== 'smart_city_db') {
      schemaSql = schemaSql.replace(/`smart_city_db`/g, `\`${env.db.database}\``);
    }
    console.log(`📄 Executing schema definitions from: database/schema.sql (${(schemaSql.length / 1024).toFixed(1)} KB)...`);

    await connection.query(schemaSql);

    console.log('====================================================');
    console.log(`🎉 Database '${env.db.database}' & all 16 normalized tables initialized successfully!`);
    console.log('====================================================');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('👉 Please make sure your MySQL server (e.g. XAMPP, MySQL Service, or Docker) is running on port ' + env.db.port);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Allow direct execution from CLI
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
