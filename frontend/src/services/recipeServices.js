import { API_BASE } from './apiBase.js';

export async function getAllRecipes() {
  const response = await fetch(`${API_BASE}/recipes`);
  if (!response.ok) {
    throw new Error(`Failed to fetch recipes: ${response.status}`);
  }
  return response.json();
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
  return data;
}
