import Overtime from '../models/Overtime.model.js';
import Attendance from '../models/Attendance.model.js';
import { getIO } from '../lib/socket.js';

/**
 * @desc    Submit overtime request
 * @route   POST /api/overtime
 * @access  Private
 */
export const requestOvertime = async (req, res) => {
  const { attendanceId, hoursRequested, reason } = req.body;

  // Verify attendance belongs to user
  const attendance = await Attendance.findOne({ _id: attendanceId, user: req.user._id });
  if (!attendance) {
    return res.status(404).json({ success: false, error: 'Attendance record not found' });
  }

  const overtime = await Overtime.create({
    user: req.user._id,
    attendance: attendanceId,
    hoursRequested,
    reason,
  });

  // Update attendance status
  attendance.overtimeRequestStatus = 'Pending';
  await attendance.save();

  // Notify admins
  const io = getIO();
  io.to('admin').emit('overtime:request', {
    user: req.user.name,
    hours: hoursRequested,
  });

  res.status(201).json({ success: true, data: overtime });
};

/**
 * @desc    Review overtime request (Manager/Admin)
 * @route   PATCH /api/overtime/:id/review
 * @access  Private/Manager,Admin
 */
export const reviewOvertime = async (req, res) => {
  const { status, reviewNote } = req.body;

  const overtime = await Overtime.findById(req.params.id).populate('attendance');
  if (!overtime) {
    return res.status(404).json({ success: false, error: 'Overtime request not found' });
  }

  overtime.status = status;
  overtime.reviewNote = reviewNote;
  overtime.reviewedBy = req.user._id;
  overtime.reviewedAt = new Date();

  await overtime.save();

  // Update linked attendance status
  const attendance = overtime.attendance;
  if (attendance) {
    attendance.overtimeRequestStatus = status;
    await attendance.save();
  }

  // Notify employee
  const io = getIO();
  io.to(`user:${overtime.user}`).emit('notification', {
    message: `Your overtime request for ${overtime.hoursRequested} hours has been ${status}.`,
  });

  res.json({ success: true, data: overtime });
};

/**
 * @desc    Get overtime requests
 * @route   GET /api/overtime
 * @access  Private
 */
export const getOvertimeRequests = async (req, res) => {
  let query = {};

  if (req.user.role === 'employee') {
    query.user = req.user._id;
  }

  const requests = await Overtime.find(query)
    .populate('user', 'name email')
    .populate('attendance')
    .sort('-createdAt');

  res.json({ success: true, count: requests.length, data: requests });
};
