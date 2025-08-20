import React, { useEffect, useRef, useState } from 'react';
import { API_BASE } from '../modules/api';

const formatUsd = (n: number) => `$${n.toLocaleString()}`;

const BusinessTicker: React.FC = () => {
  const [target, setTarget] = useState<number>(0);
  const [display, setDisplay] = useState<number>(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_BASE}/business`);
      const data = await res.json();
      setTarget(Number(data.cost_avoided || 0));
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (display === target) return;
    const start = performance.now();
    const from = display;
    const to = target;
    const duration = 500;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setDisplay(Math.round(from + (to - from) * p));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target]);

  return (
    <div style={{ margin: '8px 0', padding: 8, background: '#f5faff', border: '1px solid #e3f2fd', borderRadius: 6 }}>
      <b>Estimated cost avoided:</b> <span style={{ color: '#1a73e8', fontWeight: 700 }}>{formatUsd(display)}</span>
    </div>
  );
};

export default BusinessTicker;


