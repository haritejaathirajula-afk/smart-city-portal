const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');

describe('Citizen Feedback and Ratings API (Phase 12)', () => {
  let citizenToken;
  let otherCitizenToken;
  let adminToken;
  const JWT_SECRET = process.env.JWT_SECRET || 'smartcity_super_secret_jwt_key_2026';

  let createdFeedbackId = null;

  beforeAll(async () => {
    // Citizen 5 (Aarav Mehta - owner of complaint 10 & 11)
    citizenToken = jwt.sign(
      { id: 5, email: 'citizen@smartcity.gov', role: 'citizen', name: 'Aarav Mehta' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Citizen 6 (Pooja Iyer)
    otherCitizenToken = jwt.sign(
      { id: 6, email: 'citizen.pooja@smartcity.gov', role: 'citizen', name: 'Pooja Iyer' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Admin 1 (City Administrator)
    adminToken = jwt.sign(
      { id: 1, email: 'admin@smartcity.gov', role: 'admin', name: 'City Administrator' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Setup deterministic DB state for testing
    try {
      const check = await db.checkConnection();
      if (check.connected) {
        // Clean any existing feedback on test complaints 10 and 11
        await db.query(`DELETE FROM feedback WHERE complaint_id IN (10, 11)`);
        // Ensure complaint 10 is RESOLVED (ready for feedback)
        await db.query(`UPDATE complaints SET status = 'RESOLVED' WHERE id = 10`);
        // Ensure complaint 11 is REPORTED (unresolved, ineligible for feedback)
        await db.query(`UPDATE complaints SET status = 'REPORTED' WHERE id = 11`);
      }
    } catch (_) {}
  });

  afterAll(async () => {
    try {
      const check = await db.checkConnection();
      if (check.connected) {
        await db.query(`DELETE FROM feedback WHERE complaint_id IN (10, 11)`);
      }
    } catch (_) {}
  });

  // ---------------------------------------------------------------------------
  // 1. PUBLIC ENDPOINTS
  // ---------------------------------------------------------------------------
  describe('Public Feedback Summaries & Reviews', () => {
    it('GET /api/feedback/summary should return public satisfaction summary and department scorecards', async () => {
      const res = await request(app).get('/api/feedback/summary');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('averageRating');
      expect(res.body.data).toHaveProperty('totalReviews');
      expect(res.body.data).toHaveProperty('satisfactionRate');
      expect(res.body.data).toHaveProperty('distribution');
      expect(res.body.data).toHaveProperty('departmentRatings');
      expect(Array.isArray(res.body.data.departmentRatings)).toBe(true);
      expect(typeof res.body.data.distribution).toBe('object');
    });

    it('GET /api/feedback/recent should return verified resident reviews stream', async () => {
      const res = await request(app).get('/api/feedback/recent');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('rating');
      expect(res.body.data[0]).toHaveProperty('satisfaction_level');
    });

    it('GET /api/feedback/recent?rating=5 should filter reviews by star rating', async () => {
      const res = await request(app).get('/api/feedback/recent?rating=5');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((r) => {
        expect(r.rating).toBe(5);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 2. AUTHENTICATION & VALIDATION
  // ---------------------------------------------------------------------------
  describe('Authentication & Input Validation', () => {
    it('POST /api/feedback without token should return 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .send({
          complaint_id: 10,
          rating: 5,
          comments: 'Great service',
        });
      expect(res.status).toBe(401);
    });

    it('POST /api/feedback with missing complaint_id or rating should return 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ comments: 'Missing required fields' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    it('POST /api/feedback with rating > 5 should return 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          complaint_id: 10,
          rating: 6,
          comments: 'Invalid rating',
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('between 1 and 5');
    });

    it('POST /api/feedback with non-integer rating should return 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          complaint_id: 10,
          rating: 4.5,
          comments: 'Float rating not allowed',
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('integer');
    });

    it('POST /api/feedback with comments exceeding 1000 characters should return 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          complaint_id: 10,
          rating: 5,
          comments: 'A'.repeat(1005),
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('1000');
    });

    it('POST /api/feedback on non-existent complaint should return 404 Not Found', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          complaint_id: 999999,
          rating: 5,
          comments: 'Ghost complaint',
        });
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });

    it('POST /api/feedback on unresolved complaint should return 400 Bad Request', async () => {
      // Complaint 11 is in REPORTED status
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          complaint_id: 11,
          rating: 4,
          comments: 'Cannot rate un-resolved ticket',
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('resolved or closed');
    });

    it('POST /api/feedback by unauthorized citizen (non-owner) should return 403 Forbidden', async () => {
      // Complaint 10 is owned by citizen 5, otherCitizenToken is citizen 6
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${otherCitizenToken}`)
        .send({
          complaint_id: 10,
          rating: 5,
          comments: 'I did not file this ticket',
        });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not authorized');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. SUBMISSION, DUPLICATE PREVENTION & RATINGS
  // ---------------------------------------------------------------------------
  describe('Feedback Submission, Satisfaction Mapping & Duplicate Prevention', () => {
    it('POST /api/feedback should successfully create feedback and auto-promote complaint to VERIFIED', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          complaint_id: 10,
          rating: 5,
          comments: 'Technicians arrived swiftly, resolved the civic issue, and cleaned up the site perfectly.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.satisfaction_level).toBe('EXCELLENT');
      expect(res.body.data).toHaveProperty('id');
      createdFeedbackId = res.body.data.id;
    });

    it('POST /api/feedback on the same complaint should return 409 Conflict (Duplicate Prevention)', async () => {
      // Immediate second submission for complaint 10 must be blocked by duplicate prevention
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          complaint_id: 10,
          rating: 4,
          comments: 'Attempting duplicate review submission.',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.duplicate).toBe(true);
      expect(res.body.message).toContain('Duplicate reviews are not permitted');
    });

    it('POST /api/feedback with update=true should update existing review', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          complaint_id: 10,
          rating: 4,
          comments: 'Updated review: Quality was solid, slightly delayed cleanup.',
          update: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(4);
      expect(res.body.data.satisfaction_level).toBe('GOOD');
      expect(res.body.data.updated).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. PUT, GET DETAILS & DELETE ENDPOINTS
  // ---------------------------------------------------------------------------
  describe('Feedback Inspection, Update and Deletion', () => {
    it('GET /api/feedback/complaint/10 should retrieve feedback for resolved complaint', async () => {
      const res = await request(app)
        .get('/api/feedback/complaint/10')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.complaint_id).toBe(10);
      expect(res.body.data.rating).toBe(4);
    });

    it('GET /api/feedback/complaint/999999 should return 404 Not Found', async () => {
      const res = await request(app)
        .get('/api/feedback/complaint/999999')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/feedback/my should return reviews submitted by the authenticated citizen', async () => {
      const res = await request(app)
        .get('/api/feedback/my')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((f) => f.complaint_id === 10)).toBe(true);
    });

    it('PUT /api/feedback/:id by non-owner should return 403 Forbidden', async () => {
      if (!createdFeedbackId) return;
      const res = await request(app)
        .put(`/api/feedback/${createdFeedbackId}`)
        .set('Authorization', `Bearer ${otherCitizenToken}`)
        .send({
          rating: 1,
          comments: 'Malicious modification by unauthorized citizen',
        });

      expect(res.status).toBe(403);
    });

    it('PUT /api/feedback/:id by author citizen should update rating and satisfaction level', async () => {
      if (!createdFeedbackId) return;
      const res = await request(app)
        .put(`/api/feedback/${createdFeedbackId}`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          rating: 3,
          comments: 'Service was acceptable but took some follow up.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(3);
      expect(res.body.data.satisfaction_level).toBe('AVERAGE');
    });

    it('DELETE /api/feedback/:id by non-owner should return 403 Forbidden', async () => {
      if (!createdFeedbackId) return;
      const res = await request(app)
        .delete(`/api/feedback/${createdFeedbackId}`)
        .set('Authorization', `Bearer ${otherCitizenToken}`);

      expect(res.status).toBe(403);
    });

    it('DELETE /api/feedback/:id by author citizen should successfully delete review', async () => {
      if (!createdFeedbackId) return;
      const res = await request(app)
        .delete(`/api/feedback/${createdFeedbackId}`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');
    });

    it('GET /api/feedback/complaint/10 after deletion should return 404', async () => {
      const res = await request(app)
        .get('/api/feedback/complaint/10')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(404);
    });
  });

  afterAll(async () => {
    await db.closePool();
  });
});
