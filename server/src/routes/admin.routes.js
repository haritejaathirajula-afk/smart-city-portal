const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

// All admin routes are strictly guarded for 'admin' role
router.use(verifyToken, authorizeRoles('admin'));

// System overview stats
router.get('/stats', adminController.getAdminStats);

// User & officer management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Department management
router.get('/departments', adminController.getDepartments);
router.post('/departments', adminController.createDepartment);
router.put('/departments/:id', adminController.updateDepartment);

// Category & SLA management
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);

// Global Complaint Triage & Reassignment
router.get('/complaints', adminController.getGlobalComplaints);
router.patch('/complaints/:id/reassign', adminController.reassignComplaint);

// System Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
