const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const env = require('../src/config/env');

afterAll(async () => {
  // Reset complaint 1 back to PWD department for full suite consistency
  const check = await db.checkConnection();
  if (check.connected) {
    await db.query(
      "UPDATE complaints SET department_id = 1, status = 'REPORTED', assigned_officer_id = NULL, rejection_reason = NULL, resolved_at = NULL WHERE id = 1"
    );
  }
  await db.closePool();
});

describe('Admin Dashboard, Department, Category & Complaint Management API (Phase 9)', () => {
  let adminToken;
  let citizenToken;
  let officerToken;
  const JWT_SECRET = env.jwt.secret || 'smartcity_super_secret_jwt_key_2026';

  beforeAll(() => {
    adminToken = jwt.sign(
      { id: 1, email: 'admin@smartcity.gov', role: 'admin', name: 'City Administrator' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    officerToken = jwt.sign(
      { id: 2, email: 'officer.roads@smartcity.gov', role: 'officer', name: 'Rajesh Sharma' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    citizenToken = jwt.sign(
      { id: 4, email: 'citizen@smartcity.gov', role: 'citizen', name: 'Amit Kumar' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('RBAC & Access Control', () => {
    it('GET /api/admin/stats should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
    });

    it('GET /api/admin/stats should return 403 Forbidden when accessed by citizen or officer', async () => {
      const resCitizen = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(resCitizen.status).toBe(403);

      const resOfficer = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${officerToken}`);
      expect(resOfficer.status).toBe(403);
    });
  });

  describe('GET /api/admin/stats (Overview & System KPIs)', () => {
    it('should return system KPIs, department metrics and recent audit logs for admin', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('kpis');
      expect(res.body.data.kpis).toHaveProperty('totalComplaints');
      expect(res.body.data.kpis).toHaveProperty('activeComplaints');
      expect(res.body.data.kpis).toHaveProperty('resolvedComplaints');
      expect(res.body.data).toHaveProperty('deptBreakdown');
      expect(Array.isArray(res.body.data.deptBreakdown)).toBe(true);
      expect(res.body.data).toHaveProperty('recentActivity');
    });
  });

  describe('User & Role Management (/api/admin/users)', () => {
    it('GET /api/admin/users should return list of registered users with search and role filters', async () => {
      const res = await request(app)
        .get('/api/admin/users?role=citizen')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.every((u) => u.role_name === 'citizen')).toBe(true);
    });

    it('PATCH /api/admin/users/:id/status should reject non-boolean status with 400', async () => {
      const res = await request(app)
        .patch('/api/admin/users/4/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('boolean');
    });

    it('PATCH /api/admin/users/:id/status should prevent administrator from disabling own account', async () => {
      const res = await request(app)
        .patch('/api/admin/users/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: false });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('disable their own account');
    });

    it('PATCH /api/admin/users/:id/status should successfully toggle user active state', async () => {
      const res = await request(app)
        .patch('/api/admin/users/4/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Active');
    });

    it('PATCH /api/admin/users/:id/role should prevent administrator from demoting self', async () => {
      const res = await request(app)
        .patch('/api/admin/users/1/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role_name: 'citizen' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('demote their own account');
    });

    it('PATCH /api/admin/users/:id/role should reject officer promotion without required metadata', async () => {
      const res = await request(app)
        .patch('/api/admin/users/4/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role_name: 'officer' }); // missing department_id, badge_number, designation

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Promoting to officer requires');
    });

    it('PATCH /api/admin/users/:id/role should successfully promote user to officer with department assignment', async () => {
      const res = await request(app)
        .patch('/api/admin/users/4/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role_name: 'officer',
          department_id: 1,
          badge_number: 'PWD-OFF-TEST4',
          designation: 'Junior Engineer (Roads)',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Restore user 4 back to citizen for subsequent tests
      await request(app)
        .patch('/api/admin/users/4/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role_name: 'citizen' });
    });
  });

  describe('Department Management (/api/admin/departments)', () => {
    it('GET /api/admin/departments should return all municipal departments with metrics', async () => {
      const res = await request(app)
        .get('/api/admin/departments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('code');
      expect(res.body.data[0]).toHaveProperty('category_count');
      expect(res.body.data[0]).toHaveProperty('active_complaints');
    });

    it('POST /api/admin/departments should reject missing code or name with 400', async () => {
      const res = await request(app)
        .post('/api/admin/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Incomplete department' });

      expect(res.status).toBe(400);
    });

    it('POST /api/admin/departments should reject duplicate department code with 409', async () => {
      const res = await request(app)
        .post('/api/admin/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'PWD', // existing code
          name: 'Public Works Duplicate',
        });

      expect(res.status).toBe(409);
    });

    it('POST /api/admin/departments should create a new department', async () => {
      const randomCode = `DPT${Math.floor(100 + Math.random() * 900)}`;
      const res = await request(app)
        .post('/api/admin/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: randomCode,
          name: `Civil Defense & Emergency Wing ${randomCode}`,
          description: 'Emergency response coordination',
          contact_email: 'defense@smartcity.gov',
          contact_phone: '+91 11 2345 9999',
          head_officer_name: 'Col. K. R. Nair',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe(randomCode);
    });

    it('PUT /api/admin/departments/:id should update department contact info', async () => {
      const res = await request(app)
        .put('/api/admin/departments/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          contact_email: 'pwd.ops@smartcity.gov',
          head_officer_name: 'Er. Ramesh Verma (Chief Engineer)',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Category & SLA Management (/api/admin/categories)', () => {
    it('GET /api/admin/categories should return all complaint categories with SLAs', async () => {
      const res = await request(app)
        .get('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('department_name');
      expect(res.body.data[0]).toHaveProperty('sla_hours');
    });

    it('POST /api/admin/categories should reject missing required fields with 400', async () => {
      const res = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sla_hours: 24 });

      expect(res.status).toBe(400);
    });

    it('POST /api/admin/categories should create new category under a department', async () => {
      const uniqueCatName = `Damaged Signboard ${Date.now()}`;
      const res = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          department_id: 1,
          name: uniqueCatName,
          description: 'Broken, tilted or obscured traffic signboards',
          sla_hours: 36,
          default_priority: 'MEDIUM',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(uniqueCatName);
      expect(res.body.data.sla_hours).toBe(36);
    });

    it('PUT /api/admin/categories/:id should update category SLA hours and default priority', async () => {
      const res = await request(app)
        .put('/api/admin/categories/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sla_hours: 36,
          default_priority: 'HIGH',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Complaint Triage & Reassignment (/api/admin/complaints)', () => {
    it('GET /api/admin/complaints should return global complaints with filtering', async () => {
      const res = await request(app)
        .get('/api/admin/complaints?department_id=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.every((c) => c.department_id === 1)).toBe(true);
    });

    it('PATCH /api/admin/complaints/:id/reassign should reject missing department with 400', async () => {
      const res = await request(app)
        .patch('/api/admin/complaints/1/reassign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('department_id is required');
    });

    it('PATCH /api/admin/complaints/:id/reassign should reject non-existent complaint with 404', async () => {
      const res = await request(app)
        .patch('/api/admin/complaints/99999/reassign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ department_id: 2 });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Complaint not found');
    });

    it('PATCH /api/admin/complaints/:id/reassign should reassign complaint and record in status history', async () => {
      const res = await request(app)
        .patch('/api/admin/complaints/1/reassign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          department_id: 2,
          remarks: 'Transferred by Admin to Solid Waste Management for expedited cleanup',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.department_id).toBe(2);

      // Verify in DB that status history record was inserted
      const check = await db.checkConnection();
      if (check.connected) {
        const [history] = await db.query(
          'SELECT remarks FROM complaint_status_history WHERE complaint_id = 1 ORDER BY id DESC LIMIT 1'
        );
        expect(history[0].remarks).toContain('Transferred by Admin');
      }
    });
  });

  describe('Audit Trail (/api/admin/audit-logs)', () => {
    it('GET /api/admin/audit-logs should return chronological system audit trail', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('action');
      expect(res.body.data[0]).toHaveProperty('user_name');
    });
  });
});
