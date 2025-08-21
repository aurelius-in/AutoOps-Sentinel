import React, { useEffect, useState } from 'react';
import { API_BASE } from '../modules/api';

type Anomaly = { id: string; metric: string; score: number; severity: string; created_at: string };

const AnomaliesTable: React.FC = () => {
  const [rows, setRows] = useState<Anomaly[]>([]);
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_BASE}/anomalies?limit=500`);
      setRows(await res.json());
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 6 }}>Anomalies</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 6 }}>Time</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Metric</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Severity</th>
              <th style={{ textAlign: 'right', padding: 6 }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ padding: 6 }}>{new Date(r.created_at).toLocaleTimeString()}</td>
                <td style={{ padding: 6 }}>{r.metric}</td>
                <td style={{ padding: 6, color: r.severity === 'critical' ? '#b00020' : r.severity === 'high' ? '#d32f2f' : r.severity === 'medium' ? '#f57c00' : '#388e3c' }}>{r.severity}</td>
                <td style={{ padding: 6, textAlign: 'right' }}>{(r.score as any)?.toFixed ? (r.score as any).toFixed(2) : r.score}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 6, color: '#666' }}>No anomalies yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnomaliesTable;


