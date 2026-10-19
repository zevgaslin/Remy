import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRecipes } from './useRecipes';
import * as recipes from '../services/recipeServices';
import { getMyIngredients } from '../services/ingredientServices';

vi.mock('../services/recipeServices', () => ({
  getAllRecipes: vi.fn(), getRecipeFeed: vi.fn(), searchRecipes: vi.fn(),
  likeRecipe: vi.fn(), unlikeRecipe: vi.fn(), dislikeRecipe: vi.fn(),
}));
vi.mock('../services/ingredientServices', () => ({ getMyIngredients: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  recipes.getAllRecipes.mockResolvedValue([]);
  recipes.getRecipeFeed.mockResolvedValue([]);
  getMyIngredients.mockResolvedValue([]);
});

describe('useRecipes', () => {
  it('loads guest data and lets a failed request be retried', async () => {
    recipes.getAllRecipes.mockRejectedValueOnce(new Error('Backend unavailable'));
    recipes.getAllRecipes.mockResolvedValueOnce([{ id: 1, name: 'Pasta' }]);
    const { result } = renderHook(() => useRecipes());
    await waitFor(() => expect(result.current.error).toBe('Backend unavailable'));
    expect(result.current.loading).toBe(false);
    await act(async () => { await result.current.refresh(); });
    expect(result.current.recipes).toEqual([{ id: 1, name: 'Pasta' }]);
    expect(result.current.error).toBeNull();
  });

  it('searches using the signed-in pantry and preserves a zero match score', async () => {
    getMyIngredients.mockResolvedValue([{ name: 'Garlic' }]);
    recipes.searchRecipes.mockResolvedValue([{ recipe: { id: 2, name: 'Garlic Pasta' }, matchScore: 0, missingIngredients: ['Pasta'] }]);
    const { result } = renderHook(() => useRecipes({ token: 'user-token' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.search({ query: '  pasta  ', useCurrentIngredients: true }); });
    expect(recipes.getRecipeFeed).toHaveBeenCalledWith('user-token', { limit: 10, offset: 0 });
    expect(recipes.searchRecipes).toHaveBeenCalledWith(expect.objectContaining({ query: 'pasta', ingredients: ['Garlic'] }));
    expect(result.current.recipes[0]).toMatchObject({ name: 'Garlic Pasta', matchScore: 0, missingIngredients: ['Pasta'] });
    expect(result.current.searchActive).toBe(true);
  });

  it('saves a favorite and keeps the recipe in the current list', async () => {
    recipes.getRecipeFeed.mockResolvedValue([{ id: 3, name: 'Soup' }]);
    recipes.likeRecipe.mockResolvedValue({ preference: 'LIKE' });
    const { result } = renderHook(() => useRecipes({ token: 'user-token' }));
    await waitFor(() => expect(result.current.recipes).toHaveLength(1));
    await act(async () => { await result.current.setRecipeFeedback(3, 'favorite'); });
    expect(recipes.likeRecipe).toHaveBeenCalledWith('user-token', 3);
    expect(result.current.recipes).toEqual([{ id: 3, name: 'Soup' }]);
    expect(result.current.feedback[3]).toBe('favorite');
    await act(async () => { await result.current.setRecipeFeedback(3, 'favorite'); });
    expect(recipes.unlikeRecipe).toHaveBeenCalledWith('user-token', 3);
    expect(result.current.feedback[3]).toBeNull();
    expect(result.current.recipes).toEqual([{ id: 3, name: 'Soup' }]);
  });

  it('ignores old account requests that finish after switching users', async () => {
    let finishOld;
    recipes.getRecipeFeed.mockImplementation(token => token === 'old'
      ? new Promise(resolve => { finishOld = resolve; })
      : Promise.resolve([{ id: 4, name: 'New user feed' }]));
    const { result, rerender } = renderHook(({ user }) => useRecipes(user), { initialProps: { user: { token: 'old' } } });
    rerender({ user: { token: 'new' } });
    await waitFor(() => expect(result.current.recipes[0]?.name).toBe('New user feed'));
    await act(async () => { finishOld([{ id: 5, name: 'Old user feed' }]); });
    expect(result.current.recipes).toEqual([{ id: 4, name: 'New user feed' }]);
  });
});
