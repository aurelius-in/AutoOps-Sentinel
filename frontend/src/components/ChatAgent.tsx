import React, { useState } from 'react';
import { API_BASE } from '../modules/api';

const ChatAgent: React.FC = () => {
  const [q, setQ] = useState('What happened in the last hour?');
  const [a, setA] = useState<string>('');
  const [r, setR] = useState<string>('');

  const ask = async () => {
    const res = await fetch(`${API_BASE}/agent/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q }),
    });
    const data = await res.json();
    setA(data.answer || '');
    setR(data.reasoning || '');
  };

  return (
    <div style={{ marginTop: 16 }}>
      <h3>Chat Agent</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }} />
        <button onClick={ask}>Ask</button>
      </div>
      {a && <p style={{ marginTop: 8 }}><b>Answer:</b> {a}</p>}
      {r && <p style={{ marginTop: 4, color: '#666' }}><b>Reasoning:</b> {r}</p>}
    </div>
  );
};

export default ChatAgent;


