import React, { useState } from 'react';
import { API_BASE, getAuthHeaders } from '../modules/api';

type PlanStep = { description: string; action?: string; params?: Record<string, any> };

const PlanPanel: React.FC = () => {
  const [steps, setSteps] = useState<PlanStep[]>([]);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const propose = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/agent/plan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectives: ['stabilize'], context: { deployment: 'myapp', replicas: 2 } })
      });
      const data = await res.json();
      setSteps(data.steps || []);
      setExplanation(data.explanation || '');
    } finally {
      setLoading(false);
    }
  };

  const execute = async (step: PlanStep) => {
    if (!step.action) return;
    await fetch(`${API_BASE}/actions/execute`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ name: step.action, params: step.params || {} })
    });
  };

  const executeAll = async () => {
    if (steps.length === 0) return;
    await fetch(`${API_BASE}/agent/execute_plan`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ steps })
    });
  };

  return (
    <div>
      <h3>Agent Plan</h3>
      <button onClick={propose} disabled={loading}>{loading ? 'Thinking…' : 'Propose Plan'}</button>
      {steps.length > 0 && <button style={{ marginLeft: 8 }} onClick={executeAll}>Execute All</button>}
      {explanation && <p style={{ marginTop: 8 }}>{explanation}</p>}
      <ol>
        {steps.map((s, idx) => (
          <li key={idx}>
            {s.description} {s.action && <button style={{ marginLeft: 8 }} onClick={() => execute(s)}>Execute</button>}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default PlanPanel;


