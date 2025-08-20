import React from 'react';

const RunbookCatalog: React.FC = () => {
  const runbooks = [
    { name: 'restart_service', desc: 'Restart a systemd service' },
    { name: 'rollout_undo', desc: 'Rollback last deployment' },
    { name: 'scale_deployment', desc: 'Scale K8s deployment' },
    { name: 'quarantine_host', desc: 'Isolate a compromised host' },
  ];
  return (
    <div style={{ marginTop: 16 }}>
      <h3>Runbook Catalog</h3>
      <ul>
        {runbooks.map((r) => (
          <li key={r.name}>
            <b>{r.name}</b>: {r.desc}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RunbookCatalog;


