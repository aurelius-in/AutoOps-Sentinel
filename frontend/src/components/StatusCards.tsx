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
  const [biz, setBiz] = useState<{downtime_avoided_min:number; cost_avoided:number} | null>(null);
  const [slo, setSlo] = useState<{availability_pct:number; latency_p95_ms:number|null; error_budget_remaining_pct?: number} | null>(null);
  useEffect(() => {
    const load = async () => {
      try {
        const [s, b, sl] = await Promise.all([
          fetch(`${API_BASE}/summary`).then(r=>r.json()),
          fetch(`${API_BASE}/business`).then(r=>r.json()),
          fetch(`${API_BASE}/slo`).then(r=>r.json()),
        ]);
        setSummary(s); setBiz(b); setSlo(sl);
      } catch {}
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
      <Card title="Avail" value={`${(slo?.availability_pct ?? 100).toFixed(1)}%`} />
      <Card title="p95" value={`${slo?.latency_p95_ms ?? '-'} ms`} />
      <Card title="EBR" value={`${slo?.error_budget_remaining_pct?.toFixed?.(1) ?? '-'}%`} />
      <Card title="Cost Avoided" value={`$${(biz?.cost_avoided ?? 0).toLocaleString()}`} />
    </div>
  );
};

export default StatusCards;


