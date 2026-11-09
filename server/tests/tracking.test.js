const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const db = require('../src/config/db');

afterAll(async () => {
  await db.closePool();
});

describe('Complaint Tracking and Status History API (Phase 7)', () => {
  // Citizen Aarav Mehta (id: 5, owner of complaint #4 and #1)
  const citizenToken = jwt.sign(
    { id: 5, email: 'citizen@smartcity.gov', name: 'Aarav Mehta', role: 'citizen', ward_no: 'Ward-12' },
    env.jwt.secret,
    { expiresIn: '1h' }
  );

  // Citizen Pooja Iyer (id: 6, owner of complaint #2)
  const otherCitizenToken = jwt.sign(
    { id: 6, email: 'pooja.iyer@smartcity.gov', name: 'Pooja Iyer', role: 'citizen', ward_no: 'Ward-08' },
    env.jwt.secret,
    { expiresIn: '1h' }
  );

  beforeEach(async () => {
    // Reset complaints status so verify and reopen test cases are isolated and repeatable
    const check = await db.checkConnection();
    if (check.connected) {
      await db.query("UPDATE complaints SET status = 'REPORTED' WHERE id = 1");
      await db.query("UPDATE complaints SET status = 'RESOLVED' WHERE id = 4");
    }
  });

  describe('GET /api/complaints (List & Search & Filters)', () => {
    it('should return list of complaints and total count', async () => {
      const res = await request(app).get('/api/complaints');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('pagination');
    });

    it('should filter complaints by status', async () => {
      const res = await request(app).get('/api/complaints?status=IN_PROGRESS');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      res.body.data.forEach((c) => {
        expect(c.status).toBe('IN_PROGRESS');
      });
    });

    it('should filter complaints by department_id', async () => {
      const res = await request(app).get('/api/complaints?department_id=1');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter complaints by priority', async () => {
      const res = await request(app).get('/api/complaints?priority=HIGH');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      res.body.data.forEach((c) => {
        expect(c.priority).toBe('HIGH');
      });
    });

    it('should search complaints by tracking code keyword', async () => {
      const res = await request(app).get('/api/complaints?search=CMP-2026-00104');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].tracking_code).toBe('CMP-2026-00104');
    });
  });

  describe('GET /api/complaints/:idOrCode (Details & Status Timeline)', () => {
    it('should return single complaint with status history by tracking code', async () => {
      const res = await request(app).get('/api/complaints/CMP-2026-00104');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('tracking_code', 'CMP-2026-00104');
      expect(res.body.data).toHaveProperty('status_history');
      expect(Array.isArray(res.body.data.status_history)).toBe(true);
      expect(res.body.data.status_history.length).toBeGreaterThan(0);
      expect(res.body.data.status_history[0]).toHaveProperty('new_status');
    });

    it('should return single complaint by numeric ID', async () => {
      const res = await request(app).get('/api/complaints/4');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('id', 4);
    });

    it('should return 404 for non-existent tracking code', async () => {
      const res = await request(app).get('/api/complaints/CMP-0000-00000');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/complaints/:id/verify (Resolution Verification & Rating)', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).post('/api/complaints/4/verify').send({ rating: 5 });
      expect(res.statusCode).toBe(401);
    });

    it('should reject non-owner citizen trying to verify another citizen complaint with 403', async () => {
      // Complaint 4 belongs to Aarav Mehta (id: 5), accessing with Pooja Iyer (id: 6)
      const res = await request(app)
        .post('/api/complaints/4/verify')
        .set('Authorization', `Bearer ${otherCitizenToken}`)
        .send({ rating: 5, comments: 'Unauthorized test' });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('not authorized');
    });

    it('should reject verification when complaint is not in RESOLVED status with 400', async () => {
      // Complaint 1 is in REPORTED status
      const res = await request(app)
        .post('/api/complaints/1/verify')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ rating: 4 });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('must be in RESOLVED status');
    });

    it('should successfully verify RESOLVED complaint and store feedback rating', async () => {
      const res = await request(app)
        .post('/api/complaints/4/verify')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          rating: 5,
          comments: 'Pipe repair completed quickly with proper asphalt reinstatement.',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      // Verify in DB
      const check = await db.checkConnection();
      if (check.connected) {
        const [rows] = await db.query('SELECT status FROM complaints WHERE id = 4');
        expect(rows[0].status).toBe('VERIFIED');

        const [historyRows] = await db.query(
          "SELECT * FROM complaint_status_history WHERE complaint_id = 4 AND new_status = 'VERIFIED'"
        );
        expect(historyRows.length).toBeGreaterThanOrEqual(1);

        const [feedbackRows] = await db.query('SELECT * FROM feedback WHERE complaint_id = 4');
        expect(feedbackRows.length).toBeGreaterThanOrEqual(1);
        expect(feedbackRows[0].rating).toBe(5);
      }
    });
  });

  describe('POST /api/complaints/:id/reopen (Reject Resolution & Reopen)', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).post('/api/complaints/4/reopen').send({ remarks: 'Rejected' });
      expect(res.statusCode).toBe(401);
    });

    it('should reject non-owner citizen trying to reopen another citizen complaint with 403', async () => {
      const res = await request(app)
        .post('/api/complaints/4/reopen')
        .set('Authorization', `Bearer ${otherCitizenToken}`)
        .send({ remarks: 'I want to reopen this' });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('not authorized');
    });

    it('should reject reopening without clear remarks with 400', async () => {
      const res = await request(app)
        .post('/api/complaints/4/reopen')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ remarks: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should successfully transition RESOLVED complaint to REOPENED with clear remarks', async () => {
      const res = await request(app)
        .post('/api/complaints/4/reopen')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          remarks: 'Water pressure dropped again and damp patch visible on road.',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      // Verify in DB
      const check = await db.checkConnection();
      if (check.connected) {
        const [rows] = await db.query('SELECT status, resolved_at FROM complaints WHERE id = 4');
        expect(rows[0].status).toBe('REOPENED');
        expect(rows[0].resolved_at).toBeNull();

        const [historyRows] = await db.query(
          "SELECT * FROM complaint_status_history WHERE complaint_id = 4 AND new_status = 'REOPENED'"
        );
        expect(historyRows.length).toBeGreaterThanOrEqual(1);
        expect(historyRows[0].remarks).toContain('Water pressure dropped again');
      }
    });
  });
});
