
import mongoose from 'mongoose';

const pricingSchema = new mongoose.Schema({
  premium: { type: Number, default: 0 },
  standard: { type: Number, default: 0 },
  economy: { type: Number, default: 0 },
});

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      enum: ['movie', 'concert', 'sports', 'theater', 'other'],
      required: [true, 'Event type is required'],
    },
    genre: [String],
    language: String,
    duration: Number, 
    imageUrl: String,
    bannerUrl: String,

    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: [true, 'Venue is required'],
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
    },

    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    time: {
      type: String, 
      required: [true, 'Event time is required'],
    },
    doorsOpenTime: String,

    pricing: {
      type: pricingSchema,
      required: [true, 'Pricing is required'],
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed'],
      default: 'draft',
    },

    totalSeats: {
      type: Number,
      default: 0,
    },
    availableSeats: {
      type: Number,
      default: 0,
    },
    bookedSeats: {
      type: Number,
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ venue: 1 });
eventSchema.index({ organizer: 1 });

export default mongoose.model('Event', eventSchema);
