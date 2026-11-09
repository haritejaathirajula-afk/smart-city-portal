const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');

describe('Phase 15: End-to-End Civic Integration Test Suite', () => {
  let citizenToken;
  let pwdOfficerToken;
  let wssOfficerToken;
  let adminToken;
  const JWT_SECRET = process.env.JWT_SECRET || 'smartcity_super_secret_jwt_key_2026';

  let testComplaintId;
  let testTrackingCode;
  let testTaskId;
  let testServiceRequestId;
  let testAlertId;

  beforeAll(async () => {
    // Citizen (Aarav Mehta, id 5)
    citizenToken = jwt.sign(
      { id: 5, email: 'citizen@smartcity.gov', role: 'citizen', name: 'Aarav Mehta' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // PWD Officer (Rajesh Sharma, user id 2, officer id 1, dept 1)
    pwdOfficerToken = jwt.sign(
      { id: 2, email: 'officer.roads@smartcity.gov', role: 'officer', name: 'Rajesh Sharma', department_id: 1, officer_id: 1 },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // WSS Officer (Priya Sharma, user id 3, officer id 3, dept 3)
    wssOfficerToken = jwt.sign(
      { id: 3, email: 'officer.water@smartcity.gov', role: 'officer', name: 'Priya Sharma', department_id: 3, officer_id: 3 },
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
    // Clean up created integration records from MySQL to leave database pristine
    try {
      if (testComplaintId) {
        await db.query('DELETE FROM feedback WHERE complaint_id = ?', [testComplaintId]);
        await db.query('DELETE FROM tasks WHERE complaint_id = ?', [testComplaintId]);
        await db.query('DELETE FROM complaint_status_history WHERE complaint_id = ?', [testComplaintId]);
        await db.query('DELETE FROM notifications WHERE entity_type = "COMPLAINT" AND entity_id = ?', [testComplaintId]);
        await db.query('DELETE FROM audit_logs WHERE entity_type = "COMPLAINT" AND entity_id = ?', [testComplaintId]);
        await db.query('DELETE FROM complaints WHERE id = ?', [testComplaintId]);
      }
      if (testServiceRequestId) {
        await db.query('DELETE FROM notifications WHERE entity_type = "SERVICE_REQUEST" AND entity_id = ?', [testServiceRequestId]);
        await db.query('DELETE FROM service_requests WHERE id = ?', [testServiceRequestId]);
      }
      if (testAlertId) {
        await db.query('DELETE FROM emergency_alerts WHERE id = ?', [testAlertId]);
      }
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }
    await db.closePool();
  });

  // ---------------------------------------------------------------------------
  // 1. FULL GRIEVANCE LIFECYCLE E2E:
  // Citizen Reports -> Admin Triages -> Officer Takes Ownership -> Dispatches Worker ->
  // Worker Completes -> Officer Resolves -> Citizen Verifies -> Citizen Leaves Feedback
  // ---------------------------------------------------------------------------
  describe('Full Grievance Lifecycle E2E Workflow', () => {
    it('Step 1: Citizen files a new civic grievance with GPS coordinates', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          title: 'Deep Trench across Boulevard intersection',
          description: 'Excavation trench left uncovered causing traffic disruption and safety hazard.',
          category_id: 1, // PWD Pothole / Trench
          department_id: 1, // Roads & Infrastructure (PWD)
          ward_no: 'Ward-12',
          location_address: 'Boulevard Road, Junction 4, Ward-12',
          latitude: 28.6145,
          longitude: 77.2095,
          priority: 'HIGH',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('tracking_code');
      expect(res.body.data.status).toBe('REPORTED');

      testComplaintId = res.body.data.id;
      testTrackingCode = res.body.data.tracking_code;
      expect(testTrackingCode).toMatch(/^CMP-\d{4}-\d{5}$/);
    });

    it('Step 2: Grievance appears in public and citizen tracking lookup', async () => {
      const res = await request(app)
        .get(`/api/complaints/${testTrackingCode}`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testComplaintId);
      expect(res.body.data.status).toBe('REPORTED');
      expect(res.body.data.status_history.length).toBeGreaterThanOrEqual(1);
    });

    it('Step 3: Administrator inspects queue and administratively confirms department assignment', async () => {
      const res = await request(app)
        .patch(`/api/admin/complaints/${testComplaintId}/reassign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          department_id: 1, // PWD Roads
          assigned_officer_id: 1, // Officer Rajesh Sharma
          remarks: 'Prioritized for emergency repair by Admin Triage Desk',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ASSIGNED');
    });

    it('Step 4: Assigned Municipal Officer reviews department dashboard queue', async () => {
      const res = await request(app)
        .get('/api/officer/dashboard')
        .set('Authorization', `Bearer ${pwdOfficerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('stats');
      expect(res.body.data).toHaveProperty('queue');
      const found = res.body.data.queue.find((c) => c.id === testComplaintId);
      expect(found).toBeDefined();
    });

    it('Step 5: Municipal Officer dispatches a field crew (creates task)', async () => {
      const res = await request(app)
        .post('/api/officer/tasks')
        .set('Authorization', `Bearer ${pwdOfficerToken}`)
        .send({
          complaint_id: testComplaintId,
          field_worker_id: 1, // Suresh Yadav
          title: 'Fill Trench with Hot Mix & Heavy Compactor',
          description: 'Deploy asphalt road roller DL-RO-102 and level surface before evening rush hour.',
          due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      testTaskId = res.body.data.id;

      // Status should have automatically transitioned to IN_PROGRESS
      const complaintCheck = await request(app)
        .get(`/api/complaints/${testComplaintId}`)
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(complaintCheck.body.data.status).toBe('IN_PROGRESS');
    });

    it('Step 6: Field crew updates task to COMPLETED', async () => {
      const res = await request(app)
        .patch(`/api/officer/tasks/${testTaskId}/status`)
        .set('Authorization', `Bearer ${pwdOfficerToken}`)
        .send({
          status: 'COMPLETED',
          notes: 'Asphalt leveled and compacted. Road open to traffic.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Step 7: Officer resolves complaint with resolution proof and notes', async () => {
      const res = await request(app)
        .patch(`/api/officer/complaints/${testComplaintId}/status`)
        .set('Authorization', `Bearer ${pwdOfficerToken}`)
        .send({
          status: 'RESOLVED',
          remarks: 'Trench successfully restored, bitumen seal applied and tested with roller.',
          photo_proof_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await request(app)
        .get(`/api/complaints/${testComplaintId}`)
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(check.body.data.status).toBe('RESOLVED');
      expect(check.body.data.resolved_at).not.toBeNull();
    });

    it('Step 8: Citizen receives resolution notification and verifies the outcome', async () => {
      const notifRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(notifRes.status).toBe(200);
      expect(notifRes.body.data.notifications.length).toBeGreaterThan(0);

      const verifyRes = await request(app)
        .post(`/api/complaints/${testComplaintId}/verify`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          rating: 5,
          comments: 'Super quick resolution! The road is completely smooth now.',
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);

      const finalCheck = await request(app)
        .get(`/api/complaints/${testComplaintId}`)
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(finalCheck.body.data.status).toBe('VERIFIED');
    });

    it('Step 9: Citizen feedback and rating are recorded in feedback system', async () => {
      const feedbackRes = await request(app)
        .get(`/api/feedback/complaint/${testComplaintId}`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(feedbackRes.status).toBe(200);
      expect(feedbackRes.body.success).toBe(true);
      expect(feedbackRes.body.data.rating).toBe(5);
      expect(feedbackRes.body.data.satisfaction_level).toBe('EXCELLENT');
    });

    it('Step 10: Complete audit history exists for all transitions', async () => {
      const res = await request(app)
        .get(`/api/complaints/${testComplaintId}`)
        .set('Authorization', `Bearer ${citizenToken}`);

      const history = res.body.data.status_history;
      expect(history.length).toBeGreaterThanOrEqual(4); // REPORTED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> VERIFIED
      const statuses = history.map((h) => h.new_status);
      expect(statuses).toContain('REPORTED');
      expect(statuses).toContain('IN_PROGRESS');
      expect(statuses).toContain('RESOLVED');
      expect(statuses).toContain('VERIFIED');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. MUNICIPAL SERVICE REQUEST LIFECYCLE E2E:
  // Citizen Requests -> Officer Reviews & Approves -> Officer Completes
  // ---------------------------------------------------------------------------
  describe('Municipal Service Request Lifecycle E2E Workflow', () => {
    it('Citizen books an Emergency Potable Water Tanker', async () => {
      const res = await request(app)
        .post('/api/services/requests')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          service_category_id: 1, // Water Tanker (WSS Dept 3)
          address: 'Block C, Sunview Apartments, Sector 18',
          ward_no: 'Ward-15',
          preferred_slot: 'Morning (09:00 AM - 12:00 PM)',
          details: 'Borewell pump burnt out. Urgent 6000L drinking water required for 40 families.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.request_code).toMatch(/^SRV-\d{4}-\d{5}$/);
      expect(res.body.data.status).toBe('SUBMITTED');

      testServiceRequestId = res.body.data.id;
    });

    it('Water Officer inspects and approves the service request', async () => {
      const res = await request(app)
        .patch(`/api/services/requests/${testServiceRequestId}/status`)
        .set('Authorization', `Bearer ${wssOfficerToken}`)
        .send({
          status: 'APPROVED',
          resolution_notes: 'Tanker vehicle KA-05-WT-9901 scheduled for morning 10:00 AM dispatch.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
    });

    it('Water Officer transitions request to IN_PROGRESS then COMPLETED', async () => {
      const progressRes = await request(app)
        .patch(`/api/services/requests/${testServiceRequestId}/status`)
        .set('Authorization', `Bearer ${wssOfficerToken}`)
        .send({
          status: 'IN_PROGRESS',
          resolution_notes: 'Tanker en route to Sunview Apartments.',
        });
      expect(progressRes.status).toBe(200);
      expect(progressRes.body.data.status).toBe('IN_PROGRESS');

      const completeRes = await request(app)
        .patch(`/api/services/requests/${testServiceRequestId}/status`)
        .set('Authorization', `Bearer ${wssOfficerToken}`)
        .send({
          status: 'COMPLETED',
          resolution_notes: '6000L delivered into society underground tank. Signed delivery receipt obtained.',
        });
      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.status).toBe('COMPLETED');
      expect(completeRes.body.data.completed_at).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. PUBLIC SAFETY BROADCAST E2E:
  // Admin Issues Broadcast -> Citizen Receives Alert -> Admin Deactivates
  // ---------------------------------------------------------------------------
  describe('Emergency Broadcast Lifecycle E2E Workflow', () => {
    it('Admin issues a critical emergency broadcast alert', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Heavy Rainfall & Waterlogging Alert',
          message: 'Underpass on Ring Road flooded. Avoid low-lying corridors between 3 PM and 8 PM.',
          severity: 'HIGH',
          affected_areas: 'Sector 15, Sector 18, Ring Road Underpass',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.is_active).toBe(true);

      testAlertId = res.body.data.id;
    });

    it('Citizen receives active emergency broadcast feed', async () => {
      const res = await request(app).get('/api/alerts');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const found = res.body.data.find((a) => a.id === testAlertId);
      expect(found).toBeDefined();
      expect(found.title).toContain('Heavy Rainfall');
    });

    it('Admin deactivates the emergency alert after hazard clears', async () => {
      const res = await request(app)
        .patch(`/api/alerts/${testAlertId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it is no longer listed in active alerts
      const activeRes = await request(app).get('/api/alerts');
      const found = activeRes.body.data.find((a) => a.id === testAlertId);
      expect(found).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. GIS GEOSPATIAL & WARD CLUSTERING E2E
  // ---------------------------------------------------------------------------
  describe('Geospatial GIS Integration E2E Workflow', () => {
    it('Map pins endpoint returns complaint coordinates', async () => {
      const res = await request(app).get('/api/map/complaints');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.find((p) => p.id === testComplaintId);
      if (found) {
        expect(found.latitude).toBeCloseTo(28.6145, 3);
        expect(found.longitude).toBeCloseTo(77.2095, 3);
      }
    });

    it('Ward cluster density aggregates geospatial complaints', async () => {
      const res = await request(app).get('/api/map/clusters');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((c) => {
        expect(c).toHaveProperty('ward_no');
        expect(c).toHaveProperty('total');
      });
    });

    it('Officer GIS view scopes complaint markers to department jurisdiction', async () => {
      const res = await request(app)
        .get('/api/map/officer-view')
        .set('Authorization', `Bearer ${pwdOfficerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('department');
      expect(res.body.data.department.code).toBe('PWD');
      expect(Array.isArray(res.body.data.complaints)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. CITYWIDE ANALYTICS & EXPORT REPORTING E2E
  // ---------------------------------------------------------------------------
  describe('City Analytics & Intelligence E2E Workflow', () => {
    it('Global KPIs report live metrics', async () => {
      const res = await request(app).get('/api/analytics/kpis');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total_grievances).toBeGreaterThan(0);
      expect(typeof res.body.data.resolution_rate).toBe('number');
    });

    it('Monthly grievance trends reflect empirical database trajectory', async () => {
      const res = await request(app).get('/api/analytics/trends');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('SLA performance analytics computes department compliance benchmarks', async () => {
      const res = await request(app).get('/api/analytics/sla');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const pwd = res.body.data.find((d) => d.department_code === 'PWD');
      expect(pwd).toBeDefined();
      expect(pwd).toHaveProperty('compliance_rate');
    });

    it('Data export station produces valid JSON dataset', async () => {
      const res = await request(app).get('/api/analytics/export?format=json');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('Data export station produces RFC-compliant downloadable CSV file', async () => {
      const res = await request(app).get('/api/analytics/export?format=csv');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('SmartCity_Grievance_Report.csv');
      expect(res.text).toContain('Tracking Code');
    });
  });
});
