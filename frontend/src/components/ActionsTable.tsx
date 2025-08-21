import React, { useEffect, useState } from 'react';
import { API_BASE } from '../modules/api';

type Action = { id: string; name: string; success: boolean; created_at: string };

const ActionsTable: React.FC = () => {
  const [rows, setRows] = useState<Action[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_BASE}/actions?limit=500`);
      setRows(await res.json());
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 8, color: '#cbd5e1' }}>Recent Actions</h3>
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 160 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e5e7eb' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 6 }}>Time</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Action</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} onClick={async () => { const res = await fetch(`${API_BASE}/actions/${r.id}`); setSelected(await res.json()); }} style={{ cursor: 'pointer' }}>
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
      {selected && (
        <div style={{ marginTop: 8 }}>
          <b>Action {selected.name}</b>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f9f9f9', padding: 8 }}>{selected?.result?.logs || ''}</pre>
        </div>
      )}
    </div>
  );
};

export default ActionsTable;


