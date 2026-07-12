
import Event from '../models/Event.js';
import Venue from '../models/Venue.js';
import Seat from '../models/Seat.js';

const createEvent = async (eventData, organizerId) => {
  const venue = await Venue.findById(eventData.venue);
  if (!venue) {
    throw { statusCode: 404, message: 'Venue not found' };
  }

  if (!venue.isActive) {
    throw { statusCode: 400, message: 'Venue is not active' };
  }

  const rowCategoryMap = {};
  venue.categories.forEach((cat) => {
    cat.rows.forEach((row) => {
      rowCategoryMap[row.toUpperCase()] = cat.name;
    });
  });

  const rowLabels = generateRowLabels(venue.totalRows);

  const event = await Event.create({
    ...eventData,
    organizer: organizerId,
    totalSeats: venue.totalCapacity,
    availableSeats: venue.totalCapacity,
  });

  const seatDocs = [];
  for (let r = 0; r < venue.totalRows; r++) {
    const rowLabel = rowLabels[r];
    const category = rowCategoryMap[rowLabel] || 'economy';
    const price = eventData.pricing?.[category] || 0;

    for (let c = 1; c <= venue.totalCols; c++) {
      seatDocs.push({
        event: event._id,
        venue: venue._id,
        row: rowLabel,
        col: c,
        seatNumber: `${rowLabel}${c}`,
        category,
        price,
        status: 'available',
      });
    }
  }

  await Seat.insertMany(seatDocs, { ordered: false });

  return event.populate(['venue', 'organizer']);
};

const generateRowLabels = (count) => {
  const labels = [];
  for (let i = 0; i < count; i++) {
    let label = '';
    let n = i;
    do {
      label = String.fromCharCode(65 + (n % 26)) + label;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    labels.push(label);
  }
  return labels;
};

/**
 * Get events with filtering and pagination
 */
const getEvents = async ({ page = 1, limit = 12, type, status, search, date, city } = {}) => {
  const query = {};

  if (type) query.type = type;
  if (status) query.status = status;
  else query.status = 'published'; 

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query.date = { $gte: startOfDay, $lte: endOfDay };
  } else {
    
    query.date = { $gte: new Date() };
  }

  const skip = (page - 1) * limit;
  const total = await Event.countDocuments(query);

  let eventsQuery = Event.find(query)
    .populate('venue', 'name address')
    .populate('organizer', 'name')
    .sort({ date: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  let events = await eventsQuery;

  if (city) {
    events = events.filter(
      (e) => e.venue?.address?.city?.toLowerCase().includes(city.toLowerCase())
    );
  }

  return {
    events,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit),
    },
  };
};

const getEventById = async (id) => {
  const event = await Event.findById(id)
    .populate('venue')
    .populate('organizer', 'name email');

  if (!event) {
    throw { statusCode: 404, message: 'Event not found' };
  }
  return event;
};

const updateEvent = async (id, updateData, userId, userRole) => {
  const event = await Event.findById(id);
  if (!event) throw { statusCode: 404, message: 'Event not found' };

  if (userRole !== 'admin' && event.organizer.toString() !== userId.toString()) {
    throw { statusCode: 403, message: 'You are not authorized to update this event' };
  }

  if (updateData.pricing) {
    for (const [category, price] of Object.entries(updateData.pricing)) {
      await Seat.updateMany(
        { event: id, category, status: 'available' },
        { price }
      );
    }
  }

  const updated = await Event.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate(['venue', 'organizer']);

  return updated;
};

const deleteEvent = async (id, userId, userRole) => {
  const event = await Event.findById(id);
  if (!event) throw { statusCode: 404, message: 'Event not found' };

  if (userRole !== 'admin' && event.organizer.toString() !== userId.toString()) {
    throw { statusCode: 403, message: 'Unauthorized' };
  }

  await Seat.deleteMany({ event: id });
  await Event.findByIdAndDelete(id);
};

const updateEventStatus = async (id, status, userId, userRole) => {
  const event = await Event.findById(id);
  if (!event) throw { statusCode: 404, message: 'Event not found' };

  if (userRole !== 'admin' && event.organizer.toString() !== userId.toString()) {
    throw { statusCode: 403, message: 'Unauthorized' };
  }

  event.status = status;
  await event.save();
  return event;
};

const getEventsByOrganizer = async (organizerId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;
  const query = { organizer: organizerId };

  const total = await Event.countDocuments(query);
  const events = await Event.find(query)
    .populate('venue', 'name address')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return {
    events,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) },
  };
};

export { createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  getEventsByOrganizer, };
