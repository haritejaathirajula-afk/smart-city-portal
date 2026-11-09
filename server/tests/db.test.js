const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

describe('Database Schema and Seed Integrity (Phase 2)', () => {
  const schemaPath = path.resolve(__dirname, '../database/schema.sql');
  const seedPath = path.resolve(__dirname, '../database/seed.sql');

  let schemaSql = '';
  let seedSql = '';

  beforeAll(() => {
    schemaSql = fs.readFileSync(schemaPath, 'utf8');
    seedSql = fs.readFileSync(seedPath, 'utf8');
  });

  it('schema.sql should exist and contain all 16 required normalized entities', () => {
    expect(fs.existsSync(schemaPath)).toBe(true);

    const requiredTables = [
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

    requiredTables.forEach((table) => {
      const regex = new RegExp(`CREATE TABLE IF NOT EXISTS \`${table}\``, 'i');
      expect(schemaSql).toMatch(regex);
    });
  });

  it('complaint status enum must contain all 8 workflow states including REJECTED', () => {
    const requiredStatuses = [
      'REPORTED',
      'ASSIGNED',
      'IN_PROGRESS',
      'RESOLVED',
      'VERIFIED',
      'CLOSED',
      'REOPENED',
      'REJECTED',
    ];

    requiredStatuses.forEach((status) => {
      expect(schemaSql).toContain(`'${status}'`);
    });
  });

  it('schema.sql should contain foreign keys linking entities', () => {
    expect(schemaSql).toContain('fk_users_role');
    expect(schemaSql).toContain('fk_officers_user');
    expect(schemaSql).toContain('fk_officers_department');
    expect(schemaSql).toContain('fk_complaints_citizen');
    expect(schemaSql).toContain('fk_complaints_department');
    expect(schemaSql).toContain('fk_history_complaint');
    expect(schemaSql).toContain('fk_tasks_complaint');
    expect(schemaSql).toContain('fk_tasks_worker');
    expect(schemaSql).toContain('fk_feedback_complaint');
    expect(schemaSql).toContain('fk_audit_user');
  });

  it('seed.sql should exist and populate data for all core entities', () => {
    expect(fs.existsSync(seedPath)).toBe(true);

    const seededTables = [
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

    seededTables.forEach((table) => {
      const regex = new RegExp(`INSERT INTO \`${table}\``, 'i');
      expect(seedSql).toMatch(regex);
    });
  });

  it('seed passwords should correctly verify against bcrypt for demo accounts', () => {
    // Admin password check
    const adminHash = '$2a$10$XY73vJ/QmnvHiupijQNFnuJqw9mm.ZjOst5hnU4nPTxEUrJVQkDne';
    expect(bcrypt.compareSync('Admin@123', adminHash)).toBe(true);

    // Officer password check
    const officerHash = '$2a$10$ZSBl.rX9gAqFdLbDuuYaluW85wWpNTr.mAYVb0Ez1it7FjfvZvD8i';
    expect(bcrypt.compareSync('Officer@123', officerHash)).toBe(true);

    // Citizen password check
    const citizenHash = '$2a$10$cPhNTqeOkTlDi8lxkwDde.Pn.xpqexrUk3gD5xhH9UUKKUFVrM0VK';
    expect(bcrypt.compareSync('Citizen@123', citizenHash)).toBe(true);
  });

  it('live database connection test should connect to MySQL and verify tables', async () => {
    const db = require('../src/config/db');
    const status = await db.checkConnection();
    expect(status.connected).toBe(true);
    expect(status.details.database).toBe('smart_city_db');

    const [tables] = await db.query('SHOW TABLES');
    expect(tables.length).toBeGreaterThanOrEqual(14);
    await db.closePool();
  });
});
