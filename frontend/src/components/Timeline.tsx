import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../modules/api';

type EventItem = {
  id: string;
  type: 'anomaly' | 'action' | 'incident';
  when: string;
  metric?: string;
  severity?: string;
  success?: boolean;
  status?: string;
  title: string;
};

const severityColor = (sev?: string) =>
  sev === 'critical' ? '#ef4444' : sev === 'high' ? '#f97316' : sev === 'medium' ? '#f59e0b' : '#10b981';

const typeColor = (type: EventItem['type'], success?: boolean) => {
  if (type === 'action') return success ? '#22c55e' : '#ef4444';
  if (type === 'incident') return '#8b5cf6';
  return '#38bdf8';
};

const metricLabel = (m?: string) => {
  const map: Record<string, string> = { cpu: 'CPU', mem: 'Memory', latency: 'Latency', errors: 'Errors', logins: 'Logins' };
  return m && map[m] ? map[m] : (m || '');
};

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const Timeline: React.FC = () => {
  const [items, setItems] = useState<EventItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const [anomsRes, actsRes, incsRes] = await Promise.all([
        fetch(`${API_BASE}/anomalies`),
        fetch(`${API_BASE}/actions`),
        fetch(`${API_BASE}/incidents`),
      ]);
      const [anoms, acts, incs] = await Promise.all([anomsRes.json(), actsRes.json(), incsRes.json()]);
      const mapped: EventItem[] = [
        ...anoms.map((a: any) => ({
          id: a.id,
          type: 'anomaly' as const,
          when: a.created_at,
          metric: a.metric,
          severity: a.severity,
          title: `${metricLabel(a.metric)} anomaly — ${a.severity}`,
        })),
        ...acts.map((x: any) => ({
          id: x.id,
          type: 'action' as const,
          when: x.created_at,
          success: x.success,
          title: `${x.name}`,
        })),
        ...incs.map((i: any) => ({
          id: i.id,
          type: 'incident' as const,
          when: i.created_at,
          status: i.status,
          title: `${i.title}`,
        })),
      ].sort((l, r) => new Date(r.when).getTime() - new Date(l.when).getTime());
      setItems(mapped);
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const collapsed = useMemo(() => {
    const out: Array<{ base: EventItem; count: number; key: string }> = [];
    const keyOf = (e: EventItem) => `${e.type}:${e.metric || ''}:${e.severity || ''}:${e.title}:${e.status || ''}:${e.success ?? ''}`;
    for (const e of items) {
      const key = keyOf(e);
      const last = out[out.length - 1];
      if (last && last.key === key) {
        last.count += 1;
      } else {
        out.push({ base: e, count: 1, key });
      }
    }
    return out;
  }, [items]);

  const renderIcon = (e: EventItem) => {
    const color = e.type === 'anomaly' ? severityColor(e.severity) : typeColor(e.type, e.success);
    if (e.type === 'anomaly') {
      // Triangle alert icon
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" aria-label="anomaly" role="img" style={{ display: 'block' }}>
          <path fill={color} d="M12 5.5L2 20h20L12 5.5zm0 3L19.1 18H4.9L12 8.5zM11 10h2v5h-2v-5zm0 6h2v2h-2v-2z"/>
        </svg>
      );
    }
    if (e.type === 'action') {
      // Bolt icon
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" aria-label="action" role="img" style={{ display: 'block' }}>
          <path fill={color} d="M13 3L4 14h6l-1 7 9-11h-6l1-7z"/>
        </svg>
      );
    }
    // incident: shield-exclamation
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" aria-label="incident" role="img" style={{ display: 'block' }}>
        <path fill={color} d="M12 2l7 3v6c0 5-3.8 9.7-7 11-3.2-1.3-7-6-7-11V5l7-3zm-1 6h2v6h-2V8zm0 8h2v2h-2v-2z"/>
      </svg>
    );
  };

  return (
    <div style={{ marginTop: 8 }}>
      <h3 style={{ marginTop: 0, marginBottom: 8, color: '#cbd5e1' }}>Timeline</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {collapsed.length === 0 ? (
          <li style={{ color: '#94a3b8' }}>No events yet.</li>
        ) : (
          collapsed.map(({ base, count }) => (
            <li key={`${base.type}-${base.id}`} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0',
              borderBottom: '1px solid rgba(148,163,184,0.08)'
            }}>
              <span style={{ color: '#94a3b8', width: 60, fontVariantNumeric: 'tabular-nums' }}>{formatTime(base.when)}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {renderIcon(base)}
                <span style={{
                  fontWeight: 600,
                  color: '#e5e7eb'
                }}>
                  {base.type === 'anomaly' ? base.title : base.type === 'action' ? `${base.title} ${base.success ? '— succeeded' : '— failed'}` : `${base.title} — ${base.status}`}
                </span>
                {base.type === 'anomaly' && base.severity && (
                  <span style={{
                    marginLeft: 6,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${severityColor(base.severity)}20`,
                    color: severityColor(base.severity),
                    fontSize: 12,
                  }}>{base.severity}</span>
                )}
                {count > 1 && (
                  <span style={{
                    marginLeft: 6,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(148,163,184,0.2)',
                    color: '#94a3b8',
                    fontSize: 12,
                  }}>×{count}</span>
                )}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default Timeline;


