const express = require('express');
const router = express.Router();
const officerController = require('../controllers/officer.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

// All officer routes require Officer or Admin clearance
router.use(verifyToken, authorizeRoles('officer', 'admin'));

// GET /api/officer/dashboard - Department queue and stats
router.get('/dashboard', officerController.getOfficerDashboard);

// GET /api/officer/field-workers - Available field technicians for department
router.get('/field-workers', officerController.getFieldWorkers);

// POST /api/officer/tasks - Dispatch field task
router.post('/tasks', officerController.createTask);

// PATCH /api/officer/tasks/:id/status - Update field task status
router.patch('/tasks/:id/status', officerController.updateTaskStatus);

// PATCH /api/officer/complaints/:id/assign - Self-assign or assign to officer
router.patch('/complaints/:id/assign', officerController.assignComplaint);

// PATCH /api/officer/complaints/:id/status - Update status & progress notes & resolution & rejection
router.patch('/complaints/:id/status', officerController.updateComplaintStatus);

module.exports = router;
