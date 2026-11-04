import { API_BASE } from './apiBase.js';

const LIST_URL = `${API_BASE}/users/me/grocery-list`;

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

// Returns { from, to, plannedMeals, items: [{ key, name, amount, have, recipes, checked }] }.
export function getGroceryList(token, from, to) {
  const query = new URLSearchParams({ from, to });
  return send(`${LIST_URL}?${query}`, token, { errorMessage: 'Could not load your grocery list.' });
}

export function setGroceryItemChecked(token, key, checked) {
  return send(`${LIST_URL}/checked`, token, {
    method: 'PUT',
    body: { key, checked },
    errorMessage: 'Could not update that grocery item.',
  });
}

export function clearCheckedGroceryItems(token) {
  return send(`${LIST_URL}/checked`, token, {
    method: 'DELETE',
    errorMessage: 'Could not clear your checked items.',
  });
}
