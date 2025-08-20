import React, { useEffect, useState } from 'react';
import { API_BASE } from '../modules/api';

type CardProps = { title: string; value: string };

const Card: React.FC<CardProps> = ({ title, value }) => (
  <div style={{ border: '1px solid #eee', padding: 16, borderRadius: 8, minWidth: 160 }}>
    <div style={{ color: '#666' }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
  </div>
);

const StatusCards: React.FC = () => {
  const [summary, setSummary] = useState<{anomalies:number; actions:number; incidents:number} | null>(null);
  useEffect(() => {
    const load = async () => {
      try { const res = await fetch(`${API_BASE}/summary`); setSummary(await res.json()); } catch {}
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Card title="Anomalies" value={String(summary?.anomalies ?? 0)} />
      <Card title="Actions" value={String(summary?.actions ?? 0)} />
      <Card title="Incidents" value={String(summary?.incidents ?? 0)} />
      <Card title="Cost Avoided" value="$0" />
    </div>
  );
};

export default StatusCards;


