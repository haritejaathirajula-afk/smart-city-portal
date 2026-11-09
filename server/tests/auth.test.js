const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const db = require('../src/config/db');
const { verifyToken, authorizeRoles } = require('../src/middleware/auth.middleware');

afterAll(async () => {
  await db.closePool();
});

describe('Authentication and RBAC API (Phase 3)', () => {
  describe('Input Validation on Auth Endpoints', () => {
    it('POST /api/auth/login should reject empty body with 400', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('errors');
      expect(Array.isArray(res.body.errors)).toBe(true);
      const fields = res.body.errors.map((e) => e.field);
      expect(fields).toContain('email');
      expect(fields).toContain('password');
    });

    it('POST /api/auth/register should reject invalid email and short password with 400', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'A',
        email: 'invalid-email-format',
        password: '123',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('JWT Verification Middleware', () => {
    it('GET /api/auth/me without token should return 401 Access Denied', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('Access denied');
    });

    it('GET /api/auth/me with invalid token should return 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer totally.invalid.jwttokenhere');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('Invalid authentication token');
    });

    it('verifyToken should populate req.user when valid token is provided', (done) => {
      const payload = { id: 99, email: 'test@smartcity.gov', role: 'officer' };
      const validToken = jwt.sign(payload, env.jwt.secret, { expiresIn: '1h' });

      const req = {
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      };
      const res = {};
      const next = () => {
        expect(req.user).toBeDefined();
        expect(req.user.id).toBe(99);
        expect(req.user.email).toBe('test@smartcity.gov');
        expect(req.user.role).toBe('officer');
        done();
      };

      verifyToken(req, res, next);
    });
  });

  describe('Role-Based Authorization Middleware (RBAC)', () => {
    it('authorizeRoles should allow user with matching role', (done) => {
      const req = {
        user: { id: 1, role: 'admin' },
      };
      const res = {};
      const next = () => {
        done(); // Called successfully
      };

      const middleware = authorizeRoles('admin', 'officer');
      middleware(req, res, next);
    });

    it('authorizeRoles should reject user with non-matching role with 403 Forbidden', () => {
      const req = {
        user: { id: 5, role: 'citizen' },
      };
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const res = { status: statusMock };
      const next = jest.fn();

      const middleware = authorizeRoles('admin');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("requires one of [admin]"),
        })
      );
    });
  });

  describe('Real MySQL Authentication & Password Lifecycle', () => {
    const testEmail = `newcitizen_${Date.now()}@smartcity.gov`;
    let userToken = '';

    it('POST /api/auth/register should successfully register citizen in MySQL', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Priya Narayanan',
          email: testEmail,
          password: 'Password@123',
          phone: '+91-98765-11223',
          ward_no: 'Ward-14',
          address: '404 Metro Towers, Ward 14',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', testEmail);
      expect(res.body.user).toHaveProperty('role', 'citizen');
      userToken = res.body.token;

      // Ensure password hash is not exposed
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('POST /api/auth/register with existing email should return 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Priya',
          email: testEmail,
          password: 'Password@123',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('already exists');
    });

    it('POST /api/auth/login with valid credentials should authenticate and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'Password@123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('role', 'citizen');
    });

    it('POST /api/auth/login with incorrect password should return 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword999!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('GET /api/auth/me should fetch live authenticated user profile from MySQL', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('email', testEmail);
      expect(res.body.data).toHaveProperty('ward_no', 'Ward-14');
      expect(res.body.data).not.toHaveProperty('password_hash');
    });

    it('PUT /api/auth/profile should update profile details in MySQL', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Priya N. Sharma',
          phone: '+91-98765-99887',
          ward_no: 'Ward-15',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.name).toBe('Priya N. Sharma');
      expect(res.body.data.phone).toBe('+91-98765-99887');
      expect(res.body.data.ward_no).toBe('Ward-15');
    });

    it('PUT /api/auth/change-password should verify old password and update bcrypt hash', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'Password@123',
          newPassword: 'NewSecurePassword@456',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      // Verify login succeeds with the NEW password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'NewSecurePassword@456',
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body).toHaveProperty('token');
    });

    afterAll(async () => {
      // Clean up test user from database
      try {
        await db.query('DELETE FROM users WHERE email = ?', [testEmail]);
      } catch (e) {
        // Ignore
      }
    });
  });
});
