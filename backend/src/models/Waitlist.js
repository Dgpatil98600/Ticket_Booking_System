
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const waitlistSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['premium', 'standard', 'economy'],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    position: {
      type: Number,
      required: true, 
    },
    status: {
      type: String,
      enum: ['waiting', 'offered', 'expired', 'fulfilled', 'cancelled'],
      default: 'waiting',
      index: true,
    },

    offerToken: {
      type: String,
      default: null,
      index: true,
    },
    offerExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    offeredSeat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seat',
      default: null,
    },
    offerEmailSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

waitlistSchema.index({ event: 1, category: 1, position: 1 });
waitlistSchema.index({ event: 1, category: 1, status: 1, position: 1 });

waitlistSchema.index(
  { event: 1, category: 1, user: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['waiting', 'offered'] } },
  }
);

export default mongoose.model('Waitlist', waitlistSchema);
