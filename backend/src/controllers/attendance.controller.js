import Attendance from '../models/Attendance.model.js';
import { getIO } from '../lib/socket.js';

/**
 * @desc    Punch In
 * @route   POST /api/attendance/punch-in
 * @access  Private
 */
export const punchIn = async (req, res) => {
  const { selfieImage, location } = req.body;

  // Check if already punched in today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const existingRecord = await Attendance.findOne({
    user: req.user._id,
    punchIn: { $gte: startOfDay, $lte: endOfDay }
  });

  if (existingRecord) {
    return res.status(400).json({ success: false, error: 'Already punched in today' });
  }

  const attendance = await Attendance.create({
    user: req.user._id,
    punchIn: new Date(),
    selfieImage,
    location,
  });

  // Real-time update to admins/managers
  const io = getIO();
  io.to('admin').emit('attendance:update', {
    type: 'PUNCH_IN',
    user: req.user.name,
    time: attendance.punchIn,
  });

  res.status(201).json({ success: true, data: attendance });
};

/**
 * @desc    Punch Out
 * @route   POST /api/attendance/punch-out
 * @access  Private
 */
export const punchOut = async (req, res) => {
  // Find the latest record for today that hasn't been punched out
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({
    user: req.user._id,
    punchIn: { $gte: startOfDay },
    punchOut: null
  });

  if (!attendance) {
    return res.status(404).json({ success: false, error: 'No active punch-in record found for today' });
  }

  attendance.punchOut = new Date();

  // Calculate working hours
  const diffMs = attendance.punchOut - attendance.punchIn;
  const hours = diffMs / (1000 * 60 * 60);
  attendance.totalWorkingHours = parseFloat(hours.toFixed(2));

  // Determine shift status
  attendance.shiftStatus = attendance.totalWorkingHours >= 8 ? 'Completed' : 'Incomplete';

  await attendance.save();

  // Real-time update
  const io = getIO();
  io.to('admin').emit('attendance:update', {
    type: 'PUNCH_OUT',
    user: req.user.name,
    hours: attendance.totalWorkingHours,
  });

  res.json({ success: true, data: attendance });
};

/**
 * @desc    Validate attendance (Manager/Admin)
 * @route   PATCH /api/attendance/:id/validate
 * @access  Private/Manager,Admin
 */
export const validateAttendance = async (req, res) => {
  const { validationStatus, validationRemarks } = req.body;

  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    return res.status(404).json({ success: false, error: 'Attendance record not found' });
  }

  attendance.validationStatus = validationStatus;
  attendance.validationRemarks = validationRemarks;
  attendance.validatedBy = req.user._id;
  attendance.validatedAt = new Date();

  await attendance.save();

  // Notify employee
  const io = getIO();
  io.to(`user:${attendance.user}`).emit('notification', {
    message: `Your attendance record for ${attendance.punchIn.toDateString()} has been marked as ${validationStatus}.`,
  });

  res.json({ success: true, data: attendance });
};

/**
 * @desc    Get all attendance records (with filters)
 * @route   GET /api/attendance
 * @access  Private
 */
export const getAttendance = async (req, res) => {
  let query = {};

  // If employee, only get their own
  if (req.user.role === 'employee') {
    query.user = req.user._id;
  }

  // Handle other filters (userId, date range etc) from req.query if needed
  if (req.query.userId && (req.user.role === 'admin' || req.user.role === 'manager')) {
    query.user = req.query.userId;
  }

  const records = await Attendance.find(query)
    .populate('user', 'name email department')
    .sort('-punchIn');

  res.json({ success: true, count: records.length, data: records });
};
