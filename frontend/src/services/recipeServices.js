import { API_BASE } from './apiBase.js';

const CATALOG_TTL_MS = 30000;
let catalogCache = null;
let catalogPending = null;
let catalogGeneration = 0;

export function invalidateRecipeCache() {
  catalogGeneration++;
  catalogCache = null;
  catalogPending = null;
}

// Abort one consumer without cancelling the shared request for other mounted components.
function withConsumerSignal(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    promise.then(
      value => { signal.removeEventListener('abort', abort); resolve(value); },
      error => { signal.removeEventListener('abort', abort); reject(error); },
    );
  });
}

async function fetchCatalog() {
  const timeout = AbortSignal.timeout(15000);
  try {
    const response = await fetch(`${API_BASE}/recipes`, { signal: timeout });
    if (!response.ok) throw new Error(`Could not load recipes (${response.status}). Please retry.`);
    const recipes = await response.json();
    if (!Array.isArray(recipes)) throw new Error('The server returned an invalid recipe list.');
    return recipes;
  } catch (error) {
    if (timeout.aborted) throw new Error('Loading recipes took too long. Check the backend connection and retry.');
    if (error.name === 'TypeError') throw new Error('Could not reach the backend. Check that it is running and retry.');
    throw error;
  }
}

export async function getAllRecipes({ signal, force = false } = {}) {
  if (signal?.aborted) throw signal.reason;
  if (!force && catalogCache && catalogCache.expires > Date.now()) return catalogCache.data;
  if (!catalogPending) {
    const generation = catalogGeneration;
    const promise = fetchCatalog().then(data => {
      if (generation === catalogGeneration) catalogCache = { data, expires: Date.now() + CATALOG_TTL_MS };
      return data;
    }).finally(() => {
      if (catalogPending === promise) catalogPending = null;
    });
    catalogPending = promise;
  }
  return withConsumerSignal(catalogPending, signal);
}

export async function getRecipeFeed(token, { limit = 10, offset = 0 } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${API_BASE}/recipes/feed?limit=${limit}&offset=${offset}`, {
    headers,
  });
  const data = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(data.error || 'Could not load the recipe feed.');
  }
  return data;
}

export async function getRecipeMatches(token, { limit = 20 } = {}) {
  const response = await fetch(`${API_BASE}/recipes/matches?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(data.error || 'Could not match recipes to your pantry.');
  }
  return data;
}

export async function searchRecipes({
  query = '',
  ingredients = [],
  preferences = [],
  requireAllIngredients = false,
  limit = 20,
} = {}) {
  const response = await fetch(`${API_BASE}/recipes/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, ingredients, preferences, requireAllIngredients, limit }),
  });
  const data = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(data.error || 'Could not search recipes.');
  }
  return data;
}

export async function getDietaryPreferences(token) {
  const response = await fetch(`${API_BASE}/recipes/preferences`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(data.error || 'Could not load dietary preferences.');
  }
  return data;
}

export async function saveDietaryPreferences(token, preferences) {
  const response = await fetch(`${API_BASE}/recipes/preferences`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferences),
  });
  const data = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(data.error || 'Could not save dietary preferences.');
  }
  return data;
}

export async function likeRecipe(token, recipeId) {
  const response = await fetch(`${API_BASE}/recipes/${recipeId}/like`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Could not like recipe.');
  }
  invalidateRecipeCache();
  return data;
}

export async function unlikeRecipe(token, recipeId) {
  const response = await fetch(`${API_BASE}/recipes/${recipeId}/like`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Could not remove favorite.');
  }
  invalidateRecipeCache();
  return data;
}

export async function dislikeRecipe(token, recipeId) {
  const response = await fetch(`${API_BASE}/recipes/${recipeId}/dislike`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Could not dislike recipe.');
  }
  invalidateRecipeCache();
  return data;
}

export async function getRecipePreference(token, recipeId) {
  const response = await fetch(`${API_BASE}/recipes/${recipeId}/preference`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => ({ preference: 'NONE' }));
  if (!response.ok) {
    throw new Error(data.error || 'Could not load recipe preference.');
  }
  return data;
}

export async function createRecipe({ name, instructions }) {
  const response = await fetch(`${API_BASE}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, instructions }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Could not create recipe.');
  }
  invalidateRecipeCache();
  return data;
}

export async function updateRecipe(id, { name, instructions }) {
  const response = await fetch(`${API_BASE}/recipes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, instructions }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Could not update recipe.');
  }
  invalidateRecipeCache();
  return data;
}

export async function deleteRecipe(id) {
  const response = await fetch(`${API_BASE}/recipes/${id}`, {
    method: 'DELETE',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Could not delete recipe.');
  }
  invalidateRecipeCache();
  return data;
}