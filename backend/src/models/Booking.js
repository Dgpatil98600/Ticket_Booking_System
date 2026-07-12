
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const bookingSeatSchema = new mongoose.Schema({
  seat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seat',
    required: true,
  },
  seatNumber: String,
  row: String,
  col: Number,
  category: String,
  price: Number,
});

const bookingSchema = new mongoose.Schema(
  {
    bookingRef: {
      type: String,
      unique: true,
      default: () => `TKT-${uuidv4().split('-')[0].toUpperCase()}`,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    seats: [bookingSeatSchema],

    totalAmount: {
      type: Number,
      required: true,
    },
    convenienceFee: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'pending'],
      default: 'confirmed',
      index: true,
    },

    qrCode: {
      type: String, 
    },
    qrUrl: {
      type: String, 
    },

    paymentId: String,
    paymentMethod: {
      type: String,
      default: 'online',
    },

    cancelledAt: Date,
    cancellationReason: String,

    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bookingSchema.index({ bookingRef: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Booking', bookingSchema);
