const { body, validationResult } = require('express-validator');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please verify your complaint details.',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
}

const validateCreateComplaint = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Complaint title is required.')
    .isLength({ min: 5, max: 150 })
    .withMessage('Title must be between 5 and 150 characters.'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Detailed description of the issue is required.')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long.'),
  body('category_id')
    .notEmpty()
    .withMessage('Please select a valid complaint category.')
    .isInt()
    .withMessage('Category ID must be an integer.'),
  body('department_id')
    .notEmpty()
    .withMessage('Please select the responsible municipal department.')
    .isInt()
    .withMessage('Department ID must be an integer.'),
  body('location_address')
    .trim()
    .notEmpty()
    .withMessage('Location address or landmark is required.')
    .isLength({ min: 5, max: 255 })
    .withMessage('Location address must be between 5 and 255 characters.'),
  body('ward_no')
    .trim()
    .notEmpty()
    .withMessage('Municipal ward number is required.'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'])
    .withMessage('Priority must be one of: LOW, MEDIUM, HIGH, EMERGENCY.'),
  body('latitude')
    .optional({ checkFalsy: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid coordinate between -90 and 90.'),
  body('longitude')
    .optional({ checkFalsy: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid coordinate between -180 and 180.'),
  body('photo_url')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (value.startsWith('/uploads/') || value.startsWith('uploads/')) {
        return true;
      }
      try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        throw new Error('Photo URL must be a valid web URL or uploaded photo path.');
      }
    }),
  handleValidationErrors,
];

module.exports = {
  validateCreateComplaint,
  handleValidationErrors,
};
