const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('City Analytics, SLA Intelligence & Reporting API (Phase 14)', () => {
  afterAll(async () => {
    await db.closePool();
  });
  // ---------------------------------------------------------------------------
  // 1. EXECUTIVE KPIS & TRENDS
  // ---------------------------------------------------------------------------
  describe('Global KPIs & Grievance Trajectory', () => {
    it('GET /api/analytics/kpis should return citywide executive scorecard', async () => {
      const res = await request(app).get('/api/analytics/kpis');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total_grievances');
      expect(res.body.data).toHaveProperty('active_grievances');
      expect(res.body.data).toHaveProperty('resolved_grievances');
      expect(res.body.data).toHaveProperty('resolution_rate');
      expect(res.body.data).toHaveProperty('avg_turnaround_hours');
      expect(typeof res.body.data.resolution_rate).toBe('number');
    });

    it('GET /api/analytics/trends should return monthly grievance trajectory data', async () => {
      const res = await request(app).get('/api/analytics/trends');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const item = res.body.data[0];
      expect(item).toHaveProperty('month');
      expect(item).toHaveProperty('reported');
      expect(item).toHaveProperty('resolved');
      expect(typeof item.reported).toBe('number');
    });

    it('GET /api/analytics/trends?department_id=1 should return department-filtered trajectory', async () => {
      const res = await request(app).get('/api/analytics/trends?department_id=1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. DEPARTMENT PERFORMANCE & CATEGORY METRICS
  // ---------------------------------------------------------------------------
  describe('Department SLA Benchmarks & Categories', () => {
    it('GET /api/analytics/sla should return department SLA performance benchmarks', async () => {
      const res = await request(app).get('/api/analytics/sla');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const dept = res.body.data[0];
      expect(dept).toHaveProperty('department_id');
      expect(dept).toHaveProperty('department_name');
      expect(dept).toHaveProperty('department_code');
      expect(dept).toHaveProperty('total_complaints');
      expect(dept).toHaveProperty('compliance_rate');
      expect(dept).toHaveProperty('avg_resolution_hours');
      expect(typeof dept.compliance_rate).toBe('number');
      expect(typeof dept.avg_resolution_hours).toBe('number');
    });

    it('GET /api/analytics/categories should return category distribution breakdown', async () => {
      const res = await request(app).get('/api/analytics/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const cat = res.body.data[0];
      expect(cat).toHaveProperty('category_name');
      expect(cat).toHaveProperty('department_code');
      expect(cat).toHaveProperty('count');
      expect(cat).toHaveProperty('percentage');
      expect(typeof cat.percentage).toBe('number');
    });

    it('GET /api/analytics/wards should return ward-wise grievance concentration and resolution rates', async () => {
      const res = await request(app).get('/api/analytics/wards');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const ward = res.body.data[0];
      expect(ward).toHaveProperty('ward_no');
      expect(ward).toHaveProperty('total_complaints');
      expect(ward).toHaveProperty('resolved');
      expect(ward).toHaveProperty('resolution_rate');
      expect(typeof ward.resolution_rate).toBe('number');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. EXPORT REPORTS (CSV / JSON) & VALIDATION
  // ---------------------------------------------------------------------------
  describe('Official Reports Generation and Data Export', () => {
    it('GET /api/analytics/export?format=json should return structured JSON dataset', async () => {
      const res = await request(app).get('/api/analytics/export?format=json');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('generated_at');
      expect(res.body).toHaveProperty('total_records');
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('tracking_code');
        expect(res.body.data[0]).toHaveProperty('sla_status');
      }
    });

    it('GET /api/analytics/export?format=csv should return downloadable CSV file stream with headers', async () => {
      const res = await request(app).get('/api/analytics/export?format=csv');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('SmartCity_Grievance_Report.csv');
      expect(res.text).toContain('Tracking Code');
      expect(res.text).toContain('Department');
      expect(res.text).toContain('SLA Status');
    });

    it('GET /api/analytics/export with invalid format should return 400 Bad Request', async () => {
      const res = await request(app).get('/api/analytics/export?format=unsupported_format');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('format');
    });

    it('GET /api/analytics/export with filters should filter records appropriately', async () => {
      const res = await request(app).get('/api/analytics/export?format=json&department_id=1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
