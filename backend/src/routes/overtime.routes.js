import express from 'express';
import {
  requestOvertime,
  reviewOvertime,
  getOvertimeRequests
} from '../controllers/overtime.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', requestOvertime);
router.get('/', getOvertimeRequests);

// Manager and Admin only
router.patch('/:id/review', authorize('manager', 'admin'), reviewOvertime);

export default router;
