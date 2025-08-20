export const API_BASE = (import.meta as any).env?.VITE_API || '/api';

export function getAuthHeaders(): Record<string, string> {
  const token = (typeof window !== 'undefined') ? localStorage.getItem('API_TOKEN') : null;
  return token ? { 'X-API-Token': token } : {};
}

export async function fetchAnomalies() {
  const res = await fetch(`${API_BASE}/anomalies`);
  return res.json();
}

export async function executeAction(name: string, params: Record<string, any> = {}) {
  const res = await fetch(`${API_BASE}/actions/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ name, params }),
  });
  return res.json();
}


