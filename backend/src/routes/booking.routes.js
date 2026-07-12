import express from 'express';
const router = express.Router();
import * as ctrl from '../controllers/booking.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validateCreateBooking, validateMongoId } from '../middlewares/validate.middleware.js';

router.get('/verify/:bookingRef', ctrl.verifyBooking);

router.get('/my', protect, ctrl.getMyBookings);

router.get('/event/:eventId', protect, authorize('organizer', 'admin'), ctrl.getEventBookings);

router.post('/', protect, authorize('customer', 'admin'), validateCreateBooking, ctrl.createBooking);

router.get('/:id', protect, validateMongoId('id'), ctrl.getBookingById);

router.delete('/:id', protect, validateMongoId('id'), ctrl.cancelBooking);

export default router;
