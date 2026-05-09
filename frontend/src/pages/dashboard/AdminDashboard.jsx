import { useState } from 'react';
import { Users, Clock, CheckCircle, Timer, Shield, UserCog } from 'lucide-react';
import { useGetStatsQuery, useGetAttendanceQuery, useGetUsersQuery, useUpdateUserRoleMutation } from '../../store/apiSlice.js';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { data: statsData, isLoading: statsLoading } = useGetStatsQuery();
  const { data: usersData } = useGetUsersQuery();
  const { data: attendanceData } = useGetAttendanceQuery({});
  const [updateRole] = useUpdateUserRoleMutation();

  const stats = statsData?.data;
  const users = usersData?.data || [];
  const records = attendanceData?.data || [];

  const handleRoleChange = async (userId, role) => {
    try {
      await updateRole({ id: userId, role }).unwrap();
      toast.success('Role updated successfully');
    } catch {
      toast.error('Failed to update role');
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>System-wide attendance overview and user management.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-6">
        {[
          { icon: <Users size={32} />, label: 'Total Employees', value: stats?.totalEmployees ?? 0 },
          { icon: <Clock size={32} />, label: 'Total Records', value: stats?.totalAttendance ?? 0 },
          { icon: <CheckCircle size={32} />, label: 'Completed Shifts', value: stats?.completedShifts ?? 0 },
          { icon: <Shield size={32} />, label: 'Pending Validation', value: stats?.pendingValidation ?? 0 },
          { icon: <Timer size={32} />, label: 'OT Requests', value: stats?.overtime?.count ?? 0 },
          { icon: <UserCog size={32} />, label: 'OT Hours Requested', value: stats?.overtime?.totalHours?.toFixed(1) ?? 0 },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{statsLoading ? '—' : s.value}</div>
            <div className="stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* User Management */}
        <div className="card">
          <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            <Users size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            User Management
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {users.slice(0, 6).map((u) => (
              <div key={u._id} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-3)', background: 'var(--clr-bg)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--gradient-primary)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: 'white', flexShrink: 0,
                }}>
                  {u.name?.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{u.email}</div>
                </div>
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                  className="form-input"
                  style={{ width: 110, padding: '4px 8px', fontSize: 'var(--fs-xs)' }}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="card">
          <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            <Clock size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            Latest Punches
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {records.slice(0, 6).map((rec) => (
              <div key={rec._id} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-3)', background: 'var(--clr-bg)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)',
              }}>
                {rec.selfieImage ? (
                  <img src={rec.selfieImage} alt="selfie" className="selfie-thumb" />
                ) : (
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'var(--clr-bg-elevated)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Clock size={16} style={{ color: 'var(--clr-text-muted)' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{rec.user?.name || 'Unknown'}</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>
                    {format(parseISO(rec.punchIn), 'MMM dd · hh:mm a')}
                  </div>
                </div>
                <span className={`badge ${rec.shiftStatus === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                  {rec.shiftStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
