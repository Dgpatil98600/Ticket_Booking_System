
import Waitlist from '../models/Waitlist.js';
import Seat from '../models/Seat.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import { generateOfferToken, verifyOfferToken } from '../utils/tokenUtils.js';
import { sendWaitlistOffer } from '../utils/emailUtils.js';
import { holdSeat } from './seat.service.js';

const OFFER_TTL_MINUTES = parseInt(process.env.WAITLIST_OFFER_TTL_MINUTES || '15');

const joinWaitlist = async (userId, eventId, category) => {
  
  const existing = await Waitlist.findOne({
    event: eventId,
    category,
    user: userId,
    status: { $in: ['waiting', 'offered'] },
  });

  if (existing) {
    throw { statusCode: 409, message: 'You are already on the waitlist for this category' };
  }

  const maxPos = await Waitlist.findOne({ event: eventId, category })
    .sort({ position: -1 })
    .select('position');

  const position = (maxPos?.position || 0) + 1;

  const entry = await Waitlist.create({
    event: eventId,
    category,
    user: userId,
    position,
    status: 'waiting',
  });

  console.log(`\n[Waitlist]  User ${userId} joined waitlist for Event: ${eventId}, Category: ${category} at position ${position}`);

  return entry;
};

const getUserWaitlistEntries = async (userId) => {
  return Waitlist.find({ user: userId, status: { $in: ['waiting', 'offered'] } })
    .populate({ path: 'event', populate: { path: 'venue', select: 'name' } })
    .sort({ createdAt: -1 });
};

const leaveWaitlist = async (waitlistId, userId) => {
  const entry = await Waitlist.findOne({ _id: waitlistId, user: userId });
  if (!entry) throw { statusCode: 404, message: 'Waitlist entry not found' };
  if (!['waiting', 'offered'].includes(entry.status)) {
    throw { statusCode: 400, message: 'Cannot leave waitlist in current status' };
  }

  entry.status = 'cancelled';
  await entry.save();

  await reorderWaitlist(entry.event, entry.category, entry.position);

  return entry;
};

const processWaitlistForCategory = async (eventId, category) => {
  
  const nextEntry = await Waitlist.findOne({
    event: eventId,
    category,
    status: 'waiting',
  }).sort({ position: 1 });

  if (!nextEntry) return; 

  const availableSeat = await Seat.findOne({
    event: eventId,
    category,
    status: 'available',
  });

  if (!availableSeat) return; 

  const offerPayload = {
    waitlistId: nextEntry._id,
    userId: nextEntry.user,
    eventId,
    category,
    seatId: availableSeat._id,
    type: 'waitlist_offer',
  };
  const offerToken = generateOfferToken(offerPayload);
  const offerExpiresAt = new Date(Date.now() + OFFER_TTL_MINUTES * 60 * 1000);

  nextEntry.status = 'offered';
  nextEntry.offerToken = offerToken;
  nextEntry.offerExpiresAt = offerExpiresAt;
  nextEntry.offeredSeat = availableSeat._id;
  await nextEntry.save();

  const user = await User.findById(nextEntry.user).select('name email');
  const event = await Event.findById(eventId).populate('venue', 'name');

  if (user && event) {
    const offerLink = `${process.env.CLIENT_URL}/waitlist/claim/${offerToken}`;

    await sendWaitlistOffer({
      to: user.email,
      userName: user.name,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      venue: event.venue?.name || 'TBD',
      category,
      offerLink,
      expiresInMinutes: OFFER_TTL_MINUTES,
    });

    nextEntry.offerEmailSent = true;
    await nextEntry.save();
    console.log(`\n[Waitlist] ️ Seat offer sent to ${user.email} for Event: ${eventId} - ${event.title}, Category: ${category}`);
  }

  return nextEntry;
};

const claimOffer = async (offerToken) => {

  let decoded;
  try {
    decoded = verifyOfferToken(offerToken);
  } catch (err) {
    throw { statusCode: 400, message: 'Offer link has expired or is invalid' };
  }

  if (decoded.type !== 'waitlist_offer') {
    throw { statusCode: 400, message: 'Invalid offer token' };
  }

  const entry = await Waitlist.findOne({
    _id: decoded.waitlistId,
    offerToken,
    status: 'offered',
  });

  if (!entry) {
    throw { statusCode: 410, message: 'This offer has already been claimed or expired' };
  }

  if (entry.offerExpiresAt <= new Date()) {
    entry.status = 'expired';
    await entry.save();

    console.log(`\n[Waitlist]  Offer expired during claim for User ${entry.user}. Passing to next person in queue.`);
    processWaitlistForCategory(decoded.eventId, decoded.category).catch(console.error);
    throw { statusCode: 410, message: 'Offer has expired. The seat has been offered to the next person.' };
  }

  const heldSeat = await holdSeat(decoded.seatId, decoded.userId, decoded.eventId);

  if (!heldSeat) {
    
    const altSeat = await Seat.findOne({
      event: decoded.eventId,
      category: decoded.category,
      status: 'available',
    });

    if (!altSeat) {
      entry.status = 'expired';
      await entry.save();
      throw { statusCode: 409, message: 'No seats available in this category' };
    }

    const altHeld = await holdSeat(altSeat._id, decoded.userId, decoded.eventId);
    if (!altHeld) {
      entry.status = 'expired';
      await entry.save();
      throw { statusCode: 409, message: 'No seats available. Please rejoin the waitlist.' };
    }

    entry.offeredSeat = altSeat._id;
    await entry.save();

    return {
      entry,
      seat: altHeld,
      eventId: decoded.eventId,
      message: 'Seat held successfully! Complete your booking within 10 minutes.',
    };
  }

  entry.status = 'fulfilled';
  await entry.save();
  
  console.log(`\n[Waitlist] ✅ Offer claimed! Seat held for User ${decoded.userId}`);

  return {
    entry,
    seat: heldSeat,
    eventId: decoded.eventId,
    message: 'Seat held successfully! Complete your booking within 10 minutes.',
  };
};

const processExpiredOffers = async () => {
  const expiredOffers = await Waitlist.find({
    status: 'offered',
    offerExpiresAt: { $lte: new Date() },
  });

  for (const entry of expiredOffers) {
    entry.status = 'expired';
    await entry.save();

    await reorderWaitlist(entry.event, entry.category, entry.position);

    console.log(`\n[Waitlist]  Cron: Offer expired for User ${entry.user}. Processing queue for Event ${entry.event}...`);
    await processWaitlistForCategory(entry.event, entry.category);
  }

  return expiredOffers.length;
};

const reorderWaitlist = async (eventId, category, fromPosition) => {
  await Waitlist.updateMany(
    {
      event: eventId,
      category,
      status: { $in: ['waiting'] },
      position: { $gt: fromPosition },
    },
    { $inc: { position: -1 } }
  );
};

export { joinWaitlist,
  getUserWaitlistEntries,
  leaveWaitlist,
  processWaitlistForCategory,
  claimOffer,
  processExpiredOffers, };
