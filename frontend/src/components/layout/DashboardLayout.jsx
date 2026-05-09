import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Clock, FileText, Timer, Shield,
  Users, LogOut, Menu, X, ChevronRight, Bell
} from 'lucide-react';
import { logout, selectCurrentUser } from '../../store/authSlice.js';
import './DashboardLayout.css';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['employee', 'manager', 'admin'] },
  { to: '/attendance', icon: Clock,           label: 'Attendance',  roles: ['employee', 'manager', 'admin'] },
  { to: '/overtime',   icon: Timer,           label: 'Overtime',    roles: ['employee', 'manager', 'admin'] },
  { to: '/reports',    icon: FileText,        label: 'Reports',     roles: ['employee', 'manager', 'admin'] },
  { to: '/validation', icon: Shield,          label: 'Validation',  roles: ['manager', 'admin'] },
  { to: '/users',      icon: Users,           label: 'Users',       roles: ['admin'] },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const filteredNav = navItems.filter((item) => item.roles.includes(user?.role));

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const roleBadgeClass = {
    admin: 'badge-danger',
    manager: 'badge-warning',
    employee: 'badge-info',
  }[user?.role] || 'badge-pending';

  return (
    <div className="dashboard-shell">
      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Clock size={22} />
          </div>
          <span className="sidebar-brand-name">AttendEase</span>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* User Info */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className={`badge ${roleBadgeClass}`}>{user?.role}</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="sidebar-nav">
          {filteredNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              <ChevronRight size={14} className="sidebar-link-arrow" />
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main Area ─────────────────────────────────────── */}
      <div className="dashboard-main">
        {/* Topbar */}
        <header className="topbar">
          <button className="topbar-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-title">AttendEase</div>
          <div className="topbar-actions">
            <button className="btn btn-ghost topbar-notif">
              <Bell size={18} />
            </button>
            <div className="topbar-user">
              <div className="topbar-avatar">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
