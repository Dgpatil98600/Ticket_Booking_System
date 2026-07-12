
import Booking from '../models/Booking.js';
import Seat from '../models/Seat.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { bookSeats, releaseBookedSeats } from './seat.service.js';
import { generateQRCode } from '../utils/qrUtils.js';
import { sendBookingConfirmation, sendCancellationConfirmation } from '../utils/emailUtils.js';
import { processWaitlistForCategory } from './waitlist.service.js';

const createBooking = async (userId, eventId, seatIds, userEmail, userName) => {
  
  const heldSeats = await Seat.find({
    _id: { $in: seatIds },
    event: eventId,
    heldBy: userId,
    status: 'held',
  });

  if (heldSeats.length !== seatIds.length) {
    throw {
      statusCode: 409,
      message: 'One or more seat holds have expired or are invalid. Please restart your booking.',
    };
  }

  const now = new Date();
  const expiredSeat = heldSeats.find((s) => s.holdExpiresAt <= now);
  if (expiredSeat) {
    throw {
      statusCode: 409,
      message: `Seat hold for ${expiredSeat.seatNumber} has expired. Please select seats again.`,
    };
  }

  const totalAmount = heldSeats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = Math.round(totalAmount * 0.02); 
  const finalAmount = totalAmount + convenienceFee;

  const seatSnapshot = heldSeats.map((s) => ({
    seat: s._id,
    seatNumber: s.seatNumber,
    row: s.row,
    col: s.col,
    category: s.category,
    price: s.price,
  }));

  const booking = await Booking.create({
    user: userId,
    event: eventId,
    seats: seatSnapshot,
    totalAmount,
    convenienceFee,
    finalAmount,
    status: 'confirmed',
  });

  const verifyUrl = `${process.env.SERVER_URL}/api/bookings/verify/${booking.bookingRef}`;
  const qrCode = await generateQRCode(verifyUrl);

  booking.qrCode = qrCode;
  booking.qrUrl = verifyUrl;
  await booking.save();

  await bookSeats(seatIds, userId, booking._id, eventId);

  console.log(`\n[Booking]  Booking Confirmed! Ref: ${booking.bookingRef} | User: ${userEmail} | Amount: ₹${finalAmount}`);

  const event = await Event.findById(eventId).populate('venue', 'name');
  sendBookingConfirmation({
    to: userEmail,
    userName,
    bookingRef: booking.bookingRef,
    eventTitle: event.title,
    eventDate: event.date,
    eventTime: event.time,
    venue: event.venue?.name || 'TBD',
    seats: seatSnapshot,
    totalAmount: finalAmount,
    qrCode,
  }).then(() => {
    Booking.findByIdAndUpdate(booking._id, { emailSent: true }).exec();
  }).catch(console.error);

  return booking.populate([
    { path: 'event', populate: { path: 'venue', select: 'name address' } },
    { path: 'user', select: 'name email' },
  ]);
};

const getBookingById = async (bookingId, userId, userRole) => {
  const booking = await Booking.findById(bookingId)
    .populate({ path: 'event', populate: { path: 'venue', select: 'name address' } })
    .populate('user', 'name email');

  if (!booking) throw { statusCode: 404, message: 'Booking not found' };

  if (userRole === 'customer' && booking.user._id.toString() !== userId.toString()) {
    throw { statusCode: 403, message: 'Access denied' };
  }

  return booking;
};

const getUserBookings = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;
  const total = await Booking.countDocuments({ user: userId });

  const bookings = await Booking.find({ user: userId })
    .populate({ path: 'event', populate: { path: 'venue', select: 'name address' } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return {
    bookings,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) },
  };
};

const verifyBooking = async (bookingRef) => {
  const booking = await Booking.findOne({ bookingRef })
    .populate({ path: 'event', populate: { path: 'venue', select: 'name address' } })
    .populate('user', 'name email');

  if (!booking) throw { statusCode: 404, message: 'Booking not found' };

  return {
    bookingRef: booking.bookingRef,
    status: booking.status,
    user: { name: booking.user.name, email: booking.user.email },
    event: {
      title: booking.event?.title,
      date: booking.event?.date,
      time: booking.event?.time,
      venue: booking.event?.venue?.name,
    },
    seats: booking.seats.map((s) => ({ seatNumber: s.seatNumber, category: s.category })),
    isValid: booking.status === 'confirmed',
  };
};

const cancelBooking = async (bookingId, userId, userRole, reason) => {
  const booking = await Booking.findById(bookingId).populate('event');

  if (!booking) throw { statusCode: 404, message: 'Booking not found' };
  if (booking.status !== 'confirmed') {
    throw { statusCode: 400, message: 'Only confirmed bookings can be cancelled' };
  }

  if (userRole === 'customer' && booking.user.toString() !== userId.toString()) {
    throw { statusCode: 403, message: 'Access denied' };
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancellationReason = reason || 'Customer requested cancellation';
  await booking.save();
  
  console.log(`\n[Booking] ❌ Booking Cancelled! Ref: ${booking.bookingRef} by User: ${userId}`);

  const seatIds = booking.seats.map((s) => s.seat);
  await releaseBookedSeats(seatIds, booking.event._id);

  const categories = [...new Set(booking.seats.map((s) => s.category))];

  for (const category of categories) {
    processWaitlistForCategory(booking.event._id, category).catch(console.error);
  }

  const user = await User.findById(userId).select('name email');
  if (user) {
    sendCancellationConfirmation({
      to: user.email,
      userName: user.name,
      bookingRef: booking.bookingRef,
      eventTitle: booking.event.title,
    }).catch(console.error);
  }

  return booking;
};

const getEventBookings = async (eventId, organizerId, userRole, { page = 1, limit = 20 } = {}) => {
  const event = await Event.findById(eventId);
  if (!event) throw { statusCode: 404, message: 'Event not found' };

  if (userRole !== 'admin' && event.organizer.toString() !== organizerId.toString()) {
    throw { statusCode: 403, message: 'Unauthorized' };
  }

  const skip = (page - 1) * limit;
  const query = { event: eventId };
  const total = await Booking.countDocuments(query);

  const bookings = await Booking.find(query)
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const revenue = await Booking.aggregate([
    { $match: { event: event._id, status: 'confirmed' } },
    { $group: { _id: null, total: { $sum: '$finalAmount' }, count: { $sum: 1 } } },
  ]);

  return {
    bookings,
    revenue: revenue[0] || { total: 0, count: 0 },
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) },
  };
};

export { createBooking,
  getBookingById,
  getUserBookings,
  verifyBooking,
  cancelBooking,
  getEventBookings, };
