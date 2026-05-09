import { useState } from 'react';
import { FileText, Download, Filter, Calendar } from 'lucide-react';
import { useGetAttendanceReportQuery } from '../../store/apiSlice.js';
import { format, parseISO, subDays } from 'date-fns';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data, isLoading, isFetching } = useGetAttendanceReportQuery(dateRange);
  const records = data?.data || [];

  const handleExport = () => {
    // In a real app, this would generate a CSV/PDF or call an export endpoint
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Name,Date,Punch In,Punch Out,Hours,Shift Status,Validation\n"
      + records.map(r => {
          return `${r.user?.name || 'Unknown'},${format(parseISO(r.punchIn), 'yyyy-MM-dd')},${format(parseISO(r.punchIn), 'HH:mm')},${r.punchOut ? format(parseISO(r.punchOut), 'HH:mm') : 'Active'},${r.totalWorkingHours || ''},${r.shiftStatus},${r.validationStatus}`;
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Report exported successfully');
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Attendance Reports</h1>
          <p>Generate and export attendance data.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleExport}
          disabled={records.length === 0 || isLoading}
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6" style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: '1 1 200px' }}>
          <label className="form-label"><Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />Start Date</label>
          <input
            type="date"
            className="form-input"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(p => ({ ...p, startDate: e.target.value }))}
          />
        </div>
        <div className="form-group" style={{ flex: '1 1 200px' }}>
          <label className="form-label"><Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />End Date</label>
          <input
            type="date"
            className="form-input"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(p => ({ ...p, endDate: e.target.value }))}
          />
        </div>
        <div style={{ paddingBottom: 6 }}>
           <span className="text-sm text-muted">
             {isFetching ? 'Updating...' : `Found ${records.length} records`}
           </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
          <FileText size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Report Data
        </h2>
        
        {isLoading ? (
          <div className="loading-screen" style={{ minHeight: 200 }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <Filter size={40} />
            <p>No records found for the selected date range.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Selfie</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Hours</th>
                  <th>Shift</th>
                  <th>Validation</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec._id}>
                    <td style={{ fontWeight: 600 }}>{rec.user?.name || '—'}</td>
                    <td>
                      {rec.selfieImage ? (
                        <img src={rec.selfieImage} alt="selfie" className="selfie-thumb" />
                      ) : '—'}
                    </td>
                    <td>
                      {rec.location ? (
                        <a 
                          href={`https://maps.google.com/?q=${rec.location.latitude},${rec.location.longitude}`} 
                          target="_blank" rel="noreferrer"
                          className="text-xs text-accent"
                          style={{ color: 'var(--clr-accent)', textDecoration: 'underline' }}
                        >
                          View Map
                        </a>
                      ) : '—'}
                    </td>
                    <td>{format(parseISO(rec.punchIn), 'MMM dd, yyyy')}</td>
                    <td>{format(parseISO(rec.punchIn), 'hh:mm a')}</td>
                    <td>{rec.punchOut ? format(parseISO(rec.punchOut), 'hh:mm a') : <span className="text-muted">—</span>}</td>
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
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
