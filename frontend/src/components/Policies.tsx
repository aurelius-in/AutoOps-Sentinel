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
  const nice = (k: string) => (k || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 8, color: '#cbd5e1' }}>Policies</h3>
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
      <div style={{ marginTop: 8 }}>
        <b style={{ color: '#94a3b8' }}>Rules</b>
        <ul style={{ paddingLeft: 16 }}>
          {rules.map((r, idx) => (
            <li key={idx}>
              <span style={{ color: '#e5e7eb' }}>{r.condition.replace('cpu', 'CPU').replace('error_rate', 'Error Rate').replace('failed_logins', 'Failed Logins')}</span>
              <span style={{ color: '#94a3b8' }}> → </span>
              <span style={{ color: '#e5e7eb' }}>{nice(r.action)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 8 }}>
        <ul style={{ paddingLeft: 16 }}>
          {suggestions.map((s, idx) => (
            <li key={idx}>
              <span style={{ color: '#e5e7eb' }}>{s.reason.replace('cpu', 'CPU').replace('error_rate', 'Error Rate').replace('failed_logins', 'Failed Logins')}</span>
              <span style={{ color: '#94a3b8' }}> → </span>
              <span style={{ color: '#e5e7eb' }}>{nice(s.action)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Policies;


