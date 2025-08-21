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
    <div style={{
      margin: '8px 0',
      padding: 10,
      borderRadius: 10,
      background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
      border: '1px solid rgba(148,163,184,0.15)'
    }}>
      <b style={{ color: '#94a3b8' }}>Estimated cost avoided:</b>
      {' '}
      <span style={{ color: '#eab308', fontWeight: 800 }}>{formatUsd(display)}</span>
    </div>
  );
};

export default BusinessTicker;


