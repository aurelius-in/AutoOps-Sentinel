import React, { useEffect, useState } from 'react';
import { API_BASE } from '../modules/api';

const Policies: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      const [r, s] = await Promise.all([
        fetch(`${API_BASE}/policies`).then(res => res.json()),
        fetch(`${API_BASE}/policies/suggest`).then(res => res.json()),
      ]);
      setRules(r); setSuggestions(s);
    };
    load();
  }, []);
  return (
    <div>
      <h3>Policies</h3>
      <div>
        <b>Rules</b>
        <ul>
          {rules.map((r, idx) => (<li key={idx}>{r.condition} → {r.action}</li>))}
        </ul>
      </div>
      <div>
        <b>Suggestions</b>
        <ul>
          {suggestions.map((s, idx) => (<li key={idx}>{s.reason} → {s.action}</li>))}
        </ul>
      </div>
    </div>
  );
};

export default Policies;


