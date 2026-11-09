const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const db = require('../src/config/db');

afterAll(async () => {
  await db.closePool();
});

describe('Complaint Reporting & Upload API (Phase 6)', () => {
  const citizenToken = jwt.sign(
    { id: 5, email: 'citizen@smartcity.gov', name: 'Aarav Mehta', role: 'citizen', ward_no: 'Ward-12' },
    env.jwt.secret,
    { expiresIn: '1h' }
  );

  const officerToken = jwt.sign(
    { id: 2, email: 'officer.roads@smartcity.gov', name: 'Officer Sen', role: 'officer' },
    env.jwt.secret,
    { expiresIn: '1h' }
  );

  it('GET /api/complaints/meta should return departments and categories with SLA', async () => {
    const res = await request(app).get('/api/complaints/meta');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('departments');
    expect(Array.isArray(res.body.data.departments)).toBe(true);
    expect(res.body.data).toHaveProperty('categories');
    expect(Array.isArray(res.body.data.categories)).toBe(true);
    expect(res.body.data.categories[0]).toHaveProperty('sla_hours');
  });

  describe('POST /api/complaints/upload (Multer Uploads)', () => {
    it('should reject unauthenticated upload requests with 401', async () => {
      const res = await request(app).post('/api/complaints/upload');
      expect(res.statusCode).toBe(401);
    });

    it('should return 400 when no file is provided in request body', async () => {
      const res = await request(app)
        .post('/api/complaints/upload')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('No image file provided');
    });

    it('should successfully upload a valid image file and return local photo URL', async () => {
      // 1x1 transparent PNG buffer
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        'base64'
      );

      const res = await request(app)
        .post('/api/complaints/upload')
        .set('Authorization', `Bearer ${citizenToken}`)
        .attach('image', pngBuffer, 'test-pothole.png');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('photo_url');
      expect(res.body.data.photo_url).toMatch(/^\/uploads\/proof-.*\.png$/);
    });

    it('should reject non-image file uploads with 400', async () => {
      const textBuffer = Buffer.from('Plain text file content, not an image');

      const res = await request(app)
        .post('/api/complaints/upload')
        .set('Authorization', `Bearer ${citizenToken}`)
        .attach('image', textBuffer, 'malicious.txt');

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid file type');
    });
  });

  describe('POST /api/complaints (Grievance Filing & Unique Tracking Code)', () => {
    it('without auth token should return 401', async () => {
      const res = await request(app).post('/api/complaints').send({});
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('by officer should return 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          title: 'Officer testing filing',
          description: 'Should be rejected as only citizens report',
          category_id: 1,
          department_id: 1,
          location_address: 'Main Road',
          ward_no: 'Ward-01',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('success', false);
    });

    it('with missing or invalid fields should return 400 validation error', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          title: 'Tiny', // too short
          description: 'Short', // too short
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('errors');
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    it('with valid fields and map coordinates should return 201 and generated CMP tracking code', async () => {
      const validComplaint = {
        title: 'Water logging outside metro station entrance',
        description: 'Severe stagnation preventing commuters from reaching ticket counters safely.',
        category_id: 6,
        department_id: 3,
        location_address: 'Gate 1, Metro Station, Ward-12',
        ward_no: 'Ward-12',
        priority: 'HIGH',
        latitude: 28.613939,
        longitude: 77.209021,
        photo_url: '/uploads/proof-sample.png',
      };

      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(validComplaint);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('tracking_code');
      expect(res.body.data.tracking_code).toMatch(/^CMP-\d{4}-\d{5}$/);
      expect(res.body.data.status).toBe('REPORTED');
      expect(res.body.data.title).toBe(validComplaint.title);
      expect(res.body.data.latitude).toBe(28.613939);
      expect(res.body.data.longitude).toBe(77.209021);

      // Verify in MySQL database
      const dbCheck = await db.checkConnection();
      if (dbCheck.connected) {
        const [complaintRows] = await db.query(
          'SELECT * FROM complaints WHERE tracking_code = ?',
          [res.body.data.tracking_code]
        );
        expect(complaintRows.length).toBe(1);
        expect(complaintRows[0].status).toBe('REPORTED');
        expect(Number(complaintRows[0].citizen_id)).toBe(5);

        // Verify status history
        const [historyRows] = await db.query(
          'SELECT * FROM complaint_status_history WHERE complaint_id = ?',
          [complaintRows[0].id]
        );
        expect(historyRows.length).toBeGreaterThanOrEqual(1);
        expect(historyRows[0].new_status).toBe('REPORTED');

        // Verify notification
        const [notifRows] = await db.query(
          'SELECT * FROM notifications WHERE entity_id = ? AND entity_type = "COMPLAINT"',
          [complaintRows[0].id]
        );
        expect(notifRows.length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
