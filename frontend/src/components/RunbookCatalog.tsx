import React, { useEffect, useState } from 'react';
import { API_BASE } from '../modules/api';

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
    <div style={{ marginTop: 16 }}>
      <h3>Runbook Catalog</h3>
      <ul>
        {runbooks.map((r) => (
          <li key={r.name}>
            <b>{r.name}</b> <small>({r.path})</small>
            {r.requires_approval && <span style={{ marginLeft: 8, color: '#c00' }}>Requires approval</span>}
            <button style={{ marginLeft: 8 }} onClick={() => exec(r.name, true)}>Run</button>
            <button style={{ marginLeft: 8 }} onClick={() => fetch(`${API_BASE}/actions/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: r.name, params: { deployment: 'myapp', replicas: 2, service: 'myapp', dry_run: true, approved: true } }) })}>Dry Run</button>
            <button style={{ marginLeft: 8 }} onClick={() => doPreview(r.name)}>Preview</button>
          </li>
        ))}
      {preview && (
        <div style={{ marginTop: 8 }}>
          <b>Preview {preview.name}</b>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f9f9f9', padding: 8 }}>{preview.commands.join('\n')}</pre>
        </div>
      )}
      </ul>
    </div>
  );
};

export default RunbookCatalog;


