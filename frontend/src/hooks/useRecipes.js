import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearRecipePreference, createRecipe, dislikeRecipe, getAllRecipes, getFavoriteRecipes, getRecipeFeed,
  getRecipeReactions, likeRecipe, searchRecipes,
} from '../services/recipeServices';
import { useIngredients } from './useIngredients';

const FEEDBACK_BY_PREFERENCE = { LIKE: 'favorite', DISLIKE: 'dislike' };

/** Recipe data comes from Spring Boot/Supabase; components own only their form and layout. */
export function useRecipes(currentUser, { mode = 'feed' } = {}) {
  const token = currentUser?.token;
  const [recipes, setRecipes] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchActive, setSearchActive] = useState(false);
  const [showingFavorites, setShowingFavorites] = useState(false);
  const { ingredients: pantryIngredients } = useIngredients(token);
  const currentIngredients = pantryIngredients.map(item => item.name).filter(Boolean);
  const requestVersion = useRef(0);
  const feedAbort = useRef(null);

  const invalidateRequests = useCallback(() => {
    requestVersion.current++;
    feedAbort.current?.abort();
  }, []);

  const loadFeed = useCallback(async (offset = 0, replace = true, force = false) => {
    const version = ++requestVersion.current;
    feedAbort.current?.abort();
    const controller = new AbortController();
    feedAbort.current = controller;
    setLoading(true);
    setError(null);
    try {
      const data = token && mode === 'feed'
        ? await getRecipeFeed(token, { limit: 10, offset }) : await getAllRecipes({ signal: controller.signal, force });
      if (version === requestVersion.current) {
        setRecipes(previous => replace ? data : [...previous, ...data]);
      }
    } catch (err) {
      if (version === requestVersion.current) setError(err.message || 'Could not load recipes. Is the backend running?');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [token, mode]);

  useEffect(() => {
    setRecipes([]);
    setFeedback({});
    setSearchActive(false);
    setShowingFavorites(false);
    loadFeed();
    return invalidateRequests;
  }, [loadFeed, invalidateRequests]);

  // Saved likes and dislikes, so hearts stay filled across reloads and in search results.
  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    getRecipeReactions(token)
      .then(reactions => {
        if (!active) return;
        const saved = {};
        Object.entries(reactions).forEach(([id, preference]) => {
          if (FEEDBACK_BY_PREFERENCE[preference]) saved[id] = FEEDBACK_BY_PREFERENCE[preference];
        });
        setFeedback(previous => ({ ...saved, ...previous }));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [token]);

  async function search({ query = '', ingredients = [], preferences = [], requireAllIngredients = false, useCurrentIngredients = false, random = false } = {}) {
    const pantrySearch = useCurrentIngredients || requireAllIngredients;
    const available = pantrySearch ? currentIngredients : ingredients;
    if (pantrySearch && !token) {
      setError('Log in to filter recipes by your current ingredients.');
      return;
    }
    if (pantrySearch && available.length === 0) {
      setError('Add at least one current ingredient before using that filter.');
      return;
    }
    
    if (!random && available.length === 0 && preferences.length === 0 && !query.trim()) {
      setError('Enter a search term, an ingredient, or choose a diet.');
      return;
    }
    
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const matches = await searchRecipes({ query: query.trim(), ingredients: available, preferences, requireAllIngredients, limit: 50, random });
      if (version !== requestVersion.current) return;
      setRecipes(matches.map(match => ({
        ...(match.recipe || match),
        matchScore: match.matchScore ?? null,
        matchedIngredients: match.matchedIngredients || [],
        missingIngredients: match.missingIngredients || [],
      })));
      setSearchActive(true);
      setShowingFavorites(false);
    } catch (err) {
      if (version === requestVersion.current) setError(err.message || 'Could not search recipes.');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }

  async function setRecipeFeedback(id, value) {
    if (!token) {
      setError('Please log in to like or dislike recipes.');
      return;
    }
    const version = requestVersion.current;
    // Clicking the active button again clears the reaction.
    const next = feedback[id] === value ? null : value;
    try {
      if (next === null) await clearRecipePreference(token, id);
      else if (next === 'favorite') await likeRecipe(token, id);
      else await dislikeRecipe(token, id);
      if (version !== requestVersion.current) return;
      setError(null);
      setFeedback(previous => ({ ...previous, [id]: next }));
      // The feed only shows unrated recipes and the favorites list only liked ones; search keeps every result.
      const leavesList = showingFavorites ? next !== 'favorite' : !searchActive;
      if (leavesList) setRecipes(previous => previous.filter(recipe => recipe.id !== id));
    } catch (err) {
      if (version === requestVersion.current) setError(err.message || 'Could not save your recipe reaction.');
    }
  }

  function refresh() {
    setSearchActive(false);
    setShowingFavorites(false);
    return loadFeed(0, true, true);
  }

  async function showFavorites() {
    if (!token) {
      setError('Log in to see your favorite recipes.');
      return;
    }
    invalidateRequests();
    const version = requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const favorites = await getFavoriteRecipes(token);
      if (version !== requestVersion.current) return;
      setRecipes(favorites);
      setSearchActive(false);
      setShowingFavorites(true);
    } catch (err) {
      if (version === requestVersion.current) setError(err.message || 'Could not load your favorite recipes.');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }

  async function addNewRecipe(recipeData) {
    if (!token) {
      setError('Please log in to add a recipe.');
      return false;
    }
    setError(null);
    try {
      await createRecipe(recipeData);
      refresh();
      return true;
    } catch (err) {
      setError(err.message || 'Could not create recipe.');
      return false;
    }
  }

  return {
    recipes, feedback, loading, error, searchActive, showingFavorites,
    search, refresh, showFavorites, setRecipeFeedback, addNewRecipe,
  };
}