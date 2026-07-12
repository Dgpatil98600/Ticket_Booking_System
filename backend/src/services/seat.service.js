
import Seat from '../models/Seat.js';
import Event from '../models/Event.js';
import { emitSeatUpdate } from '../config/socket.js';

const HOLD_TTL_MINUTES = parseInt(process.env.SEAT_HOLD_TTL_MINUTES || '10');

const getEventSeats = async (eventId) => {
  const seats = await Seat.find({ event: eventId })
    .sort({ row: 1, col: 1 })
    .lean();

  const seatMap = {};
  seats.forEach((seat) => {
    if (!seatMap[seat.row]) seatMap[seat.row] = [];
    seatMap[seat.row].push(seat);
  });

  return { seats, seatMap };
};

const holdSeat = async (seatId, userId, eventId) => {
  const holdExpiresAt = new Date(Date.now() + HOLD_TTL_MINUTES * 60 * 1000);

  const seat = await Seat.findOneAndUpdate(
    {
      _id: seatId,
      event: eventId,
      status: 'available', 
    },
    {
      status: 'held',
      heldBy: userId,
      holdExpiresAt,
    },
    { new: true }
  );

  if (!seat) {
    console.log(`\n[Seat] ️ Failed to hold seat ${seatId} for User ${userId}. Seat is no longer available.`);
    return null; 
  }

  emitSeatUpdate(eventId, 'seat:held', {
    seatId: seat._id,
    row: seat.row,
    col: seat.col,
    seatNumber: seat.seatNumber,
    status: 'held',
    holdExpiresAt,
  });

  console.log(`\n[Seat]  Seat ${seat.seatNumber} successfully held by User ${userId} for Event ${eventId}`);

  return seat;
};

const holdMultipleSeats = async (seatIds, userId, eventId) => {
  const successfulHolds = [];
  const failedSeats = [];

  for (const seatId of seatIds) {
    const seat = await holdSeat(seatId, userId, eventId);
    if (seat) {
      successfulHolds.push(seat);
    } else {
      failedSeats.push(seatId);
    }
  }

  if (failedSeats.length > 0) {
    
    for (const seat of successfulHolds) {
      await releaseSeat(seat._id, userId, eventId);
    }
    throw {
      statusCode: 409,
      message: `${failedSeats.length} seat(s) are no longer available. Please refresh and try again.`,
      failedSeats,
    };
  }

  return successfulHolds;
};

const releaseSeat = async (seatId, userId, eventId) => {
  const seat = await Seat.findOneAndUpdate(
    {
      _id: seatId,
      heldBy: userId, 
      status: 'held',
    },
    {
      status: 'available',
      heldBy: null,
      holdExpiresAt: null,
    },
    { new: true }
  );

  if (seat) {
    emitSeatUpdate(eventId, 'seat:released', {
      seatId: seat._id,
      row: seat.row,
      col: seat.col,
      seatNumber: seat.seatNumber,
      status: 'available',
    });
  }

  return seat;
};

const bookSeats = async (seatIds, userId, bookingId, eventId) => {
  const results = [];

  for (const seatId of seatIds) {
    const seat = await Seat.findOneAndUpdate(
      {
        _id: seatId,
        event: eventId,
        heldBy: userId,
        status: 'held', 
      },
      {
        status: 'booked',
        bookedBy: userId,
        bookingId,
        heldBy: null,
        holdExpiresAt: null,
      },
      { new: true }
    );

    if (!seat) {
      throw {
        statusCode: 409,
        message: `Seat hold has expired or is invalid. Please restart booking.`,
      };
    }

    results.push(seat);

    emitSeatUpdate(eventId, 'seat:booked', {
      seatId: seat._id,
      row: seat.row,
      col: seat.col,
      seatNumber: seat.seatNumber,
      status: 'booked',
    });
  }

  await Event.findByIdAndUpdate(eventId, {
    $inc: { availableSeats: -results.length, bookedSeats: results.length },
  });

  console.log(`\n[Booking] ️ ${results.length} seats successfully booked for Event ${eventId} by User ${userId}`);

  return results;
};

const releaseBookedSeats = async (seatIds, eventId) => {
  const updatedSeats = await Seat.updateMany(
    { _id: { $in: seatIds }, event: eventId, status: 'booked' },
    {
      status: 'available',
      bookedBy: null,
      bookingId: null,
    }
  );

  const seats = await Seat.find({ _id: { $in: seatIds } });
  seats.forEach((seat) => {
    emitSeatUpdate(eventId, 'seat:released', {
      seatId: seat._id,
      row: seat.row,
      col: seat.col,
      seatNumber: seat.seatNumber,
      status: 'available',
    });
  });

  await Event.findByIdAndUpdate(eventId, {
    $inc: {
      availableSeats: seatIds.length,
      bookedSeats: -seatIds.length,
    },
  });

  console.log(`\n[Booking]  ${seatIds.length} booked seats released due to cancellation for Event ${eventId}`);

  return updatedSeats;
};

const getAvailableSeatsByCategory = async (eventId, category) => {
  return Seat.find({ event: eventId, category, status: 'available' })
    .sort({ row: 1, col: 1 })
    .limit(1); 
};

export { getEventSeats,
  holdSeat,
  holdMultipleSeats,
  releaseSeat,
  releaseBookedSeats,
  bookSeats,
  getAvailableSeatsByCategory, };
