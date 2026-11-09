const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Verify JWT Token Middleware
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    req.user = decoded; // { id, email, name, role, role_id, department_id? }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
}

/**
 * Role-Based Authorization Middleware
 * @param  {...string} allowedRoles (e.g. 'admin', 'officer', 'citizen')
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] roles. Your role is '${req.user.role}'.`,
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  authorizeRoles,
};
