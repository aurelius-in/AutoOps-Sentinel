import React, { useState } from 'react';
import { API_BASE, getAuthHeaders } from '../modules/api';

const SimulatePanel: React.FC = () => {
  const [msg, setMsg] = useState('');
  const trigger = async (mode: string) => {
    setMsg(`Starting ${mode}...`);
    await fetch(`${API_BASE}/simulate/${mode}`, { method: 'POST', headers: { ...getAuthHeaders() } });
    setMsg(`Triggered ${mode}`);
  };
  const reset = async () => {
    await fetch(`${API_BASE}/demo/reset`, { method: 'POST', headers: { ...getAuthHeaders() } });
    setMsg('Demo reset');
  }
  const wow = async () => {
    setMsg('Starting Wow Demo…');
    await fetch(`${API_BASE}/demo/wow`, { method: 'POST', headers: { ...getAuthHeaders() } });
    setMsg('Wow Demo started');
  }
  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 8, color: '#cbd5e1' }}>Scenario Triggers</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { label: 'Error Storm', onClick: () => trigger('error-storm') },
          { label: 'CPU Spike', onClick: () => trigger('cpu-spike') },
          { label: 'Login Attack', onClick: () => trigger('login-attack') },
          { label: 'Reset', onClick: reset },
        ].map((b) => (
          <button key={b.label} onClick={b.onClick} style={{
            borderRadius: 10,
            padding: '6px 12px',
            border: '1px solid rgba(148,163,184,0.25)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
            color: '#e5e7eb',
            fontWeight: 600,
            letterSpacing: 0.2,
            cursor: 'pointer'
          }}>{b.label}</button>
        ))}
      </div>
      {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
    </div>
  );
};

export default SimulatePanel;


