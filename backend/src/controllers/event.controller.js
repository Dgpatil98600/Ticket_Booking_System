
import * as eventService from '../services/event.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.body, req.user._id);
    console.log(`\n[API Success]  Event created successfully: "${event.title}" by organizer ${req.user.email}`);
    return successResponse(res, { event }, 'Event created successfully', 201);
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

const getEvents = async (req, res, next) => {
  try {
    const result = await eventService.getEvents(req.query);
    return successResponse(res, result, 'Events retrieved');
  } catch (error) {
    next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    return successResponse(res, { event }, 'Event retrieved');
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(req.params.id, req.body, req.user._id, req.user.role);
    return successResponse(res, { event }, 'Event updated');
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    await eventService.deleteEvent(req.params.id, req.user._id, req.user.role);
    return successResponse(res, {}, 'Event deleted');
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

const updateEventStatus = async (req, res, next) => {
  try {
    const event = await eventService.updateEventStatus(req.params.id, req.body.status, req.user._id, req.user.role);
    return successResponse(res, { event }, 'Event status updated');
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

const getOrganizerEvents = async (req, res, next) => {
  try {
    const result = await eventService.getEventsByOrganizer(req.user._id, req.query);
    return successResponse(res, result, 'Organizer events retrieved');
  } catch (error) {
    next(error);
  }
};

export { createEvent, getEvents, getEventById, updateEvent, deleteEvent, updateEventStatus, getOrganizerEvents };
