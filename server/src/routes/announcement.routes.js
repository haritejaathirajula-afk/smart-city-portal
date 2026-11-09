const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcement.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

// Public / Authenticated Announcement Routes
router.get('/announcements', announcementController.getAnnouncements);
router.get('/announcements/:id', announcementController.getAnnouncementById);
router.post('/announcements', verifyToken, authorizeRoles('officer', 'admin'), announcementController.createAnnouncement);
router.put('/announcements/:id', verifyToken, authorizeRoles('officer', 'admin'), announcementController.updateAnnouncement);
router.delete('/announcements/:id', verifyToken, authorizeRoles('officer', 'admin'), announcementController.deleteAnnouncement);

// Emergency Alert Routes
router.get('/alerts', announcementController.getEmergencyAlerts);
router.get('/alerts/:id', announcementController.getEmergencyAlertById);
router.post('/alerts', verifyToken, authorizeRoles('officer', 'admin'), announcementController.createEmergencyAlert);
router.patch('/alerts/:id/deactivate', verifyToken, authorizeRoles('officer', 'admin'), announcementController.deactivateEmergencyAlert);
router.delete('/alerts/:id', verifyToken, authorizeRoles('officer', 'admin'), announcementController.deleteEmergencyAlert);

module.exports = router;
