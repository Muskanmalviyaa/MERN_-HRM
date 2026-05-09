import { useSelector } from 'react-redux';
import { Clock, CheckCircle, AlertCircle, Timer, TrendingUp } from 'lucide-react';
import { useGetStatsQuery, useGetAttendanceQuery } from '../../store/apiSlice.js';
import { selectCurrentUser } from '../../store/authSlice.js';
import { format, parseISO } from 'date-fns';

export default function EmployeeDashboard() {
  const user = useSelector(selectCurrentUser);
  const { data: statsData, isLoading: statsLoading } = useGetStatsQuery();
  const { data: attendanceData, isLoading: attLoading } = useGetAttendanceQuery({});

  const stats = statsData?.data;
  const records = attendanceData?.data?.slice(0, 5) || [];

  const shiftBadge = (status) => ({
    Completed: 'badge-success',
    Incomplete: 'badge-warning',
  }[status] || 'badge-pending');

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
        <p>Here's your attendance overview for today.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-6">
        <StatCard
          icon={<Clock size={32} />}
          label="Total Days Logged"
          value={statsLoading ? '—' : stats?.totalAttendance ?? 0}
          color="#6366f1"
        />
        <StatCard
          icon={<CheckCircle size={32} />}
          label="Completed Shifts"
          value={statsLoading ? '—' : stats?.completedShifts ?? 0}
          color="#22c55e"
        />
        <StatCard
          icon={<AlertCircle size={32} />}
          label="Pending Validation"
          value={statsLoading ? '—' : stats?.pendingValidation ?? 0}
          color="#f59e0b"
        />
        <StatCard
          icon={<Timer size={32} />}
          label="OT Requests"
          value={statsLoading ? '—' : stats?.overtime?.count ?? 0}
          color="#06b6d4"
        />
      </div>

      {/* Recent Attendance */}
      <div className="card animate-in">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>
            <TrendingUp size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            Recent Attendance
          </h2>
        </div>

        {attLoading ? (
          <div className="loading-screen" style={{ minHeight: 200 }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <Clock size={48} />
            <p>No attendance records yet. Start by punching in!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Hours</th>
                  <th>Shift</th>
                  <th>Validated</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec._id}>
                    <td>{format(parseISO(rec.punchIn), 'MMM dd, yyyy')}</td>
                    <td>{format(parseISO(rec.punchIn), 'hh:mm a')}</td>
                    <td>{rec.punchOut ? format(parseISO(rec.punchOut), 'hh:mm a') : <span className="badge badge-warning">Active</span>}</td>
                    <td>{rec.totalWorkingHours != null ? `${rec.totalWorkingHours}h` : '—'}</td>
                    <td><span className={`badge ${shiftBadge(rec.shiftStatus)}`}>{rec.shiftStatus}</span></td>
                    <td><span className={`badge ${valBadge(rec.validationStatus)}`}>{rec.validationStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-icon" style={{ color }}>{icon}</div>
    </div>
  );
}

function valBadge(status) {
  return { Valid: 'badge-success', Invalid: 'badge-danger', Pending: 'badge-pending' }[status] || 'badge-pending';
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}
