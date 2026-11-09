const express = require('express');
const router = express.Router();
const mapController = require('../controllers/map.controller');
const { verifyToken, authorizeRoles } = require('../middleware/auth.middleware');

// Public geospatial map endpoints
router.get('/complaints', mapController.getMapComplaints);
router.get('/clusters', mapController.getWardClusters);
router.get('/heatmap', mapController.getHeatmapData);

// Protected officer & admin map view
router.get(
  '/officer-view',
  verifyToken,
  authorizeRoles('officer', 'admin'),
  mapController.getOfficerMapView
);

module.exports = router;
