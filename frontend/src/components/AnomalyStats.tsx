import React, { useEffect, useState } from 'react';
import { API_BASE } from '../modules/api';

const sevOrder = ['low','medium','high','critical'] as const;

const AnomalyStats: React.FC = () => {
  const [stats, setStats] = useState<Record<string, Record<string, number>>>({});
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_BASE}/anomalies/stats`);
      setStats(await res.json());
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);
  const entries = Object.entries(stats);
  if (!entries.length) return <div>No anomaly stats yet.</div>;
  return (
    <div>
      <h3>Anomaly Stats</h3>
      <ul>
        {entries.map(([metric, sevMap]) => (
          <li key={metric}>
            <b>{metric}</b>: {sevOrder.map(s => `${s}:${sevMap[s] ?? 0}`).join(' ')}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AnomalyStats;


