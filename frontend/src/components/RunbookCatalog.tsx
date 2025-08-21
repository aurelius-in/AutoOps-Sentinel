import React, { useEffect, useState } from 'react';
import { API_BASE, getAuthHeaders } from '../modules/api';

const RunbookCatalog: React.FC = () => {
  const [runbooks, setRunbooks] = useState<any[]>([]);
  const [preview, setPreview] = useState<{name:string; commands:string[]} | null>(null);
  const exec = async (name: string, approved: boolean) => {
    await fetch(`${API_BASE}/actions/execute`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, params: { deployment: 'myapp', replicas: 2, service: 'myapp', approved } })
    });
  };
  const doPreview = async (name: string) => {
    const res = await fetch(`${API_BASE}/runbooks/preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, params: { deployment: 'myapp', replicas: 2, service: 'myapp' } }) });
    setPreview(await res.json());
  };
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_BASE}/runbooks`);
      setRunbooks(await res.json());
    };
    load();
  }, []);
  return (
    <div style={{ marginTop: 8 }}>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Runbook Catalog</h3>
      <ul>
        {runbooks.map((r) => (
          <li key={r.name}>
            <div>
              <b>{r.name}</b> <small>({r.path})</small>
              {r.requires_approval && <span style={{ marginLeft: 8, color: '#c00' }}>Requires approval</span>}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              Success rate (last 50): {r.recent_success_rate != null ? `${Math.round(r.recent_success_rate * 100)}%` : 'n/a'}
              {r.last_success_at ? ` · Last success: ${new Date(r.last_success_at).toLocaleString()}` : ''}
              {r.owner ? ` · Owner: ${r.owner}` : ''}
              {r.service ? ` · Service: ${r.service}` : ''}
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => exec(r.name, true)}
                style={{
                  borderRadius: 10,
                  padding: '6px 12px',
                  border: '1px solid rgba(148,163,184,0.25)',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                  color: '#e5e7eb',
                  fontWeight: 600,
                  letterSpacing: 0.2,
                  cursor: 'pointer'
                }}
              >
                Run
              </button>
              <button
                onClick={() => fetch(`${API_BASE}/actions/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ name: r.name, params: { deployment: 'myapp', replicas: 2, service: 'myapp', dry_run: true, approved: true } }) })}
                style={{
                  borderRadius: 10,
                  padding: '6px 12px',
                  border: '1px solid rgba(148,163,184,0.25)',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                  color: '#e5e7eb',
                  fontWeight: 600,
                  letterSpacing: 0.2,
                  cursor: 'pointer'
                }}
              >
                Dry Run
              </button>
              <button
                onClick={() => doPreview(r.name)}
                style={{
                  borderRadius: 10,
                  padding: '6px 12px',
                  border: '1px solid rgba(148,163,184,0.25)',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                  color: '#e5e7eb',
                  fontWeight: 600,
                  letterSpacing: 0.2,
                  cursor: 'pointer'
                }}
              >
                Preview
              </button>
            </div>
          </li>
        ))}
      {preview && (
        <div style={{ marginTop: 8 }}>
          <b>Preview {preview.name}</b>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#0f172a', color: '#e5e7eb', padding: 8, borderRadius: 8 }}>{preview.commands.join('\n')}</pre>
        </div>
      )}
      </ul>
    </div>
  );
};

export default RunbookCatalog;


