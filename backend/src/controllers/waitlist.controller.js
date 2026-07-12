
import * as waitlistService from '../services/waitlist.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const joinWaitlist = async (req, res, next) => {
  try {
    const { eventId, category } = req.body;
    const entry = await waitlistService.joinWaitlist(req.user._id, eventId, category);
    return successResponse(res, { entry }, `Added to waitlist at position ${entry.position}`, 201);
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

const getMyWaitlistEntries = async (req, res, next) => {
  try {
    const entries = await waitlistService.getUserWaitlistEntries(req.user._id);
    return successResponse(res, { entries }, 'Waitlist entries retrieved');
  } catch (error) {
    next(error);
  }
};

const leaveWaitlist = async (req, res, next) => {
  try {
    const entry = await waitlistService.leaveWaitlist(req.params.id, req.user._id);
    return successResponse(res, { entry }, 'Removed from waitlist');
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

const claimOffer = async (req, res, next) => {
  try {
    const result = await waitlistService.claimOffer(req.params.token);
    return successResponse(res, result, result.message);
  } catch (error) {
    if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
    next(error);
  }
};

export { joinWaitlist, getMyWaitlistEntries, leaveWaitlist, claimOffer };
