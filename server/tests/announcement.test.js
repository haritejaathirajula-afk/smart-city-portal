const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');

describe('Announcements, Emergency Alerts & Notifications API (Phase 11)', () => {
  let citizenToken;
  let otherCitizenToken;
  let officerToken;
  let adminToken;
  const JWT_SECRET = process.env.JWT_SECRET || 'smartcity_super_secret_jwt_key_2026';

  let createdAnnouncementId;
  let createdAlertId;
  let createdNotificationId;

  beforeAll(async () => {
    citizenToken = jwt.sign(
      { id: 4, email: 'citizen@smartcity.gov', role: 'citizen', name: 'Amit Kumar' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    otherCitizenToken = jwt.sign(
      { id: 6, email: 'sunita.citizen@example.com', role: 'citizen', name: 'Sunita Rao' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    officerToken = jwt.sign(
      { id: 2, email: 'officer.roads@smartcity.gov', role: 'officer', name: 'Rajesh Sharma', department_id: 1 },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    adminToken = jwt.sign(
      { id: 1, email: 'admin@smartcity.gov', role: 'admin', name: 'City Administrator' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create a deterministic test notification for user 4 to verify read/delete
    try {
      const [notifResult] = await db.query(
        `INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id, is_read)
         VALUES (4, 'Test System Advisory', 'Scheduled routine water valve servicing.', 'INFO', 'SYSTEM', 101, FALSE)`
      );
      createdNotificationId = notifResult.insertId;
    } catch (e) {}
  });

  afterAll(async () => {
    try {
      if (createdAnnouncementId) {
        await db.query('DELETE FROM announcements WHERE id = ?', [createdAnnouncementId]);
      }
      if (createdAlertId) {
        await db.query('DELETE FROM emergency_alerts WHERE id = ?', [createdAlertId]);
      }
      if (createdNotificationId) {
        await db.query('DELETE FROM notifications WHERE id = ?', [createdNotificationId]);
      }
      // Re-activate alert 1 if deactivated during tests
      await db.query('UPDATE emergency_alerts SET is_active = TRUE WHERE id = 1');
    } catch (e) {}
  });

  // =========================================================================
  // 1. PUBLIC CIVIC ANNOUNCEMENTS
  // =========================================================================
  describe('Public Civic Announcements', () => {
    it('GET /api/announcements should return 200 and list of published announcements', async () => {
      const res = await request(app).get('/api/announcements');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      const first = res.body.data[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('title');
      expect(first).toHaveProperty('content');
      expect(first).toHaveProperty('category');
    });

    it('GET /api/announcements with category filter should filter properly', async () => {
      const res = await request(app).get('/api/announcements?category=CIVIC_WORK');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      res.body.data.forEach((ann) => {
        expect(ann.category).toBe('CIVIC_WORK');
      });
    });

    it('POST /api/announcements without token should return 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .send({
          title: 'Unauthorized Test Announcement',
          content: 'Missing auth token header.',
        });
      expect(res.status).toBe(401);
    });

    it('POST /api/announcements by citizen should return 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          title: 'Citizen Unauthorized Notice',
          content: 'Testing citizen role permission boundary.',
        });
      expect(res.status).toBe(403);
    });

    it('POST /api/announcements with title shorter than 5 chars should return 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          title: 'Hi',
          content: 'Long enough content for testing.',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/at least 5 characters/i);
    });

    it('POST /api/announcements with content shorter than 10 chars should return 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          title: 'Valid Announcement Title',
          content: 'Short',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/at least 10 characters/i);
    });

    it('POST /api/announcements by officer should publish announcement and return 201', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          title: 'Road Resurfacing Work Starting in Ward 12',
          content: 'Bitumen resurfacing work commences this Monday. Alternate routes advised.',
          category: 'CIVIC_WORK',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Road Resurfacing Work Starting in Ward 12');
      expect(res.body.data.category).toBe('CIVIC_WORK');
      createdAnnouncementId = res.body.data.id;
    });

    it('GET /api/announcements/:id should return single announcement details', async () => {
      if (createdAnnouncementId) {
        const res = await request(app).get(`/api/announcements/${createdAnnouncementId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(createdAnnouncementId);
      }
    });

    it('PUT /api/announcements/:id by officer should update announcement and return 200', async () => {
      if (createdAnnouncementId) {
        const res = await request(app)
          .put(`/api/announcements/${createdAnnouncementId}`)
          .set('Authorization', `Bearer ${officerToken}`)
          .send({
            title: 'Updated: Road Resurfacing Schedule in Ward 12',
            content: 'Revised schedule: Bitumen resurfacing will begin Tuesday at 7:00 AM.',
            category: 'CIVIC_WORK',
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toContain('Updated');
      }
    });

    it('DELETE /api/announcements/:id by citizen should return 403 Forbidden', async () => {
      if (createdAnnouncementId) {
        const res = await request(app)
          .delete(`/api/announcements/${createdAnnouncementId}`)
          .set('Authorization', `Bearer ${citizenToken}`);
        expect(res.status).toBe(403);
      }
    });

    it('DELETE /api/announcements/:id by officer should delete announcement and return 200', async () => {
      if (createdAnnouncementId) {
        const res = await request(app)
          .delete(`/api/announcements/${createdAnnouncementId}`)
          .set('Authorization', `Bearer ${officerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        createdAnnouncementId = null; // Already deleted
      }
    });
  });

  // =========================================================================
  // 2. EMERGENCY ALERTS & EXPIRY HANDLING
  // =========================================================================
  describe('Emergency Broadcast Alerts & Expiry', () => {
    it('GET /api/alerts should return active emergency broadcasts (excluding expired)', async () => {
      const res = await request(app).get('/api/alerts');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      // Verify that no active alert in default view has an expiry date in the past
      const now = Date.now();
      res.body.data.forEach((alert) => {
        expect(alert.is_active).toBeTruthy();
        if (alert.expires_at) {
          expect(new Date(alert.expires_at).getTime()).toBeGreaterThan(now);
        }
      });
    });

    it('POST /api/alerts without token should return 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .send({
          title: 'Severe Gale Wind Warning',
          message: 'High speed winds expected near coastal sectors.',
        });
      expect(res.status).toBe(401);
    });

    it('POST /api/alerts by citizen should return 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          title: 'Unauthorized Emergency Broadcast',
          message: 'Citizens cannot broadcast emergency warnings.',
        });
      expect(res.status).toBe(403);
    });

    it('POST /api/alerts with expiry timestamp in the past should return 400 Bad Request', async () => {
      const pastTime = new Date(Date.now() - 3600000 * 2).toISOString();
      const res = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          title: 'Flash Storm Alert',
          severity: 'WARNING',
          message: 'Testing past expiry timestamp validation logic.',
          expires_at: pastTime,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/must be in the future/i);
    });

    it('POST /api/alerts by admin with valid future expiry should broadcast alert and return 201', async () => {
      const futureExpiry = new Date(Date.now() + 3600000 * 24).toISOString();
      const res = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Flash Flood Risk Warning for Low-Lying Riverfront Wards',
          severity: 'DISASTER',
          target_ward: 'Ward 01, Ward 02, Ward 03',
          message: 'Water levels approaching critical flood mark in Yamuna riverfront corridor.',
          action_instructions: 'Evacuate temporary settlements. Contact Central Flood Relief at 1077.',
          expires_at: futureExpiry,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.severity).toBe('DISASTER');
      expect(res.body.data.expires_at).toBeTruthy();
      createdAlertId = res.body.data.id;
    });

    it('GET /api/alerts/:id should return single alert details with expiry flag', async () => {
      if (createdAlertId) {
        const res = await request(app).get(`/api/alerts/${createdAlertId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(createdAlertId);
        expect(res.body.data.is_expired).toBe(false);
      }
    });

    it('PATCH /api/alerts/:id/deactivate by citizen should return 403 Forbidden', async () => {
      const targetId = createdAlertId || 1;
      const res = await request(app)
        .patch(`/api/alerts/${targetId}/deactivate`)
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.status).toBe(403);
    });

    it('PATCH /api/alerts/:id/deactivate by officer should deactivate alert and return 200', async () => {
      const targetId = createdAlertId || 1;
      const res = await request(app)
        .patch(`/api/alerts/${targetId}/deactivate`)
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/deactivated successfully/i);
    });
  });

  // =========================================================================
  // 3. IN-APP NOTIFICATIONS & READ STATUS
  // =========================================================================
  describe('In-App Notifications & Read Status', () => {
    it('GET /api/notifications without token should return 401 Unauthorized', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });

    it('GET /api/notifications by authenticated citizen should return their notifications and unreadCount', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('notifications');
      expect(res.body.data).toHaveProperty('unreadCount');
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
      expect(typeof res.body.data.unreadCount).toBe('number');
    });

    it('GET /api/notifications?is_read=false should filter unread notifications', async () => {
      const res = await request(app)
        .get('/api/notifications?is_read=false')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      res.body.data.notifications.forEach((n) => {
        expect(Boolean(n.is_read)).toBe(false);
      });
    });

    it('PATCH /api/notifications/:id/read with invalid ID format should return 400 Bad Request', async () => {
      const res = await request(app)
        .patch('/api/notifications/invalid-id/read')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('PATCH /api/notifications/:id/read for non-existent notification should return 404', async () => {
      const res = await request(app)
        .patch('/api/notifications/999999/read')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('PATCH /api/notifications/:id/read by owner should mark notification as read and return 200', async () => {
      if (createdNotificationId) {
        const res = await request(app)
          .patch(`/api/notifications/${createdNotificationId}/read`)
          .set('Authorization', `Bearer ${citizenToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.is_read).toBe(true);
      }
    });

    it('PATCH /api/notifications/mark-all-read should mark all notifications as read for current user', async () => {
      const res = await request(app)
        .patch('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('updatedCount');
    });

    it('DELETE /api/notifications/:id by other citizen should return 403 Forbidden', async () => {
      if (createdNotificationId) {
        const res = await request(app)
          .delete(`/api/notifications/${createdNotificationId}`)
          .set('Authorization', `Bearer ${otherCitizenToken}`); // user 6 trying to delete user 4's notification

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      }
    });

    it('DELETE /api/notifications/:id by owning user should delete notification and return 200', async () => {
      if (createdNotificationId) {
        const res = await request(app)
          .delete(`/api/notifications/${createdNotificationId}`)
          .set('Authorization', `Bearer ${citizenToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        createdNotificationId = null; // successfully deleted
      }
    });
  });

  afterAll(async () => {
    await db.closePool();
  });
});
