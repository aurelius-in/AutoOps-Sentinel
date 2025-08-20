import React, { useEffect, useState } from 'react';
import { API_BASE } from '../modules/api';

const Narrative: React.FC = () => {
  const [data, setData] = useState<{ bullets: string[] } | null>(null);
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_BASE}/agent/narrative`);
      setData(await res.json());
    };
    load();
  }, []);
  return (
    <div>
      <h3>Narrative</h3>
      <ul>
        {data?.bullets?.map((b, idx) => <li key={idx}>{b}</li>)}
      </ul>
    </div>
  );
};

export default Narrative;


