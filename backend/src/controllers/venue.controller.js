
import * as venueService from '../services/venue.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const createVenue = async (req, res, next) => {
  try {
    const venue = await venueService.createVenue(req.body, req.user._id);
    console.log(`\n[API Success] ️ Venue created successfully: "${venue.name}" by Admin ${req.user.email}`);
    return successResponse(res, { venue }, 'Venue created successfully', 201);
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

const getVenues = async (req, res, next) => {
  try {
    const result = await venueService.getVenues(req.query);
    return successResponse(res, result, 'Venues retrieved');
  } catch (error) {
    next(error);
  }
};

const getVenueById = async (req, res, next) => {
  try {
    const venue = await venueService.getVenueById(req.params.id);
    return successResponse(res, { venue }, 'Venue retrieved');
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

const updateVenue = async (req, res, next) => {
  try {
    const venue = await venueService.updateVenue(req.params.id, req.body);
    return successResponse(res, { venue }, 'Venue updated');
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

const deleteVenue = async (req, res, next) => {
  try {
    await venueService.deleteVenue(req.params.id);
    return successResponse(res, {}, 'Venue deactivated');
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

export { createVenue, getVenues, getVenueById, updateVenue, deleteVenue };
