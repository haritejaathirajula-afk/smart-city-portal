const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateChangePassword,
} = require('../middleware/auth.validator');

// Public endpoints
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Protected endpoints
router.get('/me', verifyToken, authController.getCurrentUser);
router.put('/profile', verifyToken, validateProfileUpdate, authController.updateProfile);
router.put('/change-password', verifyToken, validateChangePassword, authController.changePassword);

module.exports = router;
