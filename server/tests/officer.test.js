const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const db = require('../src/config/db');

afterAll(async () => {
  await db.closePool();
});

describe('Officer Dashboard, Tasks & Resolution API (Phase 8)', () => {
  const citizenToken = jwt.sign(
    { id: 5, email: 'citizen@smartcity.gov', name: 'Aarav Mehta', role: 'citizen' },
    env.jwt.secret,
    { expiresIn: '1h' }
  );

  // Officer 1: Roads & Infrastructure (PWD, department_id: 1, officer_id: 1)
  const officerPwmToken = jwt.sign(
    { id: 2, email: 'officer.roads@smartcity.gov', name: 'Officer Sen', role: 'officer', officer_id: 1, department_id: 1 },
    env.jwt.secret,
    { expiresIn: '1h' }
  );

  // Officer 2: Sanitation & Solid Waste Management (SWM, department_id: 2, officer_id: 2)
  const officerSwmToken = jwt.sign(
    { id: 3, email: 'officer.waste@smartcity.gov', name: 'Officer Fatima', role: 'officer', officer_id: 2, department_id: 2 },
    env.jwt.secret,
    { expiresIn: '1h' }
  );

  beforeEach(async () => {
    // Reset Complaint 1 for consistent test runs
    const check = await db.checkConnection();
    if (check.connected) {
      await db.query(
        "UPDATE complaints SET department_id = 1, status = 'REPORTED', assigned_officer_id = NULL, rejection_reason = NULL, resolved_at = NULL WHERE id = 1"
      );
    }
  });

  describe('GET /api/officer/dashboard (Access Control & Data)', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/officer/dashboard');
      expect(res.statusCode).toBe(401);
    });

    it('should reject citizen access with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/officer/dashboard')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('should return department queue, workers, tasks and KPIs for officer', async () => {
      const res = await request(app)
        .get('/api/officer/dashboard')
        .set('Authorization', `Bearer ${officerPwmToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('stats');
      expect(res.body.data.stats).toHaveProperty('deptTotal');
      expect(res.body.data.stats).toHaveProperty('assignedToMe');
      expect(res.body.data).toHaveProperty('queue');
      expect(Array.isArray(res.body.data.queue)).toBe(true);
      expect(res.body.data).toHaveProperty('fieldWorkers');
      expect(res.body.data).toHaveProperty('tasks');
    });
  });

  describe('GET /api/officer/field-workers', () => {
    it('should return available field workers for officer department', async () => {
      const res = await request(app)
        .get('/api/officer/field-workers')
        .set('Authorization', `Bearer ${officerPwmToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PATCH /api/officer/complaints/:id/assign (Ticket Ownership)', () => {
    it('should reject assigning cross-department complaint with 403 Forbidden', async () => {
      // Complaint 1 belongs to PWD (dept 1); officerSwmToken belongs to SWM (dept 2)
      const res = await request(app)
        .patch('/api/officer/complaints/1/assign')
        .set('Authorization', `Bearer ${officerSwmToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('jurisdiction');
    });

    it('should allow department officer to take ownership and advance status to ASSIGNED', async () => {
      const res = await request(app)
        .patch('/api/officer/complaints/1/assign')
        .set('Authorization', `Bearer ${officerPwmToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('status', 'ASSIGNED');
      expect(res.body.data).toHaveProperty('assigned_officer_id', 1);

      // Verify in DB
      const check = await db.checkConnection();
      if (check.connected) {
        const [rows] = await db.query('SELECT status, assigned_officer_id FROM complaints WHERE id = 1');
        expect(rows[0].status).toBe('ASSIGNED');
        expect(rows[0].assigned_officer_id).toBe(1);
      }
    });
  });

  describe('POST /api/officer/tasks (Field Dispatch)', () => {
    it('should reject task creation with missing required fields with 400', async () => {
      const res = await request(app)
        .post('/api/officer/tasks')
        .set('Authorization', `Bearer ${officerPwmToken}`)
        .send({
          complaint_id: 1,
        });

      expect(res.statusCode).toBe(400);
    });

    it('should reject task dispatch for cross-department complaint with 403', async () => {
      // Complaint 1 belongs to PWD; SWM officer cannot dispatch
      const res = await request(app)
        .post('/api/officer/tasks')
        .set('Authorization', `Bearer ${officerSwmToken}`)
        .send({
          complaint_id: 1,
          field_worker_id: 1,
          title: 'Unauthorized dispatch attempt',
        });

      expect(res.statusCode).toBe(403);
    });

    it('should successfully dispatch task and update complaint to IN_PROGRESS', async () => {
      const res = await request(app)
        .post('/api/officer/tasks')
        .set('Authorization', `Bearer ${officerPwmToken}`)
        .send({
          complaint_id: 1,
          field_worker_id: 1,
          title: 'Fill pothole with bituminous mix and roll compact',
          description: 'Ensure safety cones and barricades during traffic hours',
          due_date: new Date().toISOString().split('T')[0],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('status', 'PENDING');

      // Verify in DB
      const check = await db.checkConnection();
      if (check.connected) {
        const [complaintRows] = await db.query('SELECT status FROM complaints WHERE id = 1');
        expect(complaintRows[0].status).toBe('IN_PROGRESS');
      }
    });
  });

  describe('PATCH /api/officer/tasks/:id/status (Task Status Updates)', () => {
    it('should reject invalid task status with 400', async () => {
      const res = await request(app)
        .patch('/api/officer/tasks/1/status')
        .set('Authorization', `Bearer ${officerPwmToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect(res.statusCode).toBe(400);
    });

    it('should update task status to COMPLETED', async () => {
      const res = await request(app)
        .patch('/api/officer/tasks/1/status')
        .set('Authorization', `Bearer ${officerPwmToken}`)
        .send({ status: 'COMPLETED', notes: 'Pothole patch sealed and asphalt dried.' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });

  describe('PATCH /api/officer/complaints/:id/status (Progress, Resolution, Rejection)', () => {
    it('should reject status update with empty remarks with 400', async () => {
      const res = await request(app)
        .patch('/api/officer/complaints/1/status')
        .set('Authorization', `Bearer ${officerPwmToken}`)
        .send({
          status: 'RESOLVED',
          remarks: 'Tiny', // under 5 characters
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('at least 5 characters');
    });

    it('should reject status update for cross-department complaint with 403', async () => {
      const res = await request(app)
        .patch('/api/officer/complaints/1/status')
        .set('Authorization', `Bearer ${officerSwmToken}`)
        .send({
          status: 'RESOLVED',
          remarks: 'Attempting cross-department resolution',
        });

      expect(res.statusCode).toBe(403);
    });

    it('should update status to RESOLVED with completion remarks and photo proof', async () => {
      const res = await request(app)
        .patch('/api/officer/complaints/1/status')
        .set('Authorization', `Bearer ${officerPwmToken}`)
        .send({
          status: 'RESOLVED',
          remarks: 'Road crew completed patch work. Asphalt compacted and tested.',
          photo_proof_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      // Verify in DB
      const check = await db.checkConnection();
      if (check.connected) {
        const [rows] = await db.query('SELECT status, resolved_at FROM complaints WHERE id = 1');
        expect(rows[0].status).toBe('RESOLVED');
        expect(rows[0].resolved_at).not.toBeNull();
      }
    });

    it('should allow legitimate REJECTED status with grounds for rejection stored', async () => {
      const res = await request(app)
        .patch('/api/officer/complaints/1/status')
        .set('Authorization', `Bearer ${officerPwmToken}`)
        .send({
          status: 'REJECTED',
          remarks: 'Private internal driveway outside municipal jurisdiction.',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      // Verify in DB
      const check = await db.checkConnection();
      if (check.connected) {
        const [rows] = await db.query('SELECT status, rejection_reason FROM complaints WHERE id = 1');
        expect(rows[0].status).toBe('REJECTED');
        expect(rows[0].rejection_reason).toContain('Private internal driveway');
      }
    });
  });
});
