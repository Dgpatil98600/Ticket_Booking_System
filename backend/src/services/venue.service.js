
import Venue from '../models/Venue.js';

const createVenue = async (venueData, adminId) => {
  const venue = await Venue.create({
    ...venueData,
    createdBy: adminId,
  });
  return venue;
};

const getVenues = async ({ page = 1, limit = 10, search, isActive } = {}) => {
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'address.city': { $regex: search, $options: 'i' } },
    ];
  }
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const skip = (page - 1) * limit;
  const total = await Venue.countDocuments(query);
  const venues = await Venue.find(query)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return {
    venues,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit),
    },
  };
};

const getVenueById = async (id) => {
  const venue = await Venue.findById(id).populate('createdBy', 'name email');
  if (!venue) {
    throw { statusCode: 404, message: 'Venue not found' };
  }
  return venue;
};

const updateVenue = async (id, updateData) => {
  const venue = await Venue.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!venue) {
    throw { statusCode: 404, message: 'Venue not found' };
  }
  return venue;
};

const deleteVenue = async (id) => {
  const venue = await Venue.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  if (!venue) {
    throw { statusCode: 404, message: 'Venue not found' };
  }
  return venue;
};

export { createVenue, getVenues, getVenueById, updateVenue, deleteVenue };
