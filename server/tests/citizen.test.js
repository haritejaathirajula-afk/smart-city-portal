const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const db = require('../src/config/db');

beforeEach(async () => {
  // Ensure deterministic test state for citizen id=5
  const check = await db.checkConnection();
  if (check.connected) {
    await db.query(
      `UPDATE notifications SET is_read = FALSE WHERE id = 1 AND user_id = 5`
    );
  }
});

afterAll(async () => {
  await db.closePool();
});

describe('Citizen Dashboard & Notifications API (Phase 5)', () => {
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

  const adminToken = jwt.sign(
    { id: 1, email: 'admin@smartcity.gov', name: 'City Admin', role: 'admin' },
    env.jwt.secret,
    { expiresIn: '1h' }
  );

  describe('GET /api/citizen/dashboard', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/citizen/dashboard');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('Access denied');
    });

    it('should reject officer access with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/citizen/dashboard')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should return complete dashboard payload for authenticated citizen', async () => {
      const res = await request(app)
        .get('/api/citizen/dashboard')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');

      // 1. Stats KPI
      const { stats } = res.body.data;
      expect(stats).toHaveProperty('totalComplaints');
      expect(stats).toHaveProperty('activeComplaints');
      expect(stats).toHaveProperty('resolvedComplaints');
      expect(stats).toHaveProperty('activeServices');
      expect(stats).toHaveProperty('unreadNotifications');
      expect(typeof stats.totalComplaints).toBe('number');
      expect(typeof stats.unreadNotifications).toBe('number');

      // 2. Complaints list
      expect(res.body.data).toHaveProperty('complaints');
      expect(Array.isArray(res.body.data.complaints)).toBe(true);

      // 3. Alerts
      expect(res.body.data).toHaveProperty('alerts');
      expect(Array.isArray(res.body.data.alerts)).toBe(true);

      // 4. Announcements
      expect(res.body.data).toHaveProperty('announcements');
      expect(Array.isArray(res.body.data.announcements)).toBe(true);

      // 5. Service requests
      expect(res.body.data).toHaveProperty('serviceRequests');
      expect(Array.isArray(res.body.data.serviceRequests)).toBe(true);

      // 6. Notifications
      expect(res.body.data).toHaveProperty('notifications');
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
    });

    it('should allow city admin oversight access', async () => {
      const res = await request(app)
        .get('/api/citizen/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('stats');
    });
  });

  describe('GET /api/citizen/notifications', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/citizen/notifications');
      expect(res.statusCode).toBe(401);
    });

    it('should reject officer request with 403', async () => {
      const res = await request(app)
        .get('/api/citizen/notifications')
        .set('Authorization', `Bearer ${officerToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('should return notifications list and unread count for citizen', async () => {
      const res = await request(app)
        .get('/api/citizen/notifications')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('notifications');
      expect(res.body.data).toHaveProperty('unreadCount');
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
    });

    it('should allow filtering notifications by is_read=false', async () => {
      const res = await request(app)
        .get('/api/citizen/notifications?is_read=false')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      res.body.data.notifications.forEach((n) => {
        expect(Boolean(n.is_read)).toBe(false);
      });
    });
  });

  describe('PATCH /api/citizen/notifications/:id/read', () => {
    it('should reject invalid notification ID format with 400', async () => {
      const res = await request(app)
        .patch('/api/citizen/notifications/invalid-id/read')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid notification ID');
    });

    it('should return 404 when marking a notification not belonging to the citizen', async () => {
      // Notification #2 belongs to user 6 in seed data
      const res = await request(app)
        .patch('/api/citizen/notifications/99999/read')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should successfully mark citizen notification as read', async () => {
      const res = await request(app)
        .patch('/api/citizen/notifications/1/read')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('is_read', true);
    });
  });

  describe('PATCH /api/citizen/notifications/mark-all-read', () => {
    it('should successfully mark all notifications as read for current citizen', async () => {
      const res = await request(app)
        .patch('/api/citizen/notifications/mark-all-read')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toContain('All notifications marked as read');
    });
  });
});
