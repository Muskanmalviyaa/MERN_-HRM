import express from 'express';
import { getMe, getUsers, updateUserRole } from '../controllers/user.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/me', getMe);
router.get('/', authorize('admin'), getUsers);
router.patch('/:id/role', authorize('admin'), updateUserRole);

export default router;
