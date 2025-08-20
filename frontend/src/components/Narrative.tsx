import React, { useEffect, useState } from 'react';
import { API_BASE } from '../modules/api';

const Narrative: React.FC = () => {
  const [data, setData] = useState<{ bullets: string[] } | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_BASE}/agent/narrative`);
      setData(await res.json());
    };
    load();
  }, []);
  const copy = async () => {
    if (!data?.bullets?.length) return;
    const text = data.bullets.map((b) => `• ${b}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div>
      <h3>Narrative</h3>
      <div style={{ marginBottom: 8 }}>
        <button onClick={copy} disabled={!data?.bullets?.length}>Copy Summary</button>
        {copied && <span style={{ marginLeft: 8, color: '#0a0' }}>Copied</span>}
      </div>
      <ul>
        {data?.bullets?.map((b, idx) => <li key={idx}>{b}</li>)}
      </ul>
    </div>
  );
};

export default Narrative;


