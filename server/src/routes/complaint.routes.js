const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');
const { validateCreateComplaint } = require('../middleware/complaint.validator');
const uploadMiddleware = require('../middleware/upload.middleware');

// GET /api/complaints/meta - Metadata (Departments and categories with SLAs)
router.get('/meta', complaintController.getMetadata);

// POST /api/complaints/upload - Upload photographic proof (Citizen, Officer, Admin)
router.post(
  '/upload',
  verifyToken,
  authorizeRoles('citizen', 'officer', 'admin'),
  uploadMiddleware.uploadImage,
  complaintController.uploadPhoto
);

// GET /api/complaints - List complaints with filters
router.get('/', (req, res, next) => {
  // Optional token parsing: If Authorization header exists, verify it, otherwise proceed
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, () => complaintController.listComplaints(req, res, next));
  }
  return complaintController.listComplaints(req, res, next);
});

// GET /api/complaints/:idOrCode - Single complaint details + status history
router.get('/:idOrCode', complaintController.getComplaintByCodeOrId);

// POST /api/complaints - Submit a grievance (Citizen or Admin)
router.post(
  '/',
  verifyToken,
  authorizeRoles('citizen', 'admin'),
  validateCreateComplaint,
  complaintController.createComplaint
);

// POST /api/complaints/:id/verify - Citizen verifies resolution
router.post(
  '/:id/verify',
  verifyToken,
  authorizeRoles('citizen', 'admin'),
  complaintController.verifyComplaint
);

// POST /api/complaints/:id/reopen - Citizen rejects resolution and reopens
router.post(
  '/:id/reopen',
  verifyToken,
  authorizeRoles('citizen', 'admin'),
  complaintController.reopenComplaint
);

module.exports = router;
