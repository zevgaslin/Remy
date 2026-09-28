import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchRecipes } from '../services/recipeServices';

// Mock the global fetch function
global.fetch = vi.fn();

describe('recipeServices - searchRecipes', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('includes the "query" parameter in the JSON body when calling the search endpoint', async () => {
    // Setup a fake successful response
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const searchParams = {
      query: 'Tacos',
      ingredients: ['beef', 'cheese'],
      preferences: [],
      requireAllIngredients: false,
      limit: 10
    };

    await searchRecipes(searchParams);

    // Ensure fetch was called once
    expect(fetch).toHaveBeenCalledTimes(1);
    
    // Retrieve the arguments passed to the fetch mock
    const [url, options] = fetch.mock.calls[0];
    
    // Verify it hits the right endpoint
    expect(url).toContain('/recipes/search');
    expect(options.method).toBe('POST');
    
    // Parse the body to ensure 'query' was successfully appended
    const requestBody = JSON.parse(options.body);
    expect(requestBody.query).toBe('Tacos');
    expect(requestBody.ingredients).toEqual(['beef', 'cheese']);
  });
});