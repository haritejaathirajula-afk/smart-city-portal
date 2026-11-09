const express = require('express');
const router = express.Router();
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const citizenRoutes = require('./citizen.routes');
const complaintRoutes = require('./complaint.routes');
const officerRoutes = require('./officer.routes');
const adminRoutes = require('./admin.routes');
const serviceRoutes = require('./service.routes');
const announcementRoutes = require('./announcement.routes');
const feedbackRoutes = require('./feedback.routes');
const analyticsRoutes = require('./analytics.routes');
const mapRoutes = require('./map.routes');
const notificationRoutes = require('./notification.routes');

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/citizen', citizenRoutes);
router.use('/notifications', notificationRoutes);
router.use('/complaints', complaintRoutes);
router.use('/officer', officerRoutes);
router.use('/admin', adminRoutes);
router.use('/services', serviceRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/map', mapRoutes);
router.use('/', announcementRoutes);

// Root /api endpoint info
router.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Smart City Service Portal REST API',
    version: '1.0.0',
    documentation: '/server/API_DOCS.md',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/me',
        updateProfile: 'PUT /api/auth/profile',
        changePassword: 'PUT /api/auth/change-password',
      },
      citizen: 'GET /api/citizen/dashboard',
      complaints: {
        meta: 'GET /api/complaints/meta',
        list: 'GET /api/complaints',
        create: 'POST /api/complaints',
        details: 'GET /api/complaints/:idOrCode',
        verify: 'POST /api/complaints/:id/verify',
        reopen: 'POST /api/complaints/:id/reopen',
      },
      officer: {
        dashboard: 'GET /api/officer/dashboard',
        workers: 'GET /api/officer/field-workers',
        dispatchTask: 'POST /api/officer/tasks',
        updateStatus: 'PATCH /api/officer/complaints/:id/status',
      },
      admin: {
        stats: 'GET /api/admin/stats',
        users: 'GET /api/admin/users',
        departments: 'GET /api/admin/departments',
        categories: 'GET /api/admin/categories',
        complaints: 'GET /api/admin/complaints',
        reassign: 'PATCH /api/admin/complaints/:id/reassign',
        auditLogs: 'GET /api/admin/audit-logs',
      },
      services: {
        catalog: 'GET /api/services/catalog',
        requests: 'GET /api/services/requests',
        createRequest: 'POST /api/services/requests',
        updateStatus: 'PATCH /api/services/requests/:id/status',
        cancel: 'PATCH /api/services/requests/:id/cancel',
      },
      announcements: 'GET /api/announcements',
      alerts: 'GET /api/alerts',
      feedback: {
        summary: 'GET /api/feedback/summary',
        recent: 'GET /api/feedback/recent',
        submit: 'POST /api/feedback',
      },
      analytics: {
        trends: 'GET /api/analytics/trends',
        sla: 'GET /api/analytics/sla',
        categories: 'GET /api/analytics/categories',
        wards: 'GET /api/analytics/wards',
        export: 'GET /api/analytics/export?format=csv',
      },
      map: {
        complaints: 'GET /api/map/complaints',
        clusters: 'GET /api/map/clusters',
      },
    },
  });
});

module.exports = router;
