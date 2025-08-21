import React, { useEffect, useState } from 'react';
import { API_BASE, getAuthHeaders } from '../modules/api';

const RunbookCatalog: React.FC = () => {
  const [runbooks, setRunbooks] = useState<any[]>([]);
  const [preview, setPreview] = useState<{name:string; commands:string[]} | null>(null);
  const toTitle = (s: string) => (s || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const describe = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('restart') && n.includes('service')) return 'Safely restart a service and verify health.';
    if (n.includes('rollout') || n.includes('undo') || n.includes('rollback')) return 'Rollback the last deployment to the previous stable version.';
    if (n.includes('scale') && n.includes('deployment')) return 'Scale a deployment up or down to relieve pressure.';
    if (n.includes('quarantine') && n.includes('host')) return 'Isolate a problematic host from the fleet.';
    return 'Operational runbook action.';
  };
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
      <h3 style={{ marginTop: 0, marginBottom: 8, color: '#cbd5e1' }}>Runbook Catalog</h3>
      <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
        {runbooks.map((r) => (
          <li key={r.name} style={{ padding: '6px 0 12px 0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <b style={{ color: '#e5e7eb' }}>{toTitle(r.name)}</b>
              {r.service && (
                <span style={{
                  padding: '2px 8px', borderRadius: 9999,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(148,163,184,0.2)', color: '#94a3b8', fontSize: 12
                }}>Service: {r.service}</span>
              )}
              {r.owner && (
                <span style={{
                  padding: '2px 8px', borderRadius: 9999,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(148,163,184,0.2)', color: '#94a3b8', fontSize: 12
                }}>Owner: {r.owner}</span>
              )}
              {r.requires_approval && (
                <span style={{
                  padding: '2px 8px', borderRadius: 9999,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 12
                }}>Approval required</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              {describe(r.name)}
              <span style={{ marginLeft: 8 }}>
                Success (last 50): <span style={{ color: '#e5e7eb' }}>{r.recent_success_rate != null ? `${Math.round(r.recent_success_rate * 100)}%` : 'n/a'}</span>
                {r.last_success_at ? ` · Last success: ${new Date(r.last_success_at).toLocaleString()}` : ''}
              </span>
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
            <div style={{ height: 8 }} />
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


