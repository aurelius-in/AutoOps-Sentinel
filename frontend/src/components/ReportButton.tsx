import React from 'react';
import { API_BASE } from '../modules/api';

const ReportButton: React.FC = () => {
  const downloadPdf = () => {
    window.open(`${API_BASE}/report/pdf`, '_blank');
  };
  const downloadJson = () => {
    window.open(`${API_BASE}/report/json`, '_blank');
  };
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={downloadPdf}>Download PDF Report</button>
      <button onClick={downloadJson}>Download JSON Report</button>
    </div>
  );
};

export default ReportButton;


