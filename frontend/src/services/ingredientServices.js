const API_BASE = 'http://localhost:8080/api';

export async function getAllIngredients() {
  const response = await fetch(`${API_BASE}/ingredients`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ingredients: ${response.status}`);
  }
  return response.json();
}
