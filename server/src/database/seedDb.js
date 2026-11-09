const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../config/env');

async function seedDatabase() {
  console.log('====================================================');
  console.log('🌱 Starting Smart City Database Seeder');
  console.log(`📍 Target Database: ${env.db.host}:${env.db.port}/${env.db.database}`);
  console.log('====================================================');

  let connection;
  try {
    connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
      multipleStatements: true,
    });

    console.log(`✅ Connected to database '${env.db.database}'.`);

    const seedPath = path.resolve(__dirname, '../../database/seed.sql');
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Seed file not found at: ${seedPath}`);
    }

    let seedSql = fs.readFileSync(seedPath, 'utf8');
    if (env.db.database && env.db.database !== 'smart_city_db') {
      seedSql = seedSql.replace(/`smart_city_db`/g, `\`${env.db.database}\``);
    }
    console.log(`📄 Executing seed data statements from: database/seed.sql (${(seedSql.length / 1024).toFixed(1)} KB)...`);

    await connection.query(seedSql);

    // Fetch record counts to verify
    const [roles] = await connection.query('SELECT COUNT(*) as count FROM roles');
    const [depts] = await connection.query('SELECT COUNT(*) as count FROM departments');
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [complaints] = await connection.query('SELECT COUNT(*) as count FROM complaints');
    const [history] = await connection.query('SELECT COUNT(*) as count FROM complaint_status_history');
    const [tasks] = await connection.query('SELECT COUNT(*) as count FROM tasks');
    const [requests] = await connection.query('SELECT COUNT(*) as count FROM service_requests');
    const [alerts] = await connection.query('SELECT COUNT(*) as count FROM emergency_alerts');

    console.log('====================================================');
    console.log('🎉 Seed Data Injected Successfully!');
    console.log(`📊 Roles:             ${roles[0].count}`);
    console.log(`📊 Departments:       ${depts[0].count}`);
    console.log(`📊 Users:             ${users[0].count}`);
    console.log(`📊 Complaints:        ${complaints[0].count} (Covers all 7 workflow states)`);
    console.log(`📊 Status History:    ${history[0].count}`);
    console.log(`📊 Field Tasks:       ${tasks[0].count}`);
    console.log(`📊 Service Requests:  ${requests[0].count}`);
    console.log(`📊 Emergency Alerts:  ${alerts[0].count}`);
    console.log('====================================================');
    console.log('🔑 Demo User Accounts:');
    console.log('   Admin:    admin@smartcity.gov           | Admin@123');
    console.log('   Officer:  officer.roads@smartcity.gov   | Officer@123');
    console.log('   Citizen:  citizen@smartcity.gov         | Citizen@123');
    console.log('====================================================');

  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`👉 Database '${env.db.database}' does not exist yet. Please run 'npm run db:init' first.`);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Allow direct CLI execution
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
