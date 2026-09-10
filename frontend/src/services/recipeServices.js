const API_BASE = 'http://localhost:8080/api';

export async function getAllRecipes() {
  const response = await fetch(`${API_BASE}/recipes`);
  if (!response.ok) {
    throw new Error(`Failed to fetch recipes: ${response.status}`);
  }
  return response.json();
}
