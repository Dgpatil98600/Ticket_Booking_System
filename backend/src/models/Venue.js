
import mongoose from 'mongoose';

const seatCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['premium', 'standard', 'economy'],
  },
  rows: {
    type: [String], 
    required: true,
  },
  color: {
    type: String,
    default: '#4CAF50',
  },
});

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    address: {
      street: String,
      city: { type: String, required: true },
      state: String,
      country: { type: String, default: 'India' },
      pincode: String,
    },
    totalRows: {
      type: Number,
      required: [true, 'Total rows is required'],
      min: [1, 'Must have at least 1 row'],
    },
    totalCols: {
      type: Number,
      required: [true, 'Total columns is required'],
      min: [1, 'Must have at least 1 column'],
    },
    totalCapacity: {
      type: Number,
    },
    categories: {
      type: [seatCategorySchema],
      validate: {
        validator: function (cats) {
          return cats && cats.length > 0;
        },
        message: 'At least one seat category is required',
      },
    },
    amenities: [String],
    imageUrl: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

venueSchema.pre('save', function (next) {
  this.totalCapacity = this.totalRows * this.totalCols;
  next();
});

export default mongoose.model('Venue', venueSchema);
