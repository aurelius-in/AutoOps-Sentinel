import React, { useEffect, useState } from 'react';
import { API_BASE } from '../modules/api';

type Service = { service: string; owner?: string; runbooks: string[] };

const ServicesCatalog: React.FC = () => {
  const [items, setItems] = useState<Service[]>([]);
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_BASE}/services`);
      setItems(await res.json());
    };
    load();
  }, []);
  return (
    <div>
      <h3>Services</h3>
      <ul>
        {items.map((s) => (
          <li key={s.service}>
            <b>{s.service}</b> {s.owner ? <small>(owner: {s.owner})</small> : null}
            <div style={{ fontSize: 12, color: '#666' }}>Runbooks: {s.runbooks.join(', ')}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ServicesCatalog;


