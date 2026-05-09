import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from './store/authSlice.js';

// Layout
import DashboardLayout from './components/layout/DashboardLayout.jsx';

// Auth Pages
import LoginPage from './pages/auth/LoginPage.jsx';
import SignupPage from './pages/auth/SignupPage.jsx';

// Dashboard Pages
import EmployeeDashboard from './pages/dashboard/EmployeeDashboard.jsx';
import ManagerDashboard from './pages/dashboard/ManagerDashboard.jsx';
import AdminDashboard from './pages/dashboard/AdminDashboard.jsx';

// Feature Pages
import AttendancePage from './pages/attendance/AttendancePage.jsx';
import ValidationPage from './pages/attendance/ValidationPage.jsx';
import OvertimePage from './pages/overtime/OvertimePage.jsx';
import ReportsPage from './pages/reports/ReportsPage.jsx';
import UsersPage from './pages/admin/UsersPage.jsx';

// Guards
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import RoleRoute from './components/auth/RoleRoute.jsx';

export default function App() {
  const user = useSelector(selectCurrentUser);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/signup"
        element={!user ? <SignupPage /> : <Navigate to="/dashboard" replace />}
      />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Role-aware dashboard root */}
          <Route path="/dashboard" element={<RoleDashboard />} />

          {/* Attendance — all roles */}
          <Route path="/attendance" element={<AttendancePage />} />

          {/* Reports — all roles (data filtered server-side) */}
          <Route path="/reports" element={<ReportsPage />} />

          {/* Overtime — all roles (UI adapts per role) */}
          <Route path="/overtime" element={<OvertimePage />} />

          {/* Validation — manager & admin only */}
          <Route element={<RoleRoute roles={['manager', 'admin']} />}>
            <Route path="/validation" element={<ValidationPage />} />
            <Route path="/manager" element={<ManagerDashboard />} />
          </Route>

          {/* Admin only */}
          <Route element={<RoleRoute roles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

// Renders the right dashboard based on role
function RoleDashboard() {
  const user = useSelector(selectCurrentUser);
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'manager') return <ManagerDashboard />;
  return <EmployeeDashboard />;
}
