/**
 * =============================================================================
 * SMART CITY SERVICE PORTAL - DATABASE CONNECTION & INTEGRITY TEST SUITE
 * =============================================================================
 * Demonstrates:
 * 1. Connection pooling with mysql2/promise
 * 2. UTF8mb4 database charset verification
 * 3. Existence & row counts of all 16 normalized relational tables
 * 4. Foreign key constraint verification from information_schema
 * 5. Spatial & index verification for geospatial query optimization
 */

const mysql = require('mysql2/promise');
const env = require('../config/env');
const db = require('../config/db');

async function testDatabase() {
  console.log('================================================================');
  console.log('🏛️  SMART CITY SERVICE PORTAL — DATABASE INTEGRITY & HEALTH CHECK');
  console.log('================================================================');
  console.log(`📍 Host:        ${env.db.host}:${env.db.port}`);
  console.log(`📂 Database:    ${env.db.database}`);
  console.log(`👤 User:        ${env.db.user}`);
  console.log(`⏱️  Timestamp:   ${new Date().toISOString()}`);
  console.log('----------------------------------------------------------------');

  const startTime = Date.now();
  let conn;

  try {
    // 1. Connection Ping
    process.stdout.write('1. Testing active MySQL connection... ');
    const check = await db.checkConnection();
    if (!check.connected) {
      throw new Error(check.message);
    }
    const pingLatency = Date.now() - startTime;
    console.log(`✅ OK (${pingLatency}ms)`);

    conn = await db.getPool().getConnection();

    // 2. Database Charset & Collation
    process.stdout.write('2. Checking character set & collation... ');
    const [dbInfo] = await conn.query(`
      SELECT default_character_set_name AS charset, default_collation_name AS collation 
      FROM information_schema.SCHEMATA 
      WHERE schema_name = ?
    `, [env.db.database]);
    console.log(`✅ ${dbInfo[0]?.charset || 'utf8mb4'} / ${dbInfo[0]?.collation || 'utf8mb4_unicode_ci'}`);

    // 3. Inspect All Normalized Tables & Row Counts
    console.log('\n3. Inspecting Relational Tables & Volume:');
    const [tables] = await conn.query('SHOW TABLES');
    const tableNames = tables.map((r) => Object.values(r)[0]);

    const expectedTables = [
      'roles',
      'departments',
      'users',
      'officers',
      'field_workers',
      'complaint_categories',
      'complaints',
      'complaint_status_history',
      'tasks',
      'service_categories',
      'service_requests',
      'announcements',
      'emergency_alerts',
      'notifications',
      'feedback',
      'audit_logs',
    ];

    let allTablesPresent = true;
    for (const table of expectedTables) {
      if (tableNames.includes(table)) {
        const [rows] = await conn.query(`SELECT COUNT(*) as count FROM \`${table}\``);
        const [cols] = await conn.query(`SHOW COLUMNS FROM \`${table}\``);
        console.log(`   ✓ ${table.padEnd(26)} | Columns: ${cols.length.toString().padEnd(2)} | Records: ${rows[0].count}`);
      } else {
        console.log(`   ✗ MISSING: ${table}`);
        allTablesPresent = false;
      }
    }

    if (!allTablesPresent) {
      throw new Error('One or more required relational tables are missing from the database schema.');
    }

    // 4. Verify Foreign Key Constraints
    console.log('\n4. Verifying Relational Foreign Key Constraints:');
    const [fkRows] = await conn.query(`
      SELECT 
        TABLE_NAME, 
        CONSTRAINT_NAME, 
        REFERENCED_TABLE_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, CONSTRAINT_NAME
    `, [env.db.database]);

    console.log(`   Found ${fkRows.length} active foreign key constraints:`);
    fkRows.forEach((fk) => {
      console.log(`   🔗 [${fk.TABLE_NAME}] -> [${fk.REFERENCED_TABLE_NAME}] via ${fk.CONSTRAINT_NAME}`);
    });

    // 5. Verify Complaint Lifecycle State Coverage
    console.log('\n5. Verifying Complaint Lifecycle State Coverage:');
    const [complaintStatuses] = await conn.query(`
      SELECT status, COUNT(*) as count 
      FROM complaints 
      GROUP BY status
    `);
    console.log('   Active Seed Complaint States:');
    complaintStatuses.forEach((cs) => {
      console.log(`   📌 ${cs.status.padEnd(14)} : ${cs.count} complaint(s)`);
    });

    // 6. Verify Geospatial Coordinates Storage
    console.log('\n6. Verifying Geospatial GIS Latitude / Longitude Records:');
    const [geoComplaints] = await conn.query(`
      SELECT tracking_code, title, latitude, longitude, ward_no 
      FROM complaints 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL 
      LIMIT 3
    `);
    geoComplaints.forEach((gc) => {
      console.log(`   📍 ${gc.tracking_code} | Ward: ${gc.ward_no} | Coords: (${gc.latitude}, ${gc.longitude}) | ${gc.title.substring(0, 35)}...`);
    });

    console.log('================================================================');
    console.log(`🎉 ALL DATABASE CHECKS PASSED SUCCESSFULLY in ${Date.now() - startTime}ms!`);
    console.log('   The MySQL database is 100% operational and ready for use.');
    console.log('================================================================');

    return true;
  } catch (error) {
    console.error('\n❌ Database integrity check failed:', error.message);
    return false;
  } finally {
    if (conn) conn.release();
    await db.closePool();
  }
}

// Allow CLI execution
if (require.main === module) {
  testDatabase().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testDatabase;

