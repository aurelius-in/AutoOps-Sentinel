import React from 'react';
import { API_BASE } from '../modules/api';

const ReportButton: React.FC = () => {
  const downloadPdf = () => {
    window.open(`${API_BASE}/report/pdf`, '_blank');
  };
  const downloadJson = () => {
    window.open(`${API_BASE}/report/json`, '_blank');
  };
  const downloadAnomsCsv = () => {
    window.open(`${API_BASE}/export/anomalies.csv`, '_blank');
  };
  const downloadActionsCsv = () => {
    window.open(`${API_BASE}/export/actions.csv`, '_blank');
  };
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={downloadPdf}
        style={{
          borderRadius: 10,
          padding: '8px 14px',
          border: '1px solid rgba(148,163,184,0.2)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
          color: '#e5e7eb',
          fontWeight: 600,
          letterSpacing: 0.2,
          cursor: 'pointer'
        }}
      >
        Download PDF Report
      </button>
      <button
        onClick={downloadJson}
        style={{
          borderRadius: 10,
          padding: '8px 14px',
          border: '1px solid rgba(148,163,184,0.2)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
          color: '#e5e7eb',
          fontWeight: 600,
          letterSpacing: 0.2,
          cursor: 'pointer'
        }}
      >
        Download JSON Report
      </button>
      <button
        onClick={downloadAnomsCsv}
        style={{
          borderRadius: 10,
          padding: '8px 14px',
          border: '1px solid rgba(148,163,184,0.2)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
          color: '#e5e7eb',
          fontWeight: 600,
          letterSpacing: 0.2,
          cursor: 'pointer'
        }}
      >
        Download Anomalies CSV
      </button>
      <button
        onClick={downloadActionsCsv}
        style={{
          borderRadius: 10,
          padding: '8px 14px',
          border: '1px solid rgba(148,163,184,0.2)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
          color: '#e5e7eb',
          fontWeight: 600,
          letterSpacing: 0.2,
          cursor: 'pointer'
        }}
      >
        Download Actions CSV
      </button>
    </div>
  );
};

export default ReportButton;


