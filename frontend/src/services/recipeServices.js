import { API_BASE } from './apiBase.js';

export async function getAllRecipes() {
  const response = await fetch(`${API_BASE}/recipes`);
  if (!response.ok) {
    throw new Error(`Failed to fetch recipes: ${response.status}`);
  }
  return response.json();
}
