const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public Feedback Analytics & Reviews
router.get('/summary', feedbackController.getFeedbackSummary);
router.get('/recent', feedbackController.getRecentFeedback);

// Authenticated Feedback Routes
router.get('/my', verifyToken, feedbackController.getMyFeedback);
router.get('/complaint/:id', verifyToken, feedbackController.getComplaintFeedback);
router.post('/', verifyToken, feedbackController.submitFeedback);
router.put('/:id', verifyToken, feedbackController.updateFeedback);
router.delete('/:id', verifyToken, feedbackController.deleteFeedback);

module.exports = router;
