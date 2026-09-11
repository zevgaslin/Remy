import { API_BASE } from './apiBase.js';

export async function getMyIngredients(token) {
  const response = await fetch(`${API_BASE}/ingredients`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Could not load ingredients.');
  }
  return data;
}

export async function createIngredient(token, { name, quantity, unit, expirationDate }) {
  const response = await fetch(`${API_BASE}/ingredients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, quantity, unit, expirationDate }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Could not add ingredient.');
  }
  return data;
}
