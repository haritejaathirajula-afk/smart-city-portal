const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');

/**
 * Register a new citizen account
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, email, password, phone, address, ward_no } = req.body;

    // Check database connectivity
    const dbCheck = await db.checkConnection();
    if (!dbCheck.connected) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable. Please verify MySQL server status.',
      });
    }

    // Check if email already exists
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Retrieve citizen role ID
    const [roles] = await db.query(
      "SELECT id FROM roles WHERE name = 'citizen'"
    );

    const roleId = roles.length > 0 ? roles[0].id : 3;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert new user
    const [insertResult] = await db.query(
      `INSERT INTO users (role_id, name, email, password_hash, phone, address, ward_no, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [roleId, name, email, passwordHash, phone || null, address || null, ward_no || null]
    );

    const userId = insertResult.insertId;

    // Create JWT token
    const tokenPayload = {
      id: userId,
      email,
      name,
      role: 'citizen',
      role_id: roleId,
    };

    const token = jwt.sign(tokenPayload, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn,
    });

    res.status(201).json({
      success: true,
      message: 'Citizen registration successful! Welcome to the Smart City Portal.',
      token,
      user: {
        id: userId,
        name,
        email,
        role: 'citizen',
        phone: phone || null,
        address: address || null,
        ward_no: ward_no || null,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Authenticate user (Citizen, Officer, Admin)
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Check database connectivity
    const dbCheck = await db.checkConnection();
    if (!dbCheck.connected) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable. Please verify MySQL server status.',
      });
    }

    // Query user with role and officer details
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.phone, u.address, u.ward_no, u.is_active,
              r.name AS role, r.id AS role_id,
              o.id AS officer_id, o.badge_number, o.designation, o.department_id,
              d.name AS department_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN officers o ON u.id = o.user_id
       LEFT JOIN departments d ON o.department_id = d.id
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact municipal administration.',
      });
    }

    // Compare bcrypt password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    // Sign JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      role_id: user.role_id,
      department_id: user.department_id || null,
      officer_id: user.officer_id || null,
    };

    const token = jwt.sign(tokenPayload, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        ward_no: user.ward_no,
        officer: user.officer_id
          ? {
              id: user.officer_id,
              badgeNumber: user.badge_number,
              designation: user.designation,
              departmentId: user.department_id,
              departmentName: user.department_name,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
async function getCurrentUser(req, res, next) {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.address, u.ward_no, u.is_active, u.created_at,
              r.name AS role, r.id AS role_id,
              o.id AS officer_id, o.badge_number, o.designation, o.department_id,
              d.name AS department_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN officers o ON u.id = o.user_id
       LEFT JOIN departments d ON o.department_id = d.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    const user = users[0];

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        ward_no: user.ward_no,
        createdAt: user.created_at,
        officer: user.officer_id
          ? {
              id: user.officer_id,
              badgeNumber: user.badge_number,
              designation: user.designation,
              departmentId: user.department_id,
              departmentName: user.department_name,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user profile
 * PUT /api/auth/profile
 */
async function updateProfile(req, res, next) {
  try {
    const { name, phone, address, ward_no } = req.body;

    await db.query(
      `UPDATE users
       SET name = COALESCE(?, name),
           phone = COALESCE(?, phone),
           address = COALESCE(?, address),
           ward_no = COALESCE(?, ward_no)
       WHERE id = ?`,
      [name, phone, address, ward_no, req.user.id]
    );

    // Fetch updated user
    const [users] = await db.query(
      'SELECT id, name, email, phone, address, ward_no FROM users WHERE id = ?',
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: users[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change user password
 * PUT /api/auth/change-password
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const [users] = await db.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.',
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newHash, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
};
