import express from 'express';
import {
  punchIn,
  punchOut,
  validateAttendance,
  getAttendance
} from '../controllers/attendance.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/punch-in', punchIn);
router.post('/punch-out', punchOut);
router.get('/', getAttendance);

// Manager and Admin only
router.patch('/:id/validate', authorize('manager', 'admin'), validateAttendance);

export default router;
