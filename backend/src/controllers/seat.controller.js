
import * as seatService from '../services/seat.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const getEventSeats = async (req, res, next) => {
  try {
    const result = await seatService.getEventSeats(req.params.eventId);
    return successResponse(res, result, 'Seats retrieved');
  } catch (error) {
    next(error);
  }
};

const holdSeats = async (req, res, next) => {
  try {
    const { eventId, seatIds } = req.body;
    const seats = await seatService.holdMultipleSeats(seatIds, req.user._id, eventId);
    const holdExpiresAt = seats[0]?.holdExpiresAt;

    return successResponse(
      res,
      { seats, holdExpiresAt, holdTtlMinutes: parseInt(process.env.SEAT_HOLD_TTL_MINUTES || '10') },
      `${seats.length} seat(s) held successfully. Hold expires at ${holdExpiresAt?.toISOString()}`,
      200
    );
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

const releaseSeats = async (req, res, next) => {
  try {
    const { eventId, seatIds } = req.body;
    const results = [];

    for (const seatId of seatIds) {
      const seat = await seatService.releaseSeat(seatId, req.user._id, eventId);
      if (seat) results.push(seat);
    }

    return successResponse(res, { released: results.length }, 'Seats released');
  } catch (error) {
    next(error);
  }
};

export { getEventSeats, holdSeats, releaseSeats };
