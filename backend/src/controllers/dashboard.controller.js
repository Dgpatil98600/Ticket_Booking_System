
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Venue from '../models/Venue.js';
import Waitlist from '../models/Waitlist.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const getOrganizerDashboard = async (req, res, next) => {
  try {
    const organizerId = req.user._id;

    const events = await Event.find({ organizer: organizerId }).populate('venue', 'name');

    const eventIds = events.map((e) => e._id);

    const revenueData = await Booking.aggregate([
      { $match: { event: { $in: eventIds }, status: 'confirmed' } },
      {
        $group: {
          _id: '$event',
          revenue: { $sum: '$finalAmount' },
          bookingsCount: { $sum: 1 },
          seatsBooked: { $sum: { $size: '$seats' } },
        },
      },
    ]);

    const revenueMap = {};
    revenueData.forEach((r) => {
      revenueMap[r._id.toString()] = r;
    });

    const totalRevenue = revenueData.reduce((sum, r) => sum + r.revenue, 0);
    const totalBookings = revenueData.reduce((sum, r) => sum + r.bookingsCount, 0);

    const recentBookings = await Booking.find({ event: { $in: eventIds } })
      .populate('user', 'name email')
      .populate('event', 'title date')
      .sort({ createdAt: -1 })
      .limit(10);

    const eventsWithStats = events.map((e) => {
      const stats = revenueMap[e._id.toString()] || { revenue: 0, bookingsCount: 0 };
      const occupancy = e.totalSeats > 0 ? ((e.bookedSeats / e.totalSeats) * 100).toFixed(1) : 0;
      return {
        _id: e._id,
        title: e.title,
        date: e.date,
        time: e.time,
        venue: e.venue,
        status: e.status,
        totalSeats: e.totalSeats,
        availableSeats: e.availableSeats,
        bookedSeats: e.bookedSeats,
        occupancy: parseFloat(occupancy),
        revenue: stats.revenue,
        bookingsCount: stats.bookingsCount,
      };
    });

    return successResponse(res, {
      summary: {
        totalEvents: events.length,
        publishedEvents: events.filter((e) => e.status === 'published').length,
        totalRevenue,
        totalBookings,
      },
      events: eventsWithStats,
      recentBookings,
    }, 'Organizer dashboard data retrieved');
  } catch (error) {
    next(error);
  }
};

const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      usersByRole,
      totalEvents,
      totalVenues,
      totalBookings,
      revenueData,
      recentUsers,
      recentBookings,
    ] = await Promise.all([
      User.countDocuments(),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Event.countDocuments(),
      Venue.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } },
      ]),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
      Booking.find({ status: 'confirmed' })
        .populate('user', 'name email')
        .populate('event', 'title')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Booking.aggregate([
      { $match: { status: 'confirmed', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$finalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const eventRevenueData = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: '$event',
          revenue: { $sum: '$finalAmount' },
          bookingsCount: { $sum: 1 },
          seatsBooked: { $sum: { $size: '$seats' } },
        },
      },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'eventDetails'
        }
      },
      { $unwind: '$eventDetails' },
      {
        $project: {
          _id: 1,
          title: '$eventDetails.title',
          date: '$eventDetails.date',
          revenue: 1,
          bookingsCount: 1,
          seatsBooked: 1,
          totalSeats: '$eventDetails.totalSeats',
          availableSeats: '$eventDetails.availableSeats',
          organizer: '$eventDetails.organizer'
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    return successResponse(res, {
      summary: {
        totalUsers,
        totalEvents,
        totalVenues,
        totalBookings,
        totalRevenue: revenueData[0]?.total || 0,
      },
      usersByRole: usersByRole.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {}),
      monthlyRevenue,
      eventEarnings: eventRevenueData,
      recentUsers,
      recentBookings,
    }, 'Admin dashboard data retrieved');
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return successResponse(res, {
      users,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) },
    }, 'Users retrieved');
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, { user }, 'User role updated');
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);
    user.isActive = !user.isActive;
    await user.save();
    return successResponse(res, { user }, `User ${user.isActive ? 'activated' : 'deactivated'}`);
  } catch (error) {
    next(error);
  }
};

export { getOrganizerDashboard,
  getAdminDashboard,
  getAllUsers,
  updateUserRole,
  toggleUserStatus, };
