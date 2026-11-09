const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

// Public or Authenticated Analytics endpoints
router.get('/kpis', analyticsController.getGlobalKpis);
router.get('/trends', analyticsController.getTrends);
router.get('/sla', analyticsController.getSlaPerformance);
router.get('/categories', analyticsController.getCategoryAnalytics);
router.get('/wards', analyticsController.getWardAnalytics);
router.get('/export', analyticsController.exportReport);

module.exports = router;
