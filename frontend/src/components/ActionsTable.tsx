import React, { useEffect, useState } from 'react';
import { API_BASE } from '../modules/api';

type Action = { id: string; name: string; success: boolean; created_at: string };

const ActionsTable: React.FC = () => {
  const [rows, setRows] = useState<Action[]>([]);
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_BASE}/actions`);
      setRows(await res.json());
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <div>
      <h3>Recent Actions</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 6 }}>Time</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Action</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ padding: 6 }}>{new Date(r.created_at).toLocaleTimeString()}</td>
                <td style={{ padding: 6 }}>{r.name}</td>
                <td style={{ padding: 6, color: r.success ? '#388e3c' : '#b00020' }}>{r.success ? 'Success' : 'Failed'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={3} style={{ padding: 6, color: '#666' }}>No actions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActionsTable;


