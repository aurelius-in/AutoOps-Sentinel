import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../modules/api';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Point = { ts: string; value: number };

const MetricsChart: React.FC = () => {
  const [keys, setKeys] = useState<string[]>([]);
  const [metric, setMetric] = useState<string>('cpu');
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    const loadKeys = async () => {
      try {
        const res = await fetch(`${API_BASE}/metrics/keys`);
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          setKeys(data);
          if (!data.includes(metric)) setMetric(data[0]);
          return;
        }
      } catch {}
      // Fallback demo keys when API not available
      const demoKeys = ['cpu', 'error_rate', 'failed_logins', 'latency', 'mem'];
      setKeys(demoKeys);
      if (!demoKeys.includes(metric)) setMetric(demoKeys[0]);
    };
    loadKeys();
  }, []);

  // Demo series generator
  const generateMockSeries = (m: string): Point[] => {
    const length = 120; // ~last 10-15 minutes
    const arr: Point[] = [];
    const now = Date.now();
    for (let i = 0; i < length; i++) {
      const t = (now - (length - i) * 5000).toString();
      const phase = i / 12;
      const noise = (Math.random() - 0.5);
      let value = 0;
      const mm = m.toLowerCase();
      if (mm.includes('cpu')) value = 45 + 20 * Math.sin(phase) + 4 * noise;
      else if (mm.includes('mem')) value = 60 + 10 * Math.cos(phase / 2) + 3 * noise;
      else if (mm.includes('latency')) value = 180 + 80 * Math.abs(Math.sin(phase / 1.5)) + 15 * noise;
      else if (mm.includes('error') && mm.includes('rate')) value = Math.max(0, 1 + 1.5 * Math.abs(Math.sin(phase * 1.8)) + 0.6 * noise);
      else if (mm.includes('failed') && mm.includes('login')) value = Math.max(0, 5 + 10 * Math.max(0, Math.sin(phase * 0.9)) + 3 * noise);
      else value = 10 + 5 * Math.sin(phase) + noise;
      arr.push({ ts: t, value: Number(value.toFixed(2)) });
    }
    return arr;
  };

  useEffect(() => {
    const loadSeries = async () => {
      try {
        const res = await fetch(`${API_BASE}/metrics/recent?metric=${encodeURIComponent(metric)}&minutes=15`);
        const data = await res.json();
        if (Array.isArray(data?.points) && data.points.length) {
          setPoints(data.points);
          return;
        }
      } catch {}
      setPoints(generateMockSeries(metric));
    };
    if (metric) {
      loadSeries();
      const id = setInterval(loadSeries, 5000);
      return () => clearInterval(id);
    }
  }, [metric]);

  const chartData = useMemo(() => points.map((p, i) => ({ idx: i, value: p.value, ts: p.ts })), [points]);

  const toTitle = (s: string) => s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  const formatLabel = (k: string): string => {
    const lk = k.toLowerCase();
    if (lk.includes('cpu')) return 'CPU';
    if (lk.includes('mem')) return 'Mem';
    if (lk.includes('latency') || lk.includes('p95')) return 'Latency';
    if ((lk.includes('error') && lk.includes('rate')) || lk === 'error_rate') return 'Error\nRate';
    if ((lk.includes('failed') && lk.includes('login')) || lk === 'failed_logins') return 'Failed\nLogins';
    return toTitle(k);
  };
  const isTall = (k: string): boolean => {
    const lk = k.toLowerCase();
    return lk.includes('cpu') || lk.includes('mem') || lk.includes('latency') || lk.includes('p95');
  };
  const metricHint = (k: string): string => {
    const lk = k.toLowerCase();
    if (lk.includes('cpu')) return 'CPU usage over time';
    if (lk.includes('mem')) return 'Memory usage trend';
    if (lk.includes('latency') || lk.includes('p95')) return 'Request latency (ms), lower is better';
    if (lk.includes('error') && lk.includes('rate')) return 'Error rate (%) trend';
    if (lk.includes('failed') && lk.includes('login')) return 'Failed login attempts';
    return toTitle(k);
  };

  return (
    <div style={{ marginTop: 0 }}>
      <div role="group" aria-label="Metric" style={{ marginBottom: 4, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => setMetric(k)}
            style={{
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: 12,
              border: `1px solid ${k === metric ? '#0ea5e9' : 'rgba(148,163,184,0.25)'}`,
              background: k === metric ? 'linear-gradient(90deg, rgba(14,165,233,0.25), rgba(2,132,199,0.15))' : 'rgba(255,255,255,0.02)',
              color: k === metric ? '#e5e7eb' : '#94a3b8',
              fontWeight: 700,
              letterSpacing: 0.3,
              boxShadow: k === metric ? '0 6px 16px rgba(14,165,233,0.25)' : 'inset 0 0 0 1px rgba(255,255,255,0.02)',
              backdropFilter: 'blur(6px)',
              whiteSpace: 'pre-line',
              lineHeight: 1.15,
              minHeight: (formatLabel(k).includes('\n') || isTall(k)) ? 48 : 36
            }}
          >
            {formatLabel(k)}
          </button>
        ))}
      </div>
      {chartData.length === 0 ? (
        <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 10, right: 4, bottom: 10, left: 6 }}>
            <XAxis
              dataKey="ts"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(t) => {
                const d = new Date(Number(t) || Date.parse(String(t)) || Date.now());
                return `${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
              }}
              stroke="#475569"
            />
            <YAxis orientation="right" width={40} domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: '#94a3b8', fontSize: 12 }} stroke="#475569" />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.25)', color: '#e5e7eb' }} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e5e7eb' }} />
            <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
      <div style={{ marginTop: 2, fontSize: 13, color: '#cbd5e1' }}>{metricHint(metric)}</div>
    </div>
  );
};

export default MetricsChart;


