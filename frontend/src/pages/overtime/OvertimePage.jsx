import { useState } from 'react';
import { Timer, Plus, CheckCircle, XCircle, MessageSquare, X } from 'lucide-react';
import {
  useGetOvertimeRequestsQuery,
  useGetAttendanceQuery,
  useRequestOvertimeMutation,
  useReviewOvertimeMutation,
} from '../../store/apiSlice.js';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/authSlice.js';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function OvertimePage() {
  const user = useSelector(selectCurrentUser);
  const { data: otData, isLoading, refetch } = useGetOvertimeRequestsQuery();
  const { data: attData } = useGetAttendanceQuery({});
  const [requestOvertime] = useRequestOvertimeMutation();
  const [reviewOvertime] = useReviewOvertimeMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [form, setForm] = useState({ attendanceId: '', hoursRequested: '', reason: '' });
  const [reviewNote, setReviewNote] = useState('');

  const requests = otData?.data || [];
  const myAttendance = (attData?.data || []).filter((r) => r.punchOut);

  const badgeClass = { Pending: 'badge-pending', Approved: 'badge-success', Rejected: 'badge-danger' };

  // ── Submit OT request ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.attendanceId || !form.hoursRequested || !form.reason) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      await requestOvertime({
        attendanceId: form.attendanceId,
        hoursRequested: parseFloat(form.hoursRequested),
        reason: form.reason,
      }).unwrap();
      toast.success('Overtime request submitted!');
      setModalOpen(false);
      setForm({ attendanceId: '', hoursRequested: '', reason: '' });
      refetch();
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to submit request');
    }
  };

  // ── Review OT ────────────────────────────────────────────
  const handleReview = async (status, targetId = null) => {
    const id = targetId || reviewModal?._id;
    if (!id) return;
    
    try {
      await reviewOvertime({ id, status, reviewNote }).unwrap();
      toast.success(`Request ${status}`);
      setReviewModal(null);
      setReviewNote('');
      refetch();
    } catch {
      toast.error('Review action failed');
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Overtime Requests</h1>
          <p>
            {user?.role === 'employee'
              ? 'Submit and track your overtime requests.'
              : 'Review and approve team overtime requests.'}
          </p>
        </div>
        {user?.role === 'employee' && (
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Request OT
          </button>
        )}
      </div>

      {/* Requests Table */}
      <div className="card">
        {isLoading ? (
          <div className="loading-screen" style={{ minHeight: 200 }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <Timer size={40} />
            <p>No overtime requests found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Hours Req.</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Review Note</th>
                  {(user?.role === 'manager' || user?.role === 'admin') && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map((ot) => (
                  <tr key={ot._id}>
                    <td style={{ fontWeight: 600 }}>{ot.user?.name || '—'}</td>
                    <td>{format(parseISO(ot.createdAt), 'MMM dd, yyyy')}</td>
                    <td style={{ fontWeight: 700, color: 'var(--clr-primary-light)' }}>{ot.hoursRequested}h</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ot.reason}
                    </td>
                    <td><span className={`badge ${badgeClass[ot.status]}`}>{ot.status}</span></td>
                    <td style={{ color: 'var(--clr-text-muted)', fontSize: 'var(--fs-xs)' }}>{ot.reviewNote || '—'}</td>
                    {(user?.role === 'manager' || user?.role === 'admin') && (
                      <td>
                        {ot.status === 'Pending' ? (
                          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <button 
                              className="btn btn-success btn-xs" 
                              onClick={() => handleReview('Approved', ot._id)}
                              title="Quick Approve"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button 
                              className="btn btn-danger btn-xs" 
                              onClick={() => handleReview('Rejected', ot._id)}
                              title="Quick Reject"
                            >
                              <XCircle size={14} />
                            </button>
                            <button 
                              className="btn btn-outline btn-xs" 
                              onClick={() => { setReviewModal(ot); setReviewNote(''); }}
                              title="Review with Note"
                            >
                              <MessageSquare size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted text-xs">Finalized</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Submit OT Modal ────────────────────────────────── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Timer size={18} style={{ display: 'inline', marginRight: 8 }} />Request Overtime</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Select Attendance Record</label>
                <select
                  className="form-input"
                  value={form.attendanceId}
                  onChange={(e) => setForm((p) => ({ ...p, attendanceId: e.target.value }))}
                  required
                >
                  <option value="">— Select a date —</option>
                  {myAttendance.map((r) => (
                    <option key={r._id} value={r._id}>
                      {format(parseISO(r.punchIn), 'MMM dd, yyyy')} · {r.totalWorkingHours}h
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Hours Requested</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  className="form-input"
                  placeholder="e.g. 2"
                  value={form.hoursRequested}
                  onChange={(e) => setForm((p) => ({ ...p, hoursRequested: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label"><MessageSquare size={14} style={{ display: 'inline', marginRight: 4 }} />Reason</label>
                <textarea
                  className="form-input"
                  placeholder="Describe why you worked overtime…"
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg w-full">
                <Timer size={16} /> Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Review Modal ───────────────────────────────────── */}
      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review OT Request</h2>
              <button className="modal-close" onClick={() => setReviewModal(null)}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ padding: 'var(--space-4)', background: 'var(--clr-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)', marginBottom: 4 }}>Employee</p>
                <p style={{ fontWeight: 700 }}>{reviewModal.user?.name}</p>
              </div>
              <div style={{ padding: 'var(--space-4)', background: 'var(--clr-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)', marginBottom: 4 }}>Hours · Reason</p>
                <p style={{ fontWeight: 700 }}>{reviewModal.hoursRequested}h</p>
                <p style={{ fontSize: 'var(--fs-sm)', marginTop: 4 }}>{reviewModal.reason}</p>
              </div>
            </div>
            <div className="form-group mb-4">
              <label className="form-label">Review Note (optional)</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Optional note for the employee…"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleReview('Approved')}>
                <CheckCircle size={16} /> Approve
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleReview('Rejected')}>
                <XCircle size={16} /> Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
