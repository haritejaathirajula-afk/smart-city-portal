const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

afterAll(async () => {
  await db.closePool();
});

describe('Health and System Status API', () => {
  it('GET / should return online status', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('portal', 'Smart City Service Portal API Server');
    expect(res.body).toHaveProperty('status', 'online');
  });

  it('GET /api should return API documentation directory', async () => {
    const res = await request(app).get('/api');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.endpoints).toHaveProperty('health', '/api/health');
  });

  it('GET /api/health should return system status, memory, and database check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('status', 'ok');
    expect(res.body.data).toHaveProperty('service', 'Smart City Service Portal API');
    expect(res.body.data).toHaveProperty('database');
    expect(res.body.data.database).toHaveProperty('connected');
  });

  it('GET /api/nonexistent-route should return structured 404', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toContain('API route not found');
  });
});
