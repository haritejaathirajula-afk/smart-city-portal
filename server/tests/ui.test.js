const request = require('supertest');
const app = require('../src/app');
const path = require('path');
const fs = require('fs');

describe('Phase 15: UI & Client Asset Delivery Verification Test Suite', () => {
  const distPath = path.resolve(__dirname, '../../client/dist');
  const indexPath = path.join(distPath, 'index.html');
  const assetsPath = path.join(distPath, 'assets');

  // ---------------------------------------------------------------------------
  // 1. PRODUCTION ASSET BUILD INTEGRITY
  // ---------------------------------------------------------------------------
  describe('Frontend Production Bundle Integrity', () => {
    it('verifies that client production build index.html exists and is well-formed', () => {
      expect(fs.existsSync(indexPath)).toBe(true);
      const htmlContent = fs.readFileSync(indexPath, 'utf8');

      expect(htmlContent).toMatch(/<!doctype html>/i);
      expect(htmlContent).toContain('id="root"');
      expect(htmlContent).toContain('<meta name="viewport"');
      expect(htmlContent).toMatch(/smart city|portal/i);
    });

    it('verifies compiled JavaScript and CSS assets exist in dist/assets', () => {
      expect(fs.existsSync(assetsPath)).toBe(true);
      const files = fs.readdirSync(assetsPath);

      const jsFiles = files.filter((f) => f.endsWith('.js'));
      const cssFiles = files.filter((f) => f.endsWith('.css'));

      expect(jsFiles.length).toBeGreaterThan(0);
      expect(cssFiles.length).toBeGreaterThan(0);

      // Verify JavaScript bundle size is non-trivial (> 100KB)
      const primaryJs = path.join(assetsPath, jsFiles[0]);
      const jsStats = fs.statSync(primaryJs);
      expect(jsStats.size).toBeGreaterThan(100 * 1024);

      // Verify CSS bundle has styling content (> 10KB)
      const primaryCss = path.join(assetsPath, cssFiles[0]);
      const cssStats = fs.statSync(primaryCss);
      expect(cssStats.size).toBeGreaterThan(10 * 1024);
    });

    it('verifies mobile Capacitor application configuration is valid', () => {
      const capConfigPath = path.resolve(__dirname, '../../client/capacitor.config.json');
      expect(fs.existsSync(capConfigPath)).toBe(true);

      const config = JSON.parse(fs.readFileSync(capConfigPath, 'utf8'));
      expect(config.appId).toBe('com.smartcity.portal');
      expect(config.appName).toBe('Smart City Portal');
      expect(config.webDir).toBe('dist');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. SPA ROUTING & FALLBACK DELIVERY
  // ---------------------------------------------------------------------------
  describe('SPA Fallback Routing & Static Delivery', () => {
    it('GET / with Accept: text/html serves index.html or API status', async () => {
      const res = await request(app)
        .get('/')
        .set('Accept', 'text/html');

      expect(res.status).toBe(200);
      // In test mode, app.get('/') returns JSON API status; otherwise HTML
      if (res.headers['content-type'].includes('application/json')) {
        expect(res.body.portal).toMatch(/smart city/i);
      } else {
        expect(res.text).toContain('id="root"');
      }
    });

    it('GET /dashboard serves SPA fallback HTML', async () => {
      const res = await request(app)
        .get('/dashboard')
        .set('Accept', 'text/html');

      expect(res.status).toBe(200);
      expect(res.text).toContain('id="root"');
    });

    it('GET /admin deep link serves SPA fallback HTML', async () => {
      const res = await request(app)
        .get('/admin')
        .set('Accept', 'text/html');

      expect(res.status).toBe(200);
      expect(res.text).toContain('id="root"');
    });

    it('GET /officer deep link serves SPA fallback HTML', async () => {
      const res = await request(app)
        .get('/officer')
        .set('Accept', 'text/html');

      expect(res.status).toBe(200);
      expect(res.text).toContain('id="root"');
    });

    it('GET /analytics deep link serves SPA fallback HTML', async () => {
      const res = await request(app)
        .get('/analytics')
        .set('Accept', 'text/html');

      expect(res.status).toBe(200);
      expect(res.text).toContain('id="root"');
    });

    it('GET /map deep link serves SPA fallback HTML', async () => {
      const res = await request(app)
        .get('/map')
        .set('Accept', 'text/html');

      expect(res.status).toBe(200);
      expect(res.text).toContain('id="root"');
    });

    it('GET /services deep link serves SPA fallback HTML', async () => {
      const res = await request(app)
        .get('/services')
        .set('Accept', 'text/html');

      expect(res.status).toBe(200);
      expect(res.text).toContain('id="root"');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. API 404 ROUTE ISOLATION
  // ---------------------------------------------------------------------------
  describe('API 404 Route Isolation', () => {
    it('GET /api/nonexistent-route returns JSON 404 and does NOT return HTML SPA', async () => {
      const res = await request(app).get('/api/nonexistent-route-for-testing');
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/API route not found/i);
    });

    it('POST /api/nonexistent-route returns JSON 404', async () => {
      const res = await request(app).post('/api/nonexistent-endpoint').send({});
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.body.success).toBe(false);
    });
  });
});
