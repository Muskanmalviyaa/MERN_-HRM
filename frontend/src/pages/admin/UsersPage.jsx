import { Users, Shield, Mail, Calendar } from 'lucide-react';
import { useGetUsersQuery, useUpdateUserRoleMutation } from '../../store/apiSlice.js';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { data, isLoading } = useGetUsersQuery();
  const [updateRole] = useUpdateUserRoleMutation();
  const users = data?.data || [];

  const handleRoleChange = async (userId, role) => {
    try {
      await updateRole({ id: userId, role }).unwrap();
      toast.success('User role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': return 'badge-danger';
      case 'manager': return 'badge-warning';
      default: return 'badge-info';
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage system users, view details, and assign roles.</p>
      </div>

      <div className="card">
        <div className="flex items-center mb-6">
          <Users size={20} style={{ display: 'inline', marginRight: 8 }} />
          <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, margin: 0 }}>All Users</h2>
          <span className="badge badge-pending" style={{ marginLeft: 12 }}>{users.length} total</span>
        </div>

        {isLoading ? (
          <div className="loading-screen" style={{ minHeight: 200 }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Joined Date</th>
                  <th>Current Role</th>
                  <th>Change Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'var(--gradient-primary)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, color: 'white', flexShrink: 0,
                        }}>
                          {u.name?.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--clr-text-secondary)' }}>
                        <Mail size={14} /> {u.email}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--clr-text-secondary)' }}>
                        <Calendar size={14} /> {u.createdAt ? format(parseISO(u.createdAt), 'MMM dd, yyyy') : '—'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getRoleBadge(u.role)}`}>{u.role}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Shield size={14} className="text-muted" />
                        <select
                          className="form-input"
                          style={{ padding: '6px 32px 6px 12px', fontSize: 'var(--fs-xs)', height: 'auto', minWidth: 120 }}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        >
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </td>
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
