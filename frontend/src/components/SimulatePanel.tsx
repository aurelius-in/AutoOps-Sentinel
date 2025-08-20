import React, { useState } from 'react';
import { API_BASE } from '../modules/api';

const SimulatePanel: React.FC = () => {
  const [msg, setMsg] = useState('');
  const trigger = async (mode: string) => {
    setMsg(`Starting ${mode}...`);
    await fetch(`${API_BASE}/simulate/${mode}`, { method: 'POST' });
    setMsg(`Triggered ${mode}`);
  };
  const reset = async () => {
    await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    setMsg('Demo reset');
  }
  const wow = async () => {
    setMsg('Starting Wow Demo…');
    await fetch(`${API_BASE}/demo/wow`, { method: 'POST' });
    setMsg('Wow Demo started');
  }
  return (
    <div>
      <h3>Simulation</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => trigger('error-storm')}>Error Storm</button>
        <button onClick={() => trigger('cpu-spike')}>CPU Spike</button>
        <button onClick={() => trigger('login-attack')}>Login Attack</button>
        <button onClick={wow}>Run Wow Demo</button>
        <button onClick={reset}>Reset</button>
      </div>
      {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
    </div>
  );
};

export default SimulatePanel;


