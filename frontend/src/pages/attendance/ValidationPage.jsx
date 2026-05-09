import { useState } from 'react';
import { Shield, MapPin, CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react';
import {
  useGetAttendanceQuery,
  useValidateAttendanceMutation,
} from '../../store/apiSlice.js';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function ValidationPage() {
  const { data, isLoading, refetch } = useGetAttendanceQuery({});
  const [validate] = useValidateAttendanceMutation();
  const [selected, setSelected] = useState(null); // record being reviewed
  const [remarks, setRemarks] = useState('');
  const [mapOpen, setMapOpen] = useState(false);

  const records = (data?.data || []).filter((r) => r.validationStatus === 'Pending');

  const handleValidate = async (status) => {
    try {
      await validate({ id: selected._id, validationStatus: status, validationRemarks: remarks }).unwrap();
      toast.success(`Marked as ${status}`);
      setSelected(null);
      setRemarks('');
      refetch();
    } catch {
      toast.error('Validation failed. Please try again.');
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Attendance Validation</h1>
        <p>Review employee selfies, location, and mark records as Valid or Invalid.</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left: Pending list */}
        <div className="card">
          <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            <Shield size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            Pending Records ({records.length})
          </h3>

          {isLoading ? (
            <div className="loading-screen" style={{ minHeight: 200 }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : records.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={40} />
              <p>All records validated!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {records.map((rec) => (
                <button
                  key={rec._id}
                  onClick={() => { setSelected(rec); setRemarks(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    padding: 'var(--space-3)', background: selected?._id === rec._id ? 'rgba(99,102,241,0.1)' : 'var(--clr-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${selected?._id === rec._id ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                    width: '100%', textAlign: 'left', transition: 'all 0.15s',
                    cursor: 'pointer',
                  }}
                >
                  {rec.selfieImage ? (
                    <img src={rec.selfieImage} alt="selfie" className="selfie-thumb" />
                  ) : (
                    <div className="selfie-thumb" style={{ background: 'var(--clr-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Eye size={16} style={{ color: 'var(--clr-text-muted)' }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{rec.user?.name || 'Unknown'}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>
                      {format(parseISO(rec.punchIn), 'MMM dd · hh:mm a')}
                    </div>
                  </div>
                  <span className="badge badge-pending">Pending</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Detail panel */}
        <div className="card" style={{ minHeight: 300 }}>
          {!selected ? (
            <div className="empty-state">
              <Eye size={40} />
              <p>Select a record to review</p>
            </div>
          ) : (
            <div className="animate-in">
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>
                  {selected.user?.name || 'Employee'}
                </h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>
                  <XCircle size={16} /> Close
                </button>
              </div>

              {/* Selfie */}
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Captured Selfie</p>
                {selected.selfieImage ? (
                  <img src={selected.selfieImage} alt="Employee selfie" className="selfie-large" style={{ margin: '0 auto' }} />
                ) : (
                  <div className="selfie-large" style={{ background: 'var(--clr-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <Eye size={40} style={{ color: 'var(--clr-text-muted)' }} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                <InfoRow label="Punch In" value={format(parseISO(selected.punchIn), 'MMM dd, yyyy · hh:mm a')} />
                {selected.punchOut && <InfoRow label="Punch Out" value={format(parseISO(selected.punchOut), 'hh:mm a')} />}
                <InfoRow label="Hours Worked" value={selected.totalWorkingHours != null ? `${selected.totalWorkingHours}h` : 'Active'} />
                <InfoRow label="Shift Status" value={
                  <span className={`badge ${selected.shiftStatus === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                    {selected.shiftStatus}
                  </span>
                } />
                {selected.location && (
                  <InfoRow label="Location" value={
                    <a
                      href={`https://maps.google.com/?q=${selected.location.latitude},${selected.location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--clr-accent)' }}
                    >
                      <MapPin size={14} />
                      {selected.location.latitude?.toFixed(4)}, {selected.location.longitude?.toFixed(4)}
                    </a>
                  } />
                )}
              </div>

              {/* Remarks */}
              <div className="form-group mb-4">
                <label className="form-label">
                  <MessageSquare size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Remarks (optional)
                </label>
                <textarea
                  className="form-input"
                  placeholder="Add a note or reason for your decision…"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleValidate('Valid')}>
                  <CheckCircle size={16} /> Mark Valid
                </button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleValidate('Invalid')}>
                  <XCircle size={16} /> Mark Invalid
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)', padding: '6px 0', borderBottom: '1px solid var(--clr-border)' }}>
      <span style={{ color: 'var(--clr-text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
