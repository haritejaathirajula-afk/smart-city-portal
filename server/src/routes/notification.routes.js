const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All notification routes require authenticated user (Citizen, Officer, Admin)
router.use(verifyToken);

router.get('/', notificationController.getNotifications);
router.patch('/mark-all-read', notificationController.markAllNotificationsRead);
router.patch('/:id/read', notificationController.markNotificationRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;

