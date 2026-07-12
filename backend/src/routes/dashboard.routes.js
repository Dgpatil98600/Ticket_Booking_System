import express from 'express';
const router = express.Router();
import * as ctrl from '../controllers/dashboard.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

router.get('/organizer', protect, authorize('organizer', 'admin'), ctrl.getOrganizerDashboard);

router.get('/admin', protect, authorize('admin'), ctrl.getAdminDashboard);

router.get('/admin/users', protect, authorize('admin'), ctrl.getAllUsers);
router.patch('/admin/users/:id/role', protect, authorize('admin'), ctrl.updateUserRole);
router.patch('/admin/users/:id/toggle', protect, authorize('admin'), ctrl.toggleUserStatus);

export default router;
