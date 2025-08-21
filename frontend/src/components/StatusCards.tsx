import React, { useEffect, useState } from 'react';
import { API_BASE } from '../modules/api';

type CardProps = { title: string; value?: string; valueNode?: React.ReactNode; accent?: string; tall?: boolean };

const Card: React.FC<CardProps> = ({ title, value, valueNode, accent = '#0ea5e9', tall = false }) => (
  <div
    style={{
      width: '100%',
      padding: 16,
      borderRadius: 14,
      background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
      border: '1px solid rgba(148,163,184,0.12)',
      boxShadow:
        '0 10px 24px rgba(0,0,0,0.35), inset 1px 1px 0 rgba(255,255,255,0.06), inset -1px -1px 0 rgba(0,0,0,0.35)',
      position: 'relative',
      height: tall ? 160 : 100,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: tall ? 'flex-start' : 'space-between',
      gap: tall ? 8 : 0,
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: -1,
        left: -1,
        height: 6,
        width: 'calc(100% + 2px)',
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,0))`,
        opacity: 0.8,
      }}
    />
    <div style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>{title}</div>
    {valueNode ? (
      <div style={{ marginTop: 4 }}>{valueNode}</div>
    ) : (
      <div style={{ fontSize: 20, fontWeight: 800, color: '#e5e7eb', marginTop: 4 }}>{value}</div>
    )}
  </div>
);

const StatusCards: React.FC = () => {
  const [summary, setSummary] = useState<{anomalies:number; actions:number; incidents:number} | null>(null);
  const [biz, setBiz] = useState<{downtime_avoided_min:number; cost_avoided:number} | null>(null);
  const [slo, setSlo] = useState<{availability_pct:number; latency_p95_ms:number|null; error_budget_remaining_pct?: number} | null>(null);
  const [stats, setStats] = useState<Record<string, Record<string, number>> | null>(null);
  useEffect(() => {
    const load = async () => {
      try {
        const [s, b, sl, st] = await Promise.all([
          fetch(`${API_BASE}/summary`).then(r=>r.json()),
          fetch(`${API_BASE}/business`).then(r=>r.json()),
          fetch(`${API_BASE}/slo`).then(r=>r.json()),
          fetch(`${API_BASE}/anomalies/stats`).then(r=>r.json()),
        ]);
        setSummary(s); setBiz(b); setSlo(sl); setStats(st);
      } catch {}
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);
  const formatLatency = (ms: number | null | undefined) => {
    if (ms == null) return '-';
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
    return `${ms.toFixed(1)} ms`;
  };
  const Pill: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <span
      style={{
        border: `1px solid ${color}`,
        color,
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: 13,
        fontWeight: 700,
        background: 'rgba(255,255,255,0.02)'
      }}
    >
      {label}: {value}
    </span>
  );
  return (
    <div>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <Card title="Anomalies" value={String(summary?.anomalies ?? 0)} accent="#ef4444" />
        <Card title="Actions" value={String(summary?.actions ?? 0)} accent="#22c55e" />
        <Card title="Incidents" value={String(summary?.incidents ?? 0)} accent="#f59e0b" />
        <Card title="Avail" value={`${(slo?.availability_pct ?? 100).toFixed(1)}%`} accent="#38bdf8" />
        <Card
          title="p95 latency"
          valueNode={
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#e5e7eb' }}>{formatLatency(slo?.latency_p95_ms)}</div>
              <div style={{ marginTop: 6, fontSize: 13, color: '#94a3b8' }}>
                <span style={{ fontWeight: 700, color: '#cbd5e1', fontSize: 13 }}>Health KPIs:</span>
                {' '}Latency p95 ideal: &lt; 200 ms (good), 200–500 ms (watch), &gt; 500 ms (action)
              </div>
            </div>
          }
          accent="#a78bfa"
          tall
        />
        <Card
          title="EBR"
          valueNode={(() => {
            const v = `${slo?.error_budget_remaining_pct?.toFixed?.(1) ?? '-' }%`;
            return (
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#e5e7eb' }}>{v}</div>
                <div style={{ marginTop: 6, fontSize: 13, color: '#94a3b8' }}>Error Budget Remaining</div>
              </div>
            );
          })()}
          accent="#34d399"
          tall
        />
        <Card
          title="Cost Avoided"
          valueNode={(
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#e5e7eb' }}>
                {`$${(biz?.cost_avoided ?? 0).toLocaleString()}`}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: '#94a3b8' }}>Estimated savings from avoided downtime</div>
            </div>
          )}
          accent="#eab308"
          tall
        />
        {stats && (
          <Card
            title="Anomaly Stats"
            valueNode={(() => {
              const mem = stats['mem'];
              if (!mem) return <div style={{ fontSize: 14, color: '#94a3b8' }}>No anomaly data</div>;
              return (
                <div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>Mem anomalies</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Pill label="low" value={mem.low ?? 0} color="#22c55e" />
                    <Pill label="med" value={mem.medium ?? 0} color="#f59e0b" />
                    <Pill label="high" value={mem.high ?? 0} color="#f97316" />
                    <Pill label="critical" value={mem.critical ?? 0} color="#ef4444" />
                  </div>
                </div>
              );
            })()}
            accent="#f472b6"
            tall
          />
        )}
      </div>
    </div>
  );
};

export default StatusCards;


