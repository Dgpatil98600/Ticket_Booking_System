
import { body, param, query, validationResult } from 'express-validator';
import { errorResponse } from '../utils/apiResponse.js';

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));
    return errorResponse(res, 'Validation failed', 400, formattedErrors);
  }
  next();
};

const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['customer', 'organizer', 'admin']).withMessage('Invalid role'),
  handleValidationErrors,
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const validateVenue = [
  body('name').trim().notEmpty().withMessage('Venue name is required'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('totalRows')
    .isInt({ min: 1, max: 50 }).withMessage('Total rows must be between 1 and 50'),
  body('totalCols')
    .isInt({ min: 1, max: 50 }).withMessage('Total columns must be between 1 and 50'),
  body('categories')
    .isArray({ min: 1 }).withMessage('At least one category is required'),
  body('categories.*.name')
    .isIn(['premium', 'standard', 'economy']).withMessage('Invalid category name'),
  body('categories.*.rows')
    .isArray({ min: 1 }).withMessage('Each category must have at least one row'),
  handleValidationErrors,
];

const validateEvent = [
  body('title').trim().notEmpty().withMessage('Event title is required'),
  body('type')
    .isIn(['movie', 'concert', 'sports', 'theater', 'other']).withMessage('Invalid event type'),
  body('venue').isMongoId().withMessage('Invalid venue ID'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be in HH:MM format'),
  body('pricing.premium').optional().isNumeric().withMessage('Premium price must be a number'),
  body('pricing.standard').optional().isNumeric().withMessage('Standard price must be a number'),
  body('pricing.economy').optional().isNumeric().withMessage('Economy price must be a number'),
  handleValidationErrors,
];

const validateSeatHold = [
  body('eventId').isMongoId().withMessage('Invalid event ID'),
  body('seatId').isMongoId().withMessage('Invalid seat ID'),
  handleValidationErrors,
];

const validateMultiSeatHold = [
  body('eventId').isMongoId().withMessage('Invalid event ID'),
  body('seatIds').isArray({ min: 1, max: 10 }).withMessage('seatIds must be an array of 1-10 seats'),
  body('seatIds.*').isMongoId().withMessage('Invalid seat ID in array'),
  handleValidationErrors,
];

const validateCreateBooking = [
  body('eventId').isMongoId().withMessage('Invalid event ID'),
  body('seatIds').isArray({ min: 1 }).withMessage('seatIds must be a non-empty array'),
  body('seatIds.*').isMongoId().withMessage('Invalid seat ID'),
  handleValidationErrors,
];

const validateJoinWaitlist = [
  body('eventId').isMongoId().withMessage('Invalid event ID'),
  body('category')
    .isIn(['premium', 'standard', 'economy']).withMessage('Invalid category'),
  handleValidationErrors,
];

const validateMongoId = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
  handleValidationErrors,
];

export { handleValidationErrors,
  validateRegister,
  validateLogin,
  validateVenue,
  validateEvent,
  validateSeatHold,
  validateMultiSeatHold,
  validateCreateBooking,
  validateJoinWaitlist,
  validateMongoId, };
