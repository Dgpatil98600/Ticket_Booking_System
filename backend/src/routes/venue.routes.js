import express from 'express';
const router = express.Router();
import * as ctrl from '../controllers/venue.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validateVenue, validateMongoId } from '../middlewares/validate.middleware.js';

router.post('/', protect, authorize('admin'), validateVenue, ctrl.createVenue);
router.put('/:id', protect, authorize('admin'), validateMongoId('id'), ctrl.updateVenue);
router.delete('/:id', protect, authorize('admin'), validateMongoId('id'), ctrl.deleteVenue);

router.get('/', ctrl.getVenues);
router.get('/:id', validateMongoId('id'), ctrl.getVenueById);

export default router;
