
import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true,
    },
    row: {
      type: String,
      required: true, 
    },
    col: {
      type: Number,
      required: true, 
    },
    seatNumber: {
      type: String, 
    },
    category: {
      type: String,
      enum: ['premium', 'standard', 'economy'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'held', 'booked'],
      default: 'available',
      index: true,
    },

    heldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    holdExpiresAt: {
      type: Date,
      default: null,
      index: true, 
    },

    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

seatSchema.index({ event: 1, row: 1, col: 1 }, { unique: true });
seatSchema.index({ event: 1, status: 1 });
seatSchema.index({ event: 1, category: 1, status: 1 });

seatSchema.pre('save', function (next) {
  if (!this.seatNumber) {
    this.seatNumber = `${this.row}${this.col}`;
  }
  next();
});

export default mongoose.model('Seat', seatSchema);
