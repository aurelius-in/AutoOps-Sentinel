import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../modules/api';

const Forecast: React.FC = () => {
  const [data, setData] = useState<{mean:number[]; lower:number[]; upper:number[]} | null>(null);
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_BASE}/forecast?metric=cpu&horizon=12`);
      setData(await res.json());
    };
    load();
  }, []);
  const { width, height, padding } = { width: 560, height: 180, padding: 24 } as const;
  const chart = useMemo(() => {
    if (!data || !data.mean?.length) return null;
    const n = data.mean.length;
    const all = [...data.lower, ...data.upper].filter((v) => Number.isFinite(v));
    const minV = Math.min(...all);
    const maxV = Math.max(...all);
    const x = (i: number) => padding + (i * (width - 2 * padding)) / Math.max(1, n - 1);
    const y = (v: number) => padding + (height - 2 * padding) * (1 - (v - minV) / Math.max(1e-9, maxV - minV));
    const meanPath = data.mean.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
    const upper = data.upper.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    const lower = data.lower.slice().reverse().map((v, ri) => {
      const i = data.lower.length - 1 - ri;
      return `${x(i)},${y(v)}`;
    }).join(' ');
    const bandPoints = `${upper} ${lower}`;
    return { meanPath, bandPoints, minV, maxV };
  }, [data]);

  return (
    <div style={{ marginTop: 16 }}>
      <h3>Forecast</h3>
      {!data || !chart ? (
        <div>Loading…</div>
      ) : (
        <svg width={width} height={height} role="img" aria-label="Forecast chart">
          <rect x={0} y={0} width={width} height={height} fill="#fff" stroke="#eee" />
          {/* band */}
          <polyline points={chart.bandPoints} fill="rgba(66, 133, 244, 0.15)" stroke="none" />
          {/* mean */}
          <path d={chart.meanPath} fill="none" stroke="#1a73e8" strokeWidth={2} />
          {/* y-axis labels */}
          <text x={8} y={padding} fontSize={10} fill="#666">{chart.maxV.toFixed(1)}</text>
          <text x={8} y={height - padding + 10} fontSize={10} fill="#666">{chart.minV.toFixed(1)}</text>
        </svg>
      )}
    </div>
  );
};

export default Forecast;


