import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../modules/api';

type Point = { ts: string; value: number };

const MetricsChart: React.FC = () => {
  const [keys, setKeys] = useState<string[]>([]);
  const [metric, setMetric] = useState<string>('cpu');
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    const loadKeys = async () => {
      const res = await fetch(`${API_BASE}/metrics/keys`);
      const data = await res.json();
      setKeys(data);
      if (data?.length && !data.includes(metric)) setMetric(data[0]);
    };
    loadKeys();
  }, []);

  useEffect(() => {
    const loadSeries = async () => {
      const res = await fetch(`${API_BASE}/metrics/recent?metric=${encodeURIComponent(metric)}&minutes=15`);
      const data = await res.json();
      setPoints(data.points || []);
    };
    if (metric) {
      loadSeries();
      const id = setInterval(loadSeries, 5000);
      return () => clearInterval(id);
    }
  }, [metric]);

  const { width, height, padding } = { width: 560, height: 180, padding: 24 } as const;
  const path = useMemo(() => {
    if (!points?.length) return '';
    const values = points.map(p => p.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const n = points.length;
    const x = (i: number) => padding + (i * (width - 2 * padding)) / Math.max(1, n - 1);
    const y = (v: number) => padding + (height - 2 * padding) * (1 - (v - minV) / Math.max(1e-9, maxV - minV));
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.value)}`).join(' ');
  }, [points]);

  return (
    <div style={{ marginTop: 16 }}>
      <h3>Metrics</h3>
      <div style={{ marginBottom: 8 }}>
        <label>
          Metric:&nbsp;
          <select value={metric} onChange={(e) => setMetric(e.target.value)}>
            {keys.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
      </div>
      <svg width={width} height={height} role="img" aria-label="Metrics chart">
        <rect x={0} y={0} width={width} height={height} fill="#fff" stroke="#eee" />
        {path ? <path d={path} fill="none" stroke="#0f9d58" strokeWidth={2} /> : <text x={16} y={32} fill="#666">No data</text>}
      </svg>
    </div>
  );
};

export default MetricsChart;


