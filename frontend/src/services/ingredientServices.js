import { API_BASE } from './apiBase.js';

const PANTRY_TTL_MS = 30000;
let pantryCache = null;

export function invalidateIngredientCache(token) {
  if (pantryCache?.token === token) pantryCache = null;
}

export function getMyIngredients(token) {
  if (pantryCache?.token === token && pantryCache.expires > Date.now()) {
    return pantryCache.promise;
  }
  const entry = { token, expires: Infinity, promise: null };
  entry.promise = fetch(`${API_BASE}/ingredients`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(async response => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not load ingredients.');
    entry.expires = Date.now() + PANTRY_TTL_MS;
    return data;
  }).catch(error => {
    if (pantryCache === entry) pantryCache = null;
    throw error;
  });
  pantryCache = entry;
  return entry.promise;
}

export async function createIngredient(token, { name, quantity, unit, expirationDate, calories, protein, carbs, fat }) {
  const response = await fetch(`${API_BASE}/ingredients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, quantity, unit, expirationDate, calories, protein, carbs, fat }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Could not add ingredient.');
  }
  invalidateIngredientCache(token);
  return data;
}

export async function updateIngredient(token, id, { name, quantity, unit, expirationDate, calories, protein, carbs, fat }) {
  const response = await fetch(`${API_BASE}/ingredients/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, quantity, unit, expirationDate, calories, protein, carbs, fat }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Could not update ingredient.');
  }
  invalidateIngredientCache(token);
  return data;
}

export async function deleteIngredient(token, id) {
  const response = await fetch(`${API_BASE}/ingredients/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Could not delete ingredient.');
  }
  invalidateIngredientCache(token);
  return data;
}
