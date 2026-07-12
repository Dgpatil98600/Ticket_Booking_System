
import cron from 'node-cron';
import Seat from '../models/Seat.js';
import { emitSeatUpdate } from '../config/socket.js';
import { processWaitlistForCategory } from '../services/waitlist.service.js';

const releaseExpiredHolds = async () => {
  try {
    const now = new Date();

    const expiredSeats = await Seat.find({
      status: 'held',
      holdExpiresAt: { $lte: now },
    });

    if (expiredSeats.length === 0) return;

    console.log(`⏱️  Releasing ${expiredSeats.length} expired seat hold(s)...`);

    const seatIds = expiredSeats.map((s) => s._id);

    await Seat.updateMany(
      { _id: { $in: seatIds }, status: 'held', holdExpiresAt: { $lte: now } },
      {
        status: 'available',
        heldBy: null,
        holdExpiresAt: null,
      }
    );

    const waitlistTriggers = new Map(); 

    for (const seat of expiredSeats) {
      emitSeatUpdate(seat.event.toString(), 'seat:released', {
        seatId: seat._id,
        row: seat.row,
        col: seat.col,
        seatNumber: seat.seatNumber,
        status: 'available',
      });

      const key = `${seat.event}:${seat.category}`;
      if (!waitlistTriggers.has(key)) {
        waitlistTriggers.set(key, { eventId: seat.event, category: seat.category });
      }
    }

    for (const { eventId, category } of waitlistTriggers.values()) {
      processWaitlistForCategory(eventId, category).catch((err) =>
        console.error('Waitlist processing error:', err.message)
      );
    }

    console.log(`✅ Released ${expiredSeats.length} seat hold(s)`);
  } catch (error) {
    console.error('❌ Seat hold release cron error:', error.message);
  }
};

const startSeatHoldReleaseCron = () => {
  cron.schedule('* * * * *', releaseExpiredHolds, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });

  console.log(' Seat hold release cron job started (runs every minute)');
};

export { startSeatHoldReleaseCron, releaseExpiredHolds };
