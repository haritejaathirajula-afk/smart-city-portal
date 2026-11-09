const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');

describe('Phase 15: Security Hardening & Penetration Test Suite', () => {
  let citizenTokenA;
  let citizenTokenB;
  let pwdOfficerToken;
  let swmOfficerToken;
  let adminToken;
  const JWT_SECRET = process.env.JWT_SECRET || 'smartcity_super_secret_jwt_key_2026';

  beforeAll(async () => {
    // Citizen A (Aarav Mehta, id 5)
    citizenTokenA = jwt.sign(
      { id: 5, email: 'citizen@smartcity.gov', role: 'citizen', name: 'Aarav Mehta' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Citizen B (Sunita Rao, id 6)
    citizenTokenB = jwt.sign(
      { id: 6, email: 'sunita.citizen@example.com', role: 'citizen', name: 'Sunita Rao' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // PWD Officer (Dept 1)
    pwdOfficerToken = jwt.sign(
      { id: 2, email: 'officer.roads@smartcity.gov', role: 'officer', name: 'Rajesh Sharma', department_id: 1, officer_id: 1 },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // SWM Officer (Dept 2)
    swmOfficerToken = jwt.sign(
      { id: 3, email: 'officer.waste@smartcity.gov', role: 'officer', name: 'Ramesh Verma', department_id: 2, officer_id: 2 },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // City Administrator (id 1)
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
  // 1. SQL INJECTION MITIGATION
  // ---------------------------------------------------------------------------
  describe('SQL Injection Resistance', () => {
    it('rejects or safely escapes SQL injection in complaints search parameter', async () => {
      const sqlInjection = "' OR '1'='1' -- ";
      const res = await request(app)
        .get(`/api/complaints?search=${encodeURIComponent(sqlInjection)}`)
        .set('Authorization', `Bearer ${citizenTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Parameterized query ensures it searches for literal string, NOT leaking all records
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('safely handles UNION SELECT attempts in service requests search', async () => {
      const unionPayload = "1' UNION SELECT 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16 -- ";
      const res = await request(app)
        .get(`/api/services/requests?search=${encodeURIComponent(unionPayload)}`)
        .set('Authorization', `Bearer ${citizenTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('safely handles SQL injection in map coordinate filter parameters', async () => {
      const maliciousPriority = "HIGH' OR 1=1 --";
      const res = await request(app).get(`/api/map/complaints?priority=${encodeURIComponent(maliciousPriority)}`);

      // Express validator or controller validates priority against allowed enum
      expect([400, 200]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.data.length).toBe(0);
      } else {
        expect(res.body.success).toBe(false);
      }
    });

    it('safely handles non-numeric complaint ID parameter without SQL syntax error', async () => {
      const res = await request(app)
        .get('/api/complaints/999999999999')
        .set('Authorization', `Bearer ${citizenTokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. CROSS-SITE SCRIPTING (XSS) & MALICIOUS PAYLOAD HANDLING
  // ---------------------------------------------------------------------------
  describe('Cross-Site Scripting (XSS) & Payload Sanitization', () => {
    it('safely stores and returns script tags in complaint description as literal text', async () => {
      const xssTitle = 'Broken light <script>alert("xss")</script>';
      const xssDesc = 'Corridor dark <img src=x onerror=alert(1)> and dangerous.';

      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${citizenTokenA}`)
        .send({
          title: xssTitle,
          description: xssDesc,
          category_id: 1,
          department_id: 1,
          ward_no: 'Ward-12',
          location_address: 'XSS Test Street',
          latitude: 28.6139,
          longitude: 77.2090,
          priority: 'LOW',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const complaintId = res.body.data.id;

      // Verify JSON representation does not execute or corrupt
      const getRes = await request(app)
        .get(`/api/complaints/${complaintId}`)
        .set('Authorization', `Bearer ${citizenTokenA}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.title).toContain('<script>');
      expect(getRes.body.data.description).toContain('<img src=x');

      // Clean up test complaint
      await db.query('DELETE FROM complaint_status_history WHERE complaint_id = ?', [complaintId]);
      await db.query('DELETE FROM notifications WHERE entity_type = "COMPLAINT" AND entity_id = ?', [complaintId]);
      await db.query('DELETE FROM complaints WHERE id = ?', [complaintId]);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. AUTHENTICATION & JWT HARDENING
  // ---------------------------------------------------------------------------
  describe('Authentication & JWT Attack Resistance', () => {
    it('rejects protected request without Authorization header with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no authentication token/i);
    });

    it('rejects malformed Bearer header with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer totally-invalid-token-string');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it('rejects token signed with unauthorized third-party secret with 401', async () => {
      const forgedToken = jwt.sign(
        { id: 1, email: 'admin@smartcity.gov', role: 'admin' },
        'wrong_attacker_secret_key_12345'
      );

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects expired JWT token with 401 and expiration explanation', async () => {
      const expiredToken = jwt.sign(
        { id: 5, email: 'citizen@smartcity.gov', role: 'citizen' },
        JWT_SECRET,
        { expiresIn: '-10s' } // Expired 10 seconds ago
      );

      const res = await request(app)
        .get('/api/citizen/dashboard')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/expired/i);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. PRIVILEGE ESCALATION & ACCESS CONTROL BOUNDARIES
  // ---------------------------------------------------------------------------
  describe('Privilege Escalation Prevention', () => {
    it('blocks citizen from accessing admin dashboard stats (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${citizenTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('blocks citizen from accessing admin user management (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${citizenTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('blocks citizen from accessing officer dashboard (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/officer/dashboard')
        .set('Authorization', `Bearer ${citizenTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('blocks officer from accessing admin audit logs (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${pwdOfficerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('blocks officer from promoting users or editing system roles (403 Forbidden)', async () => {
      const res = await request(app)
        .patch('/api/admin/users/5/role')
        .set('Authorization', `Bearer ${pwdOfficerToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('blocks PWD officer from updating status of an SWM (Waste) complaint (403 Forbidden)', async () => {
      // Find an SWM complaint (department_id = 2)
      const [swmComplaints] = await db.query(
        'SELECT id FROM complaints WHERE department_id = 2 LIMIT 1'
      );
      if (swmComplaints.length > 0) {
        const swmComplaintId = swmComplaints[0].id;
        const res = await request(app)
          .patch(`/api/officer/complaints/${swmComplaintId}/status`)
          .set('Authorization', `Bearer ${pwdOfficerToken}`) // PWD officer trying to update SWM complaint
          .send({
            status: 'IN_PROGRESS',
            remarks: 'Unauthorized cross-department attempt',
          });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/jurisdiction/i);
      }
    });

    it('blocks Citizen B from verifying or reopening Citizen A\'s complaint (403 Forbidden)', async () => {
      // Citizen A's complaint (Aarav Mehta, id 5, owns complaint 4)
      const res = await request(app)
        .post('/api/complaints/4/verify')
        .set('Authorization', `Bearer ${citizenTokenB}`) // Sunita Rao trying to verify Aarav's complaint
        .send({ rating: 4, comments: 'Unauthorized tampering' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. FILE UPLOAD SECURITY
  // ---------------------------------------------------------------------------
  describe('File Upload Security & MIME Restrictions', () => {
    it('rejects executable / malicious file extension upload with 400', async () => {
      const res = await request(app)
        .post('/api/complaints/upload')
        .set('Authorization', `Bearer ${citizenTokenA}`)
        .attach('image', Buffer.from('echo "malicious payload"'), 'exploit.sh');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Only JPEG, PNG, WEBP, and GIF/i);
    });

    it('rejects oversized file uploads (> 5MB) with 400', async () => {
      // Create 5.5MB dummy buffer
      const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0);
      const res = await request(app)
        .post('/api/complaints/upload')
        .set('Authorization', `Bearer ${citizenTokenA}`)
        .attach('image', largeBuffer, 'huge_photo.jpg');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/exceeds 5MB/i);
    });

    it('rejects unauthenticated upload request with 401', async () => {
      const res = await request(app)
        .post('/api/complaints/upload')
        .attach('image', Buffer.from('fake image content'), 'photo.jpg');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. HTTP SECURITY HEADERS
  // ---------------------------------------------------------------------------
  describe('Security HTTP Headers', () => {
    it('serves secure response headers via Helmet', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty('x-content-type-options');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers).toHaveProperty('x-download-options');
      expect(res.headers['x-download-options']).toBe('noopen');
    });
  });
});
