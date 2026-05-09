import Attendance from '../models/Attendance.model.js';
import Overtime from '../models/Overtime.model.js';
import User from '../models/User.model.js';

/**
 * @desc    Get dashboard stats
 * @route   GET /api/reports/stats
 * @access  Private
 */
export const getStats = async (req, res) => {
  const userId = req.user._id;
  const role = req.user.role;

  let attendanceQuery = {};
  let otQuery = {};

  if (role === 'employee') {
    attendanceQuery.user = userId;
    otQuery.user = userId;
  }

  // Aggregate stats
  const totalAttendance = await Attendance.countDocuments(attendanceQuery);
  const completedShifts = await Attendance.countDocuments({ ...attendanceQuery, shiftStatus: 'Completed' });
  const pendingValidation = await Attendance.countDocuments({ ...attendanceQuery, validationStatus: 'Pending' });

  const otStats = await Overtime.aggregate([
    { $match: otQuery },
    { $group: { _id: null, totalHours: { $sum: '$hoursRequested' }, count: { $sum: 1 } } }
  ]);

  const stats = {
    totalAttendance,
    completedShifts,
    pendingValidation,
    overtime: otStats.length > 0 ? otStats[0] : { totalHours: 0, count: 0 }
  };

  if (role === 'admin' || role === 'manager') {
    stats.totalEmployees = await User.countDocuments({ role: 'employee' });
  }

  res.json({ success: true, data: stats });
};

/**
 * @desc    Generate attendance report
 * @route   GET /api/reports/attendance
 * @access  Private
 */
export const getAttendanceReport = async (req, res) => {
  const { startDate, endDate, userId, department } = req.query;

  let query = {};

  // Role based data access
  if (req.user.role === 'employee') {
    query.user = req.user._id;
  } else {
    if (userId) query.user = userId;
  }

  if (startDate && endDate) {
    query.punchIn = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const records = await Attendance.find(query)
    .populate('user', 'name email department')
    .sort('-punchIn');

  res.json({ success: true, data: records });
};
