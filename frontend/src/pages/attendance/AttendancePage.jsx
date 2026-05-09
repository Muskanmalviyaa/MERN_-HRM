import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, MapPin, LogIn, LogOut, CheckCircle,
  AlertTriangle, Clock, XCircle, RefreshCw
} from 'lucide-react';
import { usePunchInMutation, usePunchOutMutation, useGetAttendanceQuery } from '../../store/apiSlice.js';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import './AttendancePage.css';

export default function AttendancePage() {
  // Camera state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  // Location state
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  // Today's record
  const { data: attData, isLoading: attLoading, refetch } = useGetAttendanceQuery({});
  const [punchIn, { isLoading: punchInLoading }] = usePunchInMutation();
  const [punchOut, { isLoading: punchOutLoading }] = usePunchOutMutation();

  const records = attData?.data || [];
  const today = new Date().toDateString();
  const todayRecord = records.find(
    (r) => new Date(r.punchIn).toDateString() === today
  );
  const isActive = todayRecord && !todayRecord.punchOut;

  // ── Camera helpers ───────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      setCameraActive(true);
      setCapturedImage(null);
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera access was denied. Please allow camera permissions.'
        : 'Could not access camera. Ensure it is connected.';
      setCameraError(msg);
    }
  }, []);

  // Attach stream when video element is ready
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.error("Video play error:", e));
    }
  }, [cameraActive]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // Mirror the canvas to match video preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();

    // Automatically trigger location capture
    fetchLocation();
  }, [stopCamera]);

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  // Cleanup stream on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Location helper ──────────────────────────────────────
  const fetchLocation = () => {
    setLocationError(null);
    setLocLoading(true);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocLoading(false);
      },
      (err) => {
        const msg = err.code === 1
          ? 'Location access denied. Please reset permissions in your browser settings (click the lock/tune icon in the URL bar).'
          : 'Could not retrieve your location. Please check your GPS and try again.';
        setLocationError(msg);
        setLocLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // ── Punch In ─────────────────────────────────────────────
  const handlePunchIn = async () => {
    if (!capturedImage) {
      toast.error('Please capture your selfie first');
      return;
    }
    if (!location) {
      toast.error('Please capture your location first');
      return;
    }
    try {
      await punchIn({ selfieImage: capturedImage, location }).unwrap();
      toast.success('Punched in successfully! Have a great shift 🎉');
      setCapturedImage(null);
      setLocation(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.error || 'Punch in failed');
    }
  };

  // ── Punch Out ────────────────────────────────────────────
  const handlePunchOut = async () => {
    try {
      const res = await punchOut().unwrap();
      const hours = res.data?.totalWorkingHours;
      const status = res.data?.shiftStatus;
      toast.success(`Punched out! ${hours}h worked — Shift ${status}`);
      refetch();
    } catch (err) {
      toast.error(err?.data?.error || 'Punch out failed');
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Attendance</h1>
        <p>Mark your attendance with a live selfie and location.</p>
      </div>

      <div className="attendance-grid">
        {/* ── Left: Camera & Location ──────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

          {/* Today Status Banner */}
          {todayRecord && (
            <div className={`today-banner ${isActive ? 'today-banner--active' : 'today-banner--done'}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {isActive ? <Clock size={24} /> : <CheckCircle size={24} />}
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {isActive ? 'Currently Clocked In' : 'Shift Complete'}
                  </div>
                  <div style={{ fontSize: 'var(--fs-sm)', opacity: 0.85 }}>
                    Punched in at {format(parseISO(todayRecord.punchIn), 'hh:mm a')}
                    {todayRecord.punchOut && ` · Out at ${format(parseISO(todayRecord.punchOut), 'hh:mm a')}`}
                    {todayRecord.totalWorkingHours != null && ` · ${todayRecord.totalWorkingHours}h`}
                  </div>
                </div>
              </div>
              {todayRecord.shiftStatus && (
                <span className={`badge ${todayRecord.shiftStatus === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                  {todayRecord.shiftStatus}
                </span>
              )}
            </div>
          )}

          {/* Punch Out Button (if active) */}
          {isActive && (
            <button
              className="btn btn-danger btn-lg"
              onClick={handlePunchOut}
              disabled={punchOutLoading}
            >
              {punchOutLoading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : <LogOut size={20} />}
              Punch Out
            </button>
          )}

          {/* Camera Card */}
          {!todayRecord && (
            <div className="card">
              <h3 className="section-title">
                <Camera size={18} /> 1. Verify Identity
              </h3>

              {cameraError && (
                <div className="alert alert-danger">
                  <XCircle size={16} /> {cameraError}
                </div>
              )}

              {!cameraActive && !capturedImage && (
                <button className="btn btn-outline w-full" style={{ padding: '2rem' }} onClick={startCamera}>
                  <Camera size={24} />
                  Open Camera
                </button>
              )}

              {cameraActive && !capturedImage && (
                <div className="camera-container">
                  <video ref={videoRef} autoPlay playsInline muted />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div className="camera-controls">
                    <button className="camera-btn" onClick={capturePhoto} title="Capture">
                      <Camera size={24} />
                    </button>
                    <button className="camera-btn" onClick={stopCamera} title="Cancel"
                      style={{ background: 'rgba(239,68,68,0.4)', borderColor: '#ef4444' }}>
                      <XCircle size={20} />
                    </button>
                  </div>
                </div>
              )}

              {capturedImage && (
                <div style={{ textAlign: 'center' }}>
                  <img src={capturedImage} alt="Captured selfie" className="selfie-preview" />
                  <button className="btn btn-ghost btn-sm mt-2" onClick={retakePhoto}>
                    <RefreshCw size={14} /> Retake
                  </button>
                  <div className="mt-2" style={{ color: 'var(--clr-success)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontSize: 'var(--fs-sm)' }}>
                    <CheckCircle size={16} /> Selfie captured
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Location Card */}
          {!todayRecord && (
            <div className="card">
              <h3 className="section-title">
                <MapPin size={18} /> 2. Verify Location
              </h3>

              {locationError && (
                <div className="alert alert-danger">
                  <AlertTriangle size={16} /> {locationError}
                </div>
              )}

              {!location ? (
                <button
                  className="btn btn-outline w-full"
                  onClick={fetchLocation}
                  disabled={locLoading}
                >
                  {locLoading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <MapPin size={18} />}
                  {locLoading ? 'Getting location…' : 'Get My Location'}
                </button>
              ) : (
                <div className="location-result">
                  <CheckCircle size={16} style={{ color: 'var(--clr-success)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>Location captured</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>
                      Lat: {location.latitude.toFixed(5)} · Lon: {location.longitude.toFixed(5)}
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={fetchLocation} style={{ marginLeft: 'auto' }}>
                    <RefreshCw size={12} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Punch In Button */}
          {!todayRecord && (
            <button
              className="btn btn-success btn-lg"
              onClick={handlePunchIn}
              disabled={punchInLoading || !capturedImage || !location}
            >
              {punchInLoading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : <LogIn size={20} />}
              Punch In
            </button>
          )}
        </div>

        {/* ── Right: History ───────────────────────────────── */}
        <div className="card">
          <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            <Clock size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            Attendance History
          </h3>
          {attLoading ? (
            <div className="loading-screen" style={{ minHeight: 200 }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : records.length === 0 ? (
            <div className="empty-state">
              <Clock size={40} />
              <p>No attendance records yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {records.slice(0, 15).map((rec) => (
                <div key={rec._id} className="history-item">
                  {rec.selfieImage ? (
                    <img src={rec.selfieImage} alt="selfie" className="selfie-thumb" />
                  ) : (
                    <div className="selfie-thumb" style={{ background: 'var(--clr-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={16} style={{ color: 'var(--clr-text-muted)' }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
                      {format(parseISO(rec.punchIn), 'EEEE, MMM dd')}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>
                      {format(parseISO(rec.punchIn), 'hh:mm a')}
                      {rec.punchOut && ` → ${format(parseISO(rec.punchOut), 'hh:mm a')}`}
                      {rec.location && ` · 📍 ${rec.location.latitude?.toFixed(3)}, ${rec.location.longitude?.toFixed(3)}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {rec.totalWorkingHours != null && (
                      <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--clr-primary-light)' }}>
                        {rec.totalWorkingHours}h
                      </span>
                    )}
                    <span className={`badge ${rec.shiftStatus === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                      {rec.shiftStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
