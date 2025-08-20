import React from 'react';
import { API_BASE } from '../modules/api';

const ReportButton: React.FC = () => {
  const download = () => {
    window.open(`${API_BASE}/report/pdf`, '_blank');
  };
  return <button onClick={download}>Download PDF Report</button>;
};

export default ReportButton;


