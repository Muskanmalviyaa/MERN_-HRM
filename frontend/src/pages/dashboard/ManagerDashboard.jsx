import { Users, Clock, Timer, Shield, CheckCircle } from 'lucide-react';
import { useGetStatsQuery, useGetAttendanceQuery, useGetOvertimeRequestsQuery } from '../../store/apiSlice.js';
import { format, parseISO } from 'date-fns';

export default function ManagerDashboard() {
  const { data: statsData, isLoading: statsLoading } = useGetStatsQuery();
  const { data: attendanceData } = useGetAttendanceQuery({});
  const { data: otData } = useGetOvertimeRequestsQuery();

  const stats = statsData?.data;
  const records = attendanceData?.data || [];
  const pendingOT = (otData?.data || []).filter((o) => o.status === 'Pending');

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Manager Dashboard</h1>
        <p>Monitor your team's attendance and pending requests.</p>
      </div>

      <div className="stats-grid mb-6">
        {[
          { icon: <Clock size={32} />, label: 'Team Records Today', value: stats?.totalAttendance ?? 0 },
          { icon: <CheckCircle size={32} />, label: 'Completed Shifts', value: stats?.completedShifts ?? 0 },
          { icon: <Timer size={32} />, label: 'Pending OT Requests', value: pendingOT.length },
          { icon: <Shield size={32} />, label: 'Pending Validation', value: stats?.pendingValidation ?? 0 },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{statsLoading ? '—' : s.value}</div>
            <div className="stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Team Attendance Table */}
      <div className="card mb-6">
        <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
          <Users size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Team Attendance
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Hours</th>
                <th>Shift</th>
                <th>Validation</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 10).map((rec) => (
                <tr key={rec._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--gradient-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 'var(--fs-xs)', color: 'white', flexShrink: 0,
                      }}>
                        {rec.user?.name?.charAt(0)}
                      </div>
                      <span>{rec.user?.name || '—'}</span>
                    </div>
                  </td>
                  <td>{format(parseISO(rec.punchIn), 'MMM dd, yyyy')}</td>
                  <td>{format(parseISO(rec.punchIn), 'hh:mm a')}</td>
                  <td>{rec.punchOut ? format(parseISO(rec.punchOut), 'hh:mm a') : <span className="badge badge-warning">Active</span>}</td>
                  <td>{rec.totalWorkingHours != null ? `${rec.totalWorkingHours}h` : '—'}</td>
                  <td>
                    <span className={`badge ${rec.shiftStatus === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                      {rec.shiftStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${rec.validationStatus === 'Valid' ? 'badge-success' : rec.validationStatus === 'Invalid' ? 'badge-danger' : 'badge-pending'}`}>
                      {rec.validationStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--clr-text-muted)', padding: '2rem' }}>No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
