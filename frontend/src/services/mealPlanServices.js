import { API_BASE } from './apiBase.js';

const PLAN_URL = `${API_BASE}/users/me/meal-plan`;

async function send(url, token, { method = 'GET', body, errorMessage }) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || errorMessage);
  }
  return data;
}

// Returns { meals: [{ date, slotId, recipe }], daySlots: { 'YYYY-MM-DD': [slot, ...] } }.
export function getMealPlan(token) {
  return send(PLAN_URL, token, { errorMessage: 'Could not load your meal plan.' });
}

export function savePlannedMeal(token, date, slotId, recipeId) {
  return send(`${PLAN_URL}/meals/${date}/${encodeURIComponent(slotId)}`, token, {
    method: 'PUT',
    body: { recipeId },
    errorMessage: 'Could not save that meal.',
  });
}

export function removePlannedMeal(token, date, slotId) {
  return send(`${PLAN_URL}/meals/${date}/${encodeURIComponent(slotId)}`, token, {
    method: 'DELETE',
    errorMessage: 'Could not remove that meal.',
  });
}

export function saveDaySlots(token, date, slots) {
  return send(`${PLAN_URL}/days/${date}/slots`, token, {
    method: 'PUT',
    body: slots,
    errorMessage: 'Could not save your meal times.',
  });
}
