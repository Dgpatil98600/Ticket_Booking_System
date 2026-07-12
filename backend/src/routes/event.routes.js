import express from 'express';
const router = express.Router();
import * as ctrl from '../controllers/event.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validateEvent, validateMongoId } from '../middlewares/validate.middleware.js';

router.get('/', ctrl.getEvents);
router.get('/:id', validateMongoId('id'), ctrl.getEventById);

router.get('/organizer/my', protect, authorize('organizer', 'admin'), ctrl.getOrganizerEvents);

router.post('/', protect, authorize('organizer', 'admin'), validateEvent, ctrl.createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), validateMongoId('id'), ctrl.updateEvent);
router.delete('/:id', protect, authorize('organizer', 'admin'), validateMongoId('id'), ctrl.deleteEvent);
router.patch('/:id/status', protect, authorize('organizer', 'admin'), validateMongoId('id'), ctrl.updateEventStatus);

export default router;
