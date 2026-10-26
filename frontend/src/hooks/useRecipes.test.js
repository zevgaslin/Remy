import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRecipes } from './useRecipes';
import * as recipes from '../services/recipeServices';
import { getMyIngredients } from '../services/ingredientServices';

vi.mock('../services/recipeServices', () => ({
  getAllRecipes: vi.fn(), getRecipeFeed: vi.fn(), searchRecipes: vi.fn(),
  likeRecipe: vi.fn(), dislikeRecipe: vi.fn(), clearRecipePreference: vi.fn(),
  getRecipeReactions: vi.fn(), getFavoriteRecipes: vi.fn(),
}));
vi.mock('../services/ingredientServices', () => ({ getMyIngredients: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  recipes.getAllRecipes.mockResolvedValue([]);
  recipes.getRecipeFeed.mockResolvedValue([]);
  getMyIngredients.mockResolvedValue([]);
  recipes.getRecipeReactions.mockResolvedValue({});
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

  it('saves a reaction before removing the reviewed recipe from the feed', async () => {
    recipes.getRecipeFeed.mockResolvedValue([{ id: 3, name: 'Soup' }]);
    recipes.likeRecipe.mockResolvedValue({ preference: 'LIKE' });
    const { result } = renderHook(() => useRecipes({ token: 'user-token' }));
    await waitFor(() => expect(result.current.recipes).toHaveLength(1));
    await act(async () => { await result.current.setRecipeFeedback(3, 'favorite'); });
    expect(recipes.likeRecipe).toHaveBeenCalledWith('user-token', 3);
    expect(result.current.recipes).toEqual([]);
    expect(result.current.feedback[3]).toBe('favorite');
  });

  it('loads saved likes and dislikes so search results show them', async () => {
    recipes.getRecipeReactions.mockResolvedValue({ 7: 'LIKE', 8: 'DISLIKE' });
    const { result } = renderHook(() => useRecipes({ token: 'user-token' }));
    await waitFor(() => expect(result.current.feedback).toEqual({ 7: 'favorite', 8: 'dislike' }));
    expect(recipes.getRecipeReactions).toHaveBeenCalledWith('user-token');
  });

  it('clears a reaction when the same button is pressed again and keeps search results in place', async () => {
    recipes.getRecipeReactions.mockResolvedValue({ 9: 'LIKE' });
    recipes.searchRecipes.mockResolvedValue([{ recipe: { id: 9, name: 'Chili' }, matchScore: 80 }]);
    recipes.clearRecipePreference.mockResolvedValue({ preference: 'NONE' });
    const { result } = renderHook(() => useRecipes({ token: 'user-token' }));
    await waitFor(() => expect(result.current.feedback[9]).toBe('favorite'));
    await act(async () => { await result.current.search({ query: 'chili' }); });
    await act(async () => { await result.current.setRecipeFeedback(9, 'favorite'); });
    expect(recipes.clearRecipePreference).toHaveBeenCalledWith('user-token', 9);
    expect(recipes.likeRecipe).not.toHaveBeenCalled();
    expect(result.current.feedback[9]).toBeNull();
    expect(result.current.recipes.map(recipe => recipe.id)).toEqual([9]);
  });

  it('shows favorites and drops a recipe from them once it is unliked', async () => {
    recipes.getFavoriteRecipes.mockResolvedValue([{ id: 10, name: 'Pho' }, { id: 11, name: 'Curry' }]);
    recipes.getRecipeReactions.mockResolvedValue({ 10: 'LIKE', 11: 'LIKE' });
    recipes.clearRecipePreference.mockResolvedValue({ preference: 'NONE' });
    const { result } = renderHook(() => useRecipes({ token: 'user-token' }));
    await waitFor(() => expect(result.current.feedback[10]).toBe('favorite'));
    await act(async () => { await result.current.showFavorites(); });
    expect(result.current.showingFavorites).toBe(true);
    expect(result.current.recipes.map(recipe => recipe.name)).toEqual(['Pho', 'Curry']);
    await act(async () => { await result.current.setRecipeFeedback(10, 'favorite'); });
    expect(result.current.recipes.map(recipe => recipe.name)).toEqual(['Curry']);
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
