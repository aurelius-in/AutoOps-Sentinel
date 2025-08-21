import React, { useEffect, useState } from 'react';
import { API_BASE, getAuthHeaders } from '../modules/api';

const Policies: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    const load = async () => {
      const [r, s] = await Promise.all([
        fetch(`${API_BASE}/policies`).then(res => res.json()),
        fetch(`${API_BASE}/policies/suggest`).then(res => res.json()),
      ]);
      setRules(r); setSuggestions(s);
    };
    load();
  }, []);
  const autoApply = async () => {
    setMsg('Applying suggestions...');
    await fetch(`${API_BASE}/actions/auto`, { method: 'POST', headers: { ...getAuthHeaders() } });
    setMsg('Applied');
  };
  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Policies</h3>
      <button onClick={autoApply} style={{
        borderRadius: 10,
        padding: '6px 12px',
        border: '1px solid rgba(148,163,184,0.25)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
        color: '#e5e7eb',
        fontWeight: 600,
        letterSpacing: 0.2,
        cursor: 'pointer'
      }}>Auto-apply suggestions</button>
      {msg && <div style={{ marginTop: 4 }}>{msg}</div>}
      <div>
        <b>Rules</b>
        <ul>
          {rules.map((r, idx) => (<li key={idx}>{r.condition} → {r.action}</li>))}
        </ul>
      </div>
      <div>
        <b>Suggestions</b>
        <ul>
          {suggestions.map((s, idx) => (<li key={idx}>{s.reason} → {s.action}</li>))}
        </ul>
      </div>
    </div>
  );
};

export default Policies;


