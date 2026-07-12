import express from 'express';
const router = express.Router();
import * as ctrl from '../controllers/waitlist.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validateJoinWaitlist, validateMongoId } from '../middlewares/validate.middleware.js';

router.get('/claim/:token', protect, ctrl.claimOffer);

router.get('/my', protect, ctrl.getMyWaitlistEntries);

router.post('/join', protect, validateJoinWaitlist, ctrl.joinWaitlist);

router.delete('/:id', protect, validateMongoId('id'), ctrl.leaveWaitlist);

export default router;
