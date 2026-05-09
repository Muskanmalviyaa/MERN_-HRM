import express from 'express';
import { getStats, getAttendanceReport } from '../controllers/reports.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getStats);
router.get('/attendance', getAttendanceReport);

export default router;
