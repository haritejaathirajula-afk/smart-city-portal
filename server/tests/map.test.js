const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');

describe('Interactive City Map, Heatmap & Officer View API (Phase 13)', () => {
  let officerToken;
  let citizenToken;
  let adminToken;
  const JWT_SECRET = process.env.JWT_SECRET || 'smartcity_super_secret_jwt_key_2026';

  beforeAll(() => {
    officerToken = jwt.sign(
      { id: 2, email: 'officer.roads@smartcity.gov', role: 'officer', name: 'Officer Vikramaditya Sen', department_id: 1 },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    citizenToken = jwt.sign(
      { id: 5, email: 'citizen@smartcity.gov', role: 'citizen', name: 'Aarav Mehta' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { id: 1, email: 'admin@smartcity.gov', role: 'admin', name: 'City Administrator' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  // ---------------------------------------------------------------------------
  // 1. PUBLIC MAP MARKERS & FILTERS
  // ---------------------------------------------------------------------------
  describe('Complaint Map Markers & Filtering', () => {
    it('GET /api/map/complaints should return list of geospatial complaint pins with numeric coordinates', async () => {
      const res = await request(app).get('/api/map/complaints');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const pin = res.body.data[0];
      expect(typeof pin.latitude).toBe('number');
      expect(typeof pin.longitude).toBe('number');
      expect(pin.latitude).toBeGreaterThan(20);
      expect(pin.longitude).toBeGreaterThan(70);
      expect(pin).toHaveProperty('tracking_code');
      expect(pin).toHaveProperty('title');
      expect(pin).toHaveProperty('priority');
      expect(pin).toHaveProperty('status');
      expect(pin).toHaveProperty('department_name');
      expect(pin).toHaveProperty('department_code');
    });

    it('GET /api/map/complaints?priority=HIGH should filter pins by priority', async () => {
      const res = await request(app).get('/api/map/complaints?priority=HIGH');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((pin) => {
        expect(pin.priority).toBe('HIGH');
      });
    });

    it('GET /api/map/complaints?priority=INVALID should return 400 Bad Request', async () => {
      const res = await request(app).get('/api/map/complaints?priority=INVALID_VALUE');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('priority');
    });

    it('GET /api/map/complaints?status=IN_PROGRESS should filter pins by status', async () => {
      const res = await request(app).get('/api/map/complaints?status=IN_PROGRESS');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((pin) => {
        expect(pin.status).toBe('IN_PROGRESS');
      });
    });

    it('GET /api/map/complaints?status=INVALID_STATUS should return 400 Bad Request', async () => {
      const res = await request(app).get('/api/map/complaints?status=NOT_A_STATUS');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('status');
    });

    it('GET /api/map/complaints?department_code=PWD should filter by department code', async () => {
      const res = await request(app).get('/api/map/complaints?department_code=PWD');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((pin) => {
        expect(pin.department_code).toBe('PWD');
      });
    });

    it('GET /api/map/complaints?ward=Ward-12 should filter by ward', async () => {
      const res = await request(app).get('/api/map/complaints?ward=Ward-12');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((pin) => {
        expect(pin.ward_no).toContain('12');
      });
    });

    it('GET /api/map/complaints?search=Pothole should perform keyword search', async () => {
      const res = await request(app).get('/api/map/complaints?search=Pothole');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        expect(res.body.data[0].title.toLowerCase()).toContain('pothole');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 2. WARD CLUSTERS & HEATMAP
  // ---------------------------------------------------------------------------
  describe('Ward Clusters and Geospatial Heatmap', () => {
    it('GET /api/map/clusters should return ward cluster density centers with statistics', async () => {
      const res = await request(app).get('/api/map/clusters');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const cluster = res.body.data[0];
      expect(cluster).toHaveProperty('ward_no');
      expect(cluster).toHaveProperty('name');
      expect(cluster).toHaveProperty('total');
      expect(cluster).toHaveProperty('active');
      expect(cluster).toHaveProperty('lat');
      expect(cluster).toHaveProperty('lng');
      expect(cluster).toHaveProperty('density_score');
      expect(typeof cluster.density_score).toBe('number');
    });

    it('GET /api/map/heatmap should return weighted coordinates and hotspot leaderboards', async () => {
      const res = await request(app).get('/api/map/heatmap');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('points');
      expect(res.body.data).toHaveProperty('hotspots');
      expect(res.body.data).toHaveProperty('total_active_hazards');
      expect(Array.isArray(res.body.data.points)).toBe(true);
      expect(Array.isArray(res.body.data.hotspots)).toBe(true);

      const point = res.body.data.points[0];
      expect(typeof point.lat).toBe('number');
      expect(typeof point.lng).toBe('number');
      expect(typeof point.weight).toBe('number');
      expect(point.weight).toBeGreaterThanOrEqual(0.1);
      expect(point.weight).toBeLessThanOrEqual(1.0);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. OFFICER MAP VIEW & AUTHORIZATION
  // ---------------------------------------------------------------------------
  describe('Officer Map View & Role-Based Access Control', () => {
    it('GET /api/map/officer-view without token should return 401 Unauthorized', async () => {
      const res = await request(app).get('/api/map/officer-view');
      expect(res.status).toBe(401);
    });

    it('GET /api/map/officer-view by citizen should return 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/map/officer-view')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('GET /api/map/officer-view by municipal officer should return department-scoped pins, field workers & KPIs', async () => {
      const res = await request(app)
        .get('/api/map/officer-view')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('department');
      expect(res.body.data).toHaveProperty('kpis');
      expect(res.body.data).toHaveProperty('complaints');
      expect(res.body.data).toHaveProperty('field_workers');

      expect(res.body.data.department.code).toBe('PWD');
      expect(res.body.data.kpis).toHaveProperty('total_cases');
      expect(res.body.data.kpis).toHaveProperty('emergency_cases');
      expect(res.body.data.kpis).toHaveProperty('available_workers');

      expect(Array.isArray(res.body.data.field_workers)).toBe(true);
      if (res.body.data.field_workers.length > 0) {
        const worker = res.body.data.field_workers[0];
        expect(worker).toHaveProperty('name');
        expect(worker).toHaveProperty('skills');
        expect(worker).toHaveProperty('latitude');
        expect(worker).toHaveProperty('longitude');
      }
    });

    it('GET /api/map/officer-view by admin should return jurisdictional map view', async () => {
      const res = await request(app)
        .get('/api/map/officer-view?department_id=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('department');
      expect(res.body.data).toHaveProperty('complaints');
    });
  });

  afterAll(async () => {
    await db.closePool();
  });
});
