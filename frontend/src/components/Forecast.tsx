import React, { useEffect, useState } from 'react';
import { API_BASE } from '../modules/api';

const Forecast: React.FC = () => {
  const [data, setData] = useState<{mean:number[]; lower:number[]; upper:number[]} | null>(null);
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_BASE}/forecast?metric=cpu&horizon=12`);
      setData(await res.json());
    };
    load();
  }, []);
  return (
    <div style={{ marginTop: 16 }}>
      <h3>Forecast</h3>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{data ? JSON.stringify(data) : 'Loading…'}</pre>
    </div>
  );
};

export default Forecast;


