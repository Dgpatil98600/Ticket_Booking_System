import express from 'express';
const router = express.Router();
import * as ctrl from '../controllers/seat.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validateMultiSeatHold } from '../middlewares/validate.middleware.js';

router.get('/event/:eventId', ctrl.getEventSeats);

router.post('/hold', protect, validateMultiSeatHold, ctrl.holdSeats);

router.delete('/hold', protect, ctrl.releaseSeats);

export default router;
