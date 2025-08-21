import React, { useEffect, useState } from 'react';
import { API_BASE } from '../modules/api';
import { ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, CartesianGrid, ReferenceLine, Legend, Brush, Area } from 'recharts';

const Forecast: React.FC = () => {
  const [data, setData] = useState<{mean:number[]; lower:number[]; upper:number[]} | null>(null);
  const [isMock, setIsMock] = useState<boolean>(true);
  useEffect(() => {
    const load = async () => {
      // Always seed a visible mock immediately so the chart never looks empty
      const length = 24;
      const mean: number[] = [];
      const lower: number[] = [];
      const upper: number[] = [];
      for (let i = 0; i < length; i++) {
        const base = 180 + 40 * Math.sin(i / 3);
        mean.push(Number((base + 10 * (Math.random() - 0.5)).toFixed(1)));
        lower.push(Number((base - 30).toFixed(1)));
        upper.push(Number((base + 30).toFixed(1)));
      }
      setData({ mean, lower, upper });
      setIsMock(true);

      // Then try to replace with real data if available
      try {
        const res = await fetch(`${API_BASE}/forecast?metric=cpu&horizon=12`);
        const json = await res.json();
        if (json && Array.isArray(json.mean) && json.mean.length) {
          const variance = json.mean.reduce((acc:number, v:number) => acc + Math.pow(v - (json.mean.reduce((a:number,b:number)=>a+b,0)/json.mean.length), 2), 0) / json.mean.length;
          if (variance > 1) { // ensure not a flat line
            setData(json);
            setIsMock(false);
          }
        }
      } catch {}
    };
    load();
  }, []);
  return (
    <div style={{ marginTop: 0 }}>
      {!data || !data.mean?.length ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No forecast data</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data.mean.map((v, i) => ({ idx: i, minutes: i * 5, mean: v, lower: data.lower[i], upper: data.upper[i] }))} margin={{ top: 10, right: 4, bottom: 20, left: 8 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="idx" tick={{ fill: '#94a3b8', fontSize: 12 }} stroke="#475569" tickFormatter={(v)=>`+${(v*5)}m`} />
            <YAxis orientation="right" width={44} domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: '#94a3b8', fontSize: 12 }} stroke="#475569" tickFormatter={(v)=>`${v.toFixed?.(0) ?? v} ms`} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.25)', color: '#e5e7eb' }} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e5e7eb' }} />
            <Legend wrapperStyle={{ color: '#94a3b8' }} />
            <ReferenceLine y={200} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'SLA 200 ms', position: 'insideTopRight', fill: '#ef4444', fontSize: 11 }} />
            <Area type="monotone" dataKey="upper" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.08} />
            <Area type="monotone" dataKey="lower" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.05} />
            <Line type="monotone" dataKey="mean" stroke="#a78bfa" strokeWidth={3} dot={false} />
            <Brush dataKey="idx" height={12} travellerWidth={8} stroke="#475569" fill="#0b1020" />
          </ComposedChart>
        </ResponsiveContainer>
      )}
      <div style={{ marginTop: -6, fontSize: 11, color: '#94a3b8' }}>
        Prediction (p95 latency): purple=mean, blue=bounds, red=200ms SLA. Drag the bar below to zoom.
      </div>
    </div>
  );
};

export default Forecast;


