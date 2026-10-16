import { API_BASE } from './apiBase.js';

export async function getNutritionGoals(token) {
  const response = await fetch(`${API_BASE}/users/me/goals`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Could not load your nutrition goals.');
  }
  return data;
}

export async function saveNutritionGoals(token, { calories, protein, carbs, fat }) {
  const response = await fetch(`${API_BASE}/users/me/goals`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ calories, protein, carbs, fat }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Could not save your nutrition goals.');
  }
  return data;
}
