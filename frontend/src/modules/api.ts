export const API_BASE = (import.meta as any).env?.VITE_API || '/api';

export async function fetchAnomalies() {
  const res = await fetch(`${API_BASE}/anomalies`);
  return res.json();
}

export async function executeAction(name: string, params: Record<string, any> = {}) {
  const res = await fetch(`${API_BASE}/actions/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, params }),
  });
  return res.json();
}


