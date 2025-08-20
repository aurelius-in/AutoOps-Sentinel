import React, { useEffect, useState } from 'react';
import { API_BASE } from '../modules/api';

const RunbookCatalog: React.FC = () => {
  const [runbooks, setRunbooks] = useState<any[]>([]);
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
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RunbookCatalog;


