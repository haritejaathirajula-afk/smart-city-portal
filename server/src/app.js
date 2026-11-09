const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const requestLogger = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes');

const app = express();

// Security HTTP headers (configured to allow scripts and assets over tunnels and local networks)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Cross-Origin Resource Sharing (universal for Web, Mobile, and Public Tunnels)
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins (mobile apps, capacitor, local network, and public tunnels)
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Bypass-Tunnel-Reminder',
    'bypass-tunnel-reminder',
    'X-Requested-With',
  ],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Static uploads directory (for complaint and resolution proof images)
const uploadsPath = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Static frontend build path
const clientDistPath = path.join(__dirname, '../../client/dist');

// Root endpoint: return API status when requested in test mode, by API clients, or when client dist is not built
app.get('/', (req, res, next) => {
  const acceptsHtml = req.accepts('html');
  const acceptsJson = req.accepts('json');

  if (
    process.env.NODE_ENV === 'test' ||
    (!acceptsHtml && acceptsJson) ||
    !fs.existsSync(path.join(clientDistPath, 'index.html'))
  ) {
    return res.status(200).json({
      portal: 'Smart City Service Portal API Server',
      status: 'online',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      api: '/api',
      documentation: '/api',
    });
  }
  next();
});

// Mount main API routes
app.use('/api', apiRoutes);

// Serve static frontend files if built
app.use(express.static(clientDistPath));

// API 404 handler (only for /api/* routes that didn't match)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Single Page Application (SPA) fallback: serve index.html for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).json({
    portal: 'Smart City Service Portal API Server',
    status: 'online',
    message: 'Frontend is running in development mode. Access via Vite dev server.',
    api: '/api',
  });
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
