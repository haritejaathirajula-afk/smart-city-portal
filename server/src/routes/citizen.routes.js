const express = require('express');
const router = express.Router();
const citizenController = require('../controllers/citizen.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

// GET /api/citizen/dashboard (Citizen or Admin oversight)
router.get(
  '/dashboard',
  verifyToken,
  authorizeRoles('citizen', 'admin'),
  citizenController.getDashboardSummary
);

// GET /api/citizen/notifications (Citizen or Admin oversight)
router.get(
  '/notifications',
  verifyToken,
  authorizeRoles('citizen', 'admin'),
  citizenController.getNotifications
);

// PATCH /api/citizen/notifications/mark-all-read (Citizen or Admin)
router.patch(
  '/notifications/mark-all-read',
  verifyToken,
  authorizeRoles('citizen', 'admin'),
  citizenController.markAllNotificationsRead
);

// PATCH /api/citizen/notifications/:id/read (Citizen or Admin)
router.patch(
  '/notifications/:id/read',
  verifyToken,
  authorizeRoles('citizen', 'admin'),
  citizenController.markNotificationRead
);

module.exports = router;
