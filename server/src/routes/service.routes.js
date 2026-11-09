const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

// Public or Authenticated catalog
router.get('/catalog', serviceController.getServiceCatalog);

// Authenticated Citizen/Officer/Admin routes
router.post('/requests', verifyToken, serviceController.createServiceRequest);
router.get('/requests', verifyToken, serviceController.getServiceRequests);
router.get('/requests/:idOrCode', verifyToken, serviceController.getServiceRequestByCode);
router.patch('/requests/:id/cancel', verifyToken, serviceController.cancelServiceRequest);

// Officer / Admin status updates
router.patch('/requests/:id/status', verifyToken, authorizeRoles('officer', 'admin'), serviceController.updateServiceRequestStatus);

module.exports = router;
