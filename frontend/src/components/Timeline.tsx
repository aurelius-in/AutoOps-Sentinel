import React, { useEffect, useState } from 'react';
import { API_BASE } from '../modules/api';

type EventItem = { id: string; type: 'anomaly'|'action'; when: string; title: string };

const Timeline: React.FC = () => {
  const [items, setItems] = useState<EventItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const [anomsRes, actsRes] = await Promise.all([
        fetch(`${API_BASE}/anomalies`),
        fetch(`${API_BASE}/actions`),
      ]);
      const anoms = await anomsRes.json();
      const acts = await actsRes.json();
      const mapped: EventItem[] = [
        ...anoms.map((a: any) => ({ id: a.id, type: 'anomaly', when: a.created_at, title: `${a.metric} ${a.severity} (score ${a.score.toFixed?.(2) ?? a.score})` })),
        ...acts.map((x: any) => ({ id: x.id, type: 'action', when: x.created_at, title: `${x.name} ${x.success ? '✓' : '✗'}` })),
      ].sort((l, r) => (new Date(r.when).getTime() - new Date(l.when).getTime()));
      setItems(mapped);
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ marginTop: 16 }}>
      <h3>Timeline</h3>
      <ul>
        {items.length === 0 ? <li>No events yet.</li> : items.map((i) => (
          <li key={`${i.type}-${i.id}`}>[{new Date(i.when).toLocaleTimeString()}] {i.type.toUpperCase()}: {i.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default Timeline;


