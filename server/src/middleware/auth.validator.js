const { body, validationResult } = require('express-validator');

// Helper to check validation results and return formatted response
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check your inputs.',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
}

const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .withMessage('Please provide a valid contact phone number.'),
  body('ward_no')
    .optional({ checkFalsy: true })
    .trim(),
  body('address')
    .optional({ checkFalsy: true })
    .trim(),
  handleValidationErrors,
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
  handleValidationErrors,
];

const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .withMessage('Please provide a valid phone number.'),
  body('address')
    .optional()
    .trim(),
  body('ward_no')
    .optional()
    .trim(),
  handleValidationErrors,
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required.'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required.')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long.'),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateChangePassword,
};
