const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');

describe('Phase 15: Role-Based Access Control (RBAC) Matrix Test Suite', () => {
  let citizenToken;
  let officerToken;
  let adminToken;
  const JWT_SECRET = process.env.JWT_SECRET || 'smartcity_super_secret_jwt_key_2026';

  beforeAll(async () => {
    citizenToken = jwt.sign(
      { id: 5, email: 'citizen@smartcity.gov', role: 'citizen', name: 'Aarav Mehta' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    officerToken = jwt.sign(
      { id: 2, email: 'officer.roads@smartcity.gov', role: 'officer', name: 'Rajesh Sharma', department_id: 1, officer_id: 1 },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { id: 1, email: 'admin@smartcity.gov', role: 'admin', name: 'City Administrator' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await db.closePool();
  });

  // ---------------------------------------------------------------------------
  // 1. CITIZEN DOMAIN ACCESS MATRIX
  // ---------------------------------------------------------------------------
  describe('Citizen Domain Access Matrix', () => {
    it('Anonymous user cannot access citizen dashboard (401)', async () => {
      const res = await request(app).get('/api/citizen/dashboard');
      expect(res.status).toBe(401);
    });

    it('Citizen user successfully accesses citizen dashboard (200)', async () => {
      const res = await request(app)
        .get('/api/citizen/dashboard')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Municipal Officer is forbidden from citizen dashboard (403)', async () => {
      const res = await request(app)
        .get('/api/citizen/dashboard')
        .set('Authorization', `Bearer ${officerToken}`);
      expect(res.status).toBe(403);
    });

    it('Administrator has authorized oversight access to citizen dashboard (200)', async () => {
      const res = await request(app)
        .get('/api/citizen/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. OFFICER DOMAIN ACCESS MATRIX
  // ---------------------------------------------------------------------------
  describe('Officer Domain Access Matrix', () => {
    it('Anonymous user cannot access officer dashboard (401)', async () => {
      const res = await request(app).get('/api/officer/dashboard');
      expect(res.status).toBe(401);
    });

    it('Citizen is forbidden from officer dashboard (403)', async () => {
      const res = await request(app)
        .get('/api/officer/dashboard')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.status).toBe(403);
    });

    it('Municipal Officer successfully accesses officer dashboard (200)', async () => {
      const res = await request(app)
        .get('/api/officer/dashboard')
        .set('Authorization', `Bearer ${officerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Administrator has authorized oversight access to officer dashboard (200)', async () => {
      const res = await request(app)
        .get('/api/officer/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('Citizen is forbidden from fetching field workers (403)', async () => {
      const res = await request(app)
        .get('/api/officer/field-workers')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.status).toBe(403);
    });

    it('Officer successfully fetches department field workers (200)', async () => {
      const res = await request(app)
        .get('/api/officer/field-workers')
        .set('Authorization', `Bearer ${officerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. ADMIN DOMAIN ACCESS MATRIX
  // ---------------------------------------------------------------------------
  describe('Admin Domain Access Matrix', () => {
    it('Anonymous user cannot access admin stats (401)', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
    });

    it('Citizen is forbidden from admin stats (403)', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.status).toBe(403);
    });

    it('Municipal Officer is forbidden from admin stats (403)', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${officerToken}`);
      expect(res.status).toBe(403);
    });

    it('Administrator successfully accesses admin stats (200)', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Anonymous user cannot access user management (401)', async () => {
      const res = await request(app).get('/api/admin/users');
      expect(res.status).toBe(401);
    });

    it('Citizen is forbidden from admin user management (403)', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.status).toBe(403);
    });

    it('Officer is forbidden from admin user management (403)', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${officerToken}`);
      expect(res.status).toBe(403);
    });

    it('Administrator successfully accesses user management (200)', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Officer is forbidden from administrative audit logs (403)', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${officerToken}`);
      expect(res.status).toBe(403);
    });

    it('Administrator successfully accesses audit logs (200)', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. EMERGENCY BROADCAST & ANNOUNCEMENTS MATRIX
  // ---------------------------------------------------------------------------
  describe('Emergency Broadcast & Announcements Access Matrix', () => {
    it('Anonymous user cannot post announcements (401)', async () => {
      const res = await request(app).post('/api/announcements').send({});
      expect(res.status).toBe(401);
    });

    it('Citizen is forbidden from publishing announcements (403)', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ title: 'Test', content: 'Test' });
      expect(res.status).toBe(403);
    });

    it('Officer has authorized role access to publish announcements (passes RBAC guard)', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({});
      // Officer passes RBAC authorization guard and reaches controller validation (400 Bad Request, not 403 Forbidden)
      expect(res.status).not.toBe(403);
    });

    it('Citizen is forbidden from issuing emergency broadcast alerts (403)', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ title: 'Emergency', message: 'Flooding' });
      expect(res.status).toBe(403);
    });

    it('Officer has authorized role access to issue emergency broadcast alerts (passes RBAC guard)', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({});
      // Officer passes RBAC authorization guard and reaches controller validation (400 Bad Request, not 403 Forbidden)
      expect(res.status).not.toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. GEOSPATIAL OFFICER VIEW MATRIX
  // ---------------------------------------------------------------------------
  describe('Geospatial Officer View Access Matrix', () => {
    it('Anonymous user cannot access officer map view (401)', async () => {
      const res = await request(app).get('/api/map/officer-view');
      expect(res.status).toBe(401);
    });

    it('Citizen is forbidden from officer map view (403)', async () => {
      const res = await request(app)
        .get('/api/map/officer-view')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.status).toBe(403);
    });

    it('Officer successfully accesses jurisdictional map view (200)', async () => {
      const res = await request(app)
        .get('/api/map/officer-view')
        .set('Authorization', `Bearer ${officerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Administrator successfully accesses jurisdictional map view (200)', async () => {
      const res = await request(app)
        .get('/api/map/officer-view')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
