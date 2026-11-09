const env = require('../config/env');

/**
 * 404 Route Not Found Middleware
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Global centralized error handler
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || undefined,
    stack: env.isProduction ? undefined : err.stack,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
