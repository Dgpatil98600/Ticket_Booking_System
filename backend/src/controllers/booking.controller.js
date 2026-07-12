
import * as bookingService from '../services/booking.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const createBooking = async (req, res, next) => {
  try {
    const { eventId, seatIds } = req.body;
    const booking = await bookingService.createBooking(
      req.user._id,
      eventId,
      seatIds,
      req.user.email,
      req.user.name
    );
    return successResponse(res, { booking }, 'Booking confirmed! Check your email for details.', 201);
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const result = await bookingService.getUserBookings(req.user._id, req.query);
    return successResponse(res, result, 'Bookings retrieved');
  } catch (error) {
    next(error);
  }
};

const verifyBooking = async (req, res, next) => {
  try {
    const result = await bookingService.verifyBooking(req.params.bookingRef);
    return successResponse(res, result, 'Booking verified');
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user._id, req.user.role);
    return successResponse(res, { booking }, 'Booking retrieved');
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(
      req.params.id,
      req.user._id,
      req.user.role,
      req.body.reason
    );
    return successResponse(res, { booking }, 'Booking cancelled successfully');
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

const getEventBookings = async (req, res, next) => {
  try {
    const result = await bookingService.getEventBookings(
      req.params.eventId,
      req.user._id,
      req.user.role,
      req.query
    );
    return successResponse(res, result, 'Event bookings retrieved');
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

export { createBooking, getMyBookings, verifyBooking, getBookingById, cancelBooking, getEventBookings };
