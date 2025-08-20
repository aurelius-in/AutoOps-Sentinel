import React, { useEffect, useState } from 'react';
import { API_BASE } from '../modules/api';

const RunbookCatalog: React.FC = () => {
  const [runbooks, setRunbooks] = useState<any[]>([]);
  const exec = async (name: string) => {
    await fetch(`${API_BASE}/actions/execute`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, params: { deployment: 'myapp', replicas: 2, service: 'myapp' } })
    });
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
            <button style={{ marginLeft: 8 }} onClick={() => exec(r.name)}>Run</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RunbookCatalog;


