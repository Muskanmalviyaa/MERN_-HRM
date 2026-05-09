import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Clock, Mail, Lock, User, Shield, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useSignupMutation } from '../../store/apiSlice.js';
import { setCredentials } from '../../store/authSlice.js';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [showPwd, setShowPwd] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [signup, { isLoading }] = useSignupMutation();

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      const res = await signup(form).unwrap();
      dispatch(setCredentials(res.data));
      toast.success(`Welcome, ${res.data.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.data?.error || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo"><Clock size={28} /></div>
          <h1 className="auth-brand-name">AttendEase</h1>
        </div>

        <p className="auth-subtitle">Create your account</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-icon-wrap">
              <User size={16} className="input-icon" />
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Jane Doe"
                className="form-input input-with-icon"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input
                id="signup-email"
                name="email"
                type="email"
                placeholder="you@company.com"
                className="form-input input-with-icon"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="signup-password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                className="form-input input-with-icon"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPwd((v) => !v)}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <div className="input-icon-wrap">
              <Shield size={16} className="input-icon" />
              <select
                id="role"
                name="role"
                className="form-input input-with-icon"
                value={form.role}
                onChange={handleChange}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="spinner" style={{ width: 20, height: 20 }} />
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
