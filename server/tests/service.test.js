const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');

describe('Municipal Service Requests API (Phase 10)', () => {
  let citizenToken;
  let otherCitizenToken;
  let pwdOfficerToken;
  let swmOfficerToken;
  let adminToken;
  let testCreatedRequestId;
  let testCreatedRequestCode;
  const JWT_SECRET = process.env.JWT_SECRET || 'smartcity_super_secret_jwt_key_2026';

  beforeAll(async () => {
    citizenToken = jwt.sign(
      { id: 5, email: 'citizen@smartcity.gov', role: 'citizen', name: 'Aarav Mehta' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    otherCitizenToken = jwt.sign(
      { id: 6, email: 'sunita.citizen@example.com', role: 'citizen', name: 'Sunita Rao' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    pwdOfficerToken = jwt.sign(
      { id: 2, email: 'officer.roads@smartcity.gov', role: 'officer', name: 'Rajesh Sharma', department_id: 1 },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    swmOfficerToken = jwt.sign(
      { id: 3, email: 'officer.sanitation@smartcity.gov', role: 'officer', name: 'Officer Fatima Al-Hassan', department_id: 2 },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    adminToken = jwt.sign(
      { id: 1, email: 'admin@smartcity.gov', role: 'admin', name: 'City Administrator' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Ensure category 5 (PWD) exists for cross-department tests
    try {
      await db.query(`
        INSERT INTO service_categories (id, department_id, name, description, estimated_days, fee, is_active)
        VALUES (5, 1, 'Emergency Asphalt Pothole Patching & Trench Restoration', 'Rapid deployment of asphalt hot-mix crew and roller for deep craters.', 2, 0.00, TRUE)
        ON DUPLICATE KEY UPDATE is_active = TRUE
      `);
    } catch (e) {
      // Ignore if DB not writable
    }
  });

  afterAll(async () => {
    // Cleanup any test requests created during testing
    try {
      if (testCreatedRequestId) {
        await db.query('DELETE FROM notifications WHERE entity_type = "SERVICE_REQUEST" AND entity_id = ?', [testCreatedRequestId]);
        await db.query('DELETE FROM audit_logs WHERE entity_type = "SERVICE_REQUEST" AND entity_id = ?', [testCreatedRequestId]);
        await db.query('DELETE FROM service_requests WHERE id = ?', [testCreatedRequestId]);
      }
      // Reset baseline seed requests 1 and 2
      await db.query('UPDATE service_requests SET status = "APPROVED", resolution_notes = "Tanker vehicle DL-1GB-4421 dispatched with technician." WHERE id = 1');
      await db.query('UPDATE service_requests SET status = "SUBMITTED", resolution_notes = NULL WHERE id = 2');
    } catch (e) {
      // Ignore cleanup error in mock mode
    }
  });

  // 1. Service Catalog (Public / Authenticated)
  describe('GET /api/services/catalog', () => {
    it('should return 200 and public list of active municipal services', async () => {
      const res = await request(app).get('/api/services/catalog');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      const first = res.body.data[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('department_name');
      expect(first).toHaveProperty('fee');
      expect(first).toHaveProperty('estimated_days');
    });
  });

  // 2. Service Request Submission
  describe('POST /api/services/requests', () => {
    it('without token should return 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/services/requests')
        .send({
          service_category_id: 1,
          details: 'Need drinking water tanker urgently',
          address: '42, Green Avenue, Ward 12',
        });
      expect(res.status).toBe(401);
    });

    it('with missing required fields should return 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/services/requests')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          service_category_id: 1,
          // details and address missing
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('with details shorter than 5 characters should return 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/services/requests')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          service_category_id: 1,
          details: 'Help',
          address: '42, Green Avenue, Ward 12',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('with non-existent service category should return 404', async () => {
      const res = await request(app)
        .post('/api/services/requests')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          service_category_id: 99999,
          details: 'Need urgent municipal service assistance',
          address: '42, Green Avenue, Ward 12',
        });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('by citizen should create request, generate SRV-YYYY-XXXXX tracking code and return 201', async () => {
      const res = await request(app)
        .post('/api/services/requests')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          service_category_id: 2, // Bulk Debris Pickup (SWM)
          details: 'Large renovation debris bags stacked in private driveway requiring tipper truck.',
          address: 'Block C, House 14, Sector 7, Ward 08',
          ward_no: 'Ward-08',
          preferred_slot: 'Morning (09:00 AM - 12:00 PM)',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('request_code');
      expect(res.body.data.request_code).toMatch(/^SRV-\d{4}-\d{5}$/);
      expect(res.body.data.status).toBe('SUBMITTED');
      expect(res.body.data.citizen_id).toBe(5);

      testCreatedRequestId = res.body.data.id;
      testCreatedRequestCode = res.body.data.request_code;
    });
  });

  // 3. Service Requests Listing & Role Scoping
  describe('GET /api/services/requests', () => {
    it('without token should return 401 Unauthorized', async () => {
      const res = await request(app).get('/api/services/requests');
      expect(res.status).toBe(401);
    });

    it('by citizen should return their submitted requests', async () => {
      const res = await request(app)
        .get('/api/services/requests')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      // Citizen with id 5 should only see their own requests
      res.body.data.forEach((item) => {
        expect(item.citizen_id).toBe(5);
      });
    });

    it('by SWM officer should only return requests in department 2', async () => {
      const res = await request(app)
        .get('/api/services/requests')
        .set('Authorization', `Bearer ${swmOfficerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((item) => {
        expect(item.department_id).toBe(2);
      });
    });

    it('by admin should return all municipal requests across departments', async () => {
      const res = await request(app)
        .get('/api/services/requests')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('with status filter should return filtered requests', async () => {
      const res = await request(app)
        .get('/api/services/requests?status=SUBMITTED')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      res.body.data.forEach((item) => {
        expect(item.status).toBe('SUBMITTED');
      });
    });

    it('with search query should filter by tracking code or details', async () => {
      const res = await request(app)
        .get('/api/services/requests?search=debris')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // 4. Retrieve Single Request Details
  describe('GET /api/services/requests/:idOrCode', () => {
    it('with invalid idOrCode should return 404', async () => {
      const res = await request(app)
        .get('/api/services/requests/SRV-9999-99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('by other citizen trying to access another citizen request should return 403 Forbidden', async () => {
      // testCreatedRequestId belongs to citizen 5 (citizenToken)
      if (testCreatedRequestId) {
        const res = await request(app)
          .get(`/api/services/requests/${testCreatedRequestId}`)
          .set('Authorization', `Bearer ${otherCitizenToken}`); // citizen 6

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      }
    });

    it('by request owner citizen should return 200 with complete request details', async () => {
      if (testCreatedRequestId) {
        const res = await request(app)
          .get(`/api/services/requests/${testCreatedRequestId}`)
          .set('Authorization', `Bearer ${citizenToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(testCreatedRequestId);
        expect(res.body.data.request_code).toBe(testCreatedRequestCode);
      }
    });
  });

  // 5. Status Updates & Officer Department Jurisdiction Enforcement
  describe('PATCH /api/services/requests/:id/status', () => {
    it('by citizen should return 403 Forbidden (officer/admin role required)', async () => {
      const res = await request(app)
        .patch(`/api/services/requests/${testCreatedRequestId || 2}/status`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(403);
    });

    it('with invalid status value should return 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/services/requests/${testCreatedRequestId || 2}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED_INVALID_STATUS' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('by cross-department officer (PWD officer on SWM request) should return 403 Forbidden', async () => {
      // testCreatedRequestId is SWM (department 2), pwdOfficerToken is Department 1
      const targetId = testCreatedRequestId || 2;
      const res = await request(app)
        .patch(`/api/services/requests/${targetId}/status`)
        .set('Authorization', `Bearer ${pwdOfficerToken}`)
        .send({
          status: 'APPROVED',
          resolution_notes: 'Attempting cross-department unauthorized approval',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/jurisdiction/i);
    });

    it('with status REJECTED but missing resolution notes should return 400 Bad Request', async () => {
      const targetId = testCreatedRequestId || 2;
      const res = await request(app)
        .patch(`/api/services/requests/${targetId}/status`)
        .set('Authorization', `Bearer ${swmOfficerToken}`)
        .send({
          status: 'REJECTED',
          resolution_notes: '', // Empty notes
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/resolution notes/i);
    });

    it('by authorized department officer updating status to APPROVED should return 200', async () => {
      const targetId = testCreatedRequestId || 2;
      const res = await request(app)
        .patch(`/api/services/requests/${targetId}/status`)
        .set('Authorization', `Bearer ${swmOfficerToken}`)
        .send({
          status: 'APPROVED',
          resolution_notes: 'Tipper truck MH-04-1294 scheduled with driver Ramesh.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
    });

    it('by authorized department officer updating status to IN_PROGRESS should return 200', async () => {
      const targetId = testCreatedRequestId || 2;
      const res = await request(app)
        .patch(`/api/services/requests/${targetId}/status`)
        .set('Authorization', `Bearer ${swmOfficerToken}`)
        .send({
          status: 'IN_PROGRESS',
          resolution_notes: 'Crew actively loading debris onto tipper vehicle.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    it('by admin updating status to COMPLETED should set timestamp and return 200', async () => {
      const targetId = testCreatedRequestId || 2;
      const res = await request(app)
        .patch(`/api/services/requests/${targetId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'COMPLETED',
          resolution_notes: 'All bulk construction waste cleared; driveway swept clean.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.completed_at).toBeTruthy();
    });
  });

  // 6. Citizen Cancellation Workflow
  describe('PATCH /api/services/requests/:id/cancel', () => {
    let cancelableRequestId;

    beforeAll(async () => {
      // Create a fresh submitted request to test cancellation
      try {
        const [res] = await db.query(
          `INSERT INTO service_requests (request_code, citizen_id, service_category_id, department_id, details, address, ward_no, preferred_slot, status)
           VALUES ('SRV-2026-99991', 5, 1, 3, 'Temporary request for cancellation test', 'Sector 9, Ward 12', 'Ward-12', 'Morning', 'SUBMITTED')`
        );
        cancelableRequestId = res.insertId;
      } catch (e) {
        cancelableRequestId = 1;
      }
    });

    afterAll(async () => {
      try {
        if (cancelableRequestId) {
          await db.query('DELETE FROM notifications WHERE entity_type = "SERVICE_REQUEST" AND entity_id = ?', [cancelableRequestId]);
          await db.query('DELETE FROM audit_logs WHERE entity_type = "SERVICE_REQUEST" AND entity_id = ?', [cancelableRequestId]);
          await db.query('DELETE FROM service_requests WHERE id = ?', [cancelableRequestId]);
        }
      } catch (e) {}
    });

    it('by other citizen trying to cancel non-owned request should return 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/services/requests/${cancelableRequestId}/cancel`)
        .set('Authorization', `Bearer ${otherCitizenToken}`); // user 6 trying to cancel user 5's request

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('by owning citizen should successfully cancel request and return 200', async () => {
      const res = await request(app)
        .patch(`/api/services/requests/${cancelableRequestId}/cancel`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ reason: 'Water supply restored by society pump repair' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('REJECTED');
      expect(res.body.data.resolution_notes).toContain('Cancelled by Citizen');
    });

    it('attempting to cancel an already cancelled request should return 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/services/requests/${cancelableRequestId}/cancel`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already cancelled/i);
    });
  });

  afterAll(async () => {
    await db.closePool();
  });
});
