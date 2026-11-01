import { useCallback, useEffect, useRef, useState } from 'react';
import { dislikeRecipe, getAllRecipes, getRecipeFeed, likeRecipe, searchRecipes, createRecipe } from '../services/recipeServices';
import { useIngredients } from './useIngredients';
import { EXPIRING_SOON_DAYS, expiringSoonNames } from '../utils/expiration';

/** Recipe data comes from Spring Boot/Supabase; components own only their form and layout. */
export function useRecipes(currentUser, { mode = 'feed' } = {}) {
  const token = currentUser?.token;
  const [recipes, setRecipes] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchActive, setSearchActive] = useState(false);
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
    loadFeed();
    return invalidateRequests;
  }, [loadFeed, invalidateRequests]);

  async function search({ query = '', ingredients = [], preferences = [], requireAllIngredients = false, useCurrentIngredients = false, useExpiringSoon = false, random = false } = {}) {
    const pantrySearch = useCurrentIngredients || requireAllIngredients;
    // Without typed ingredients, the expiring filter scores recipes against the whole pantry.
    const available = pantrySearch || (useExpiringSoon && ingredients.length === 0) ? currentIngredients : ingredients;
    const expiringIngredients = useExpiringSoon ? expiringSoonNames(pantryIngredients) : [];
    if ((pantrySearch || useExpiringSoon) && !token) {
      setError('Log in to filter recipes by your current ingredients.');
      return;
    }
    if (pantrySearch && available.length === 0) {
      setError('Add at least one current ingredient before using that filter.');
      return;
    }
    if (useExpiringSoon && expiringIngredients.length === 0) {
      setError(`Nothing in your pantry expires in the next ${EXPIRING_SOON_DAYS} days.`);
      return;
    }

    if (!random && available.length === 0 && expiringIngredients.length === 0 && preferences.length === 0 && !query.trim()) {
      setError('Enter a search term, an ingredient, or choose a diet.');
      return;
    }
    
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const matches = await searchRecipes({ query: query.trim(), ingredients: available, expiringIngredients, preferences, requireAllIngredients, limit: 50, random });
      if (version !== requestVersion.current) return;
      setRecipes(matches.map(match => ({
        ...(match.recipe || match),
        matchScore: match.matchScore ?? null,
        matchedIngredients: match.matchedIngredients || [],
        missingIngredients: match.missingIngredients || [],
        expiringIngredients: match.expiringIngredients || [],
      })));
      setSearchActive(true);
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
    try {
      if (value === 'favorite') await likeRecipe(token, id);
      else await dislikeRecipe(token, id);
      if (version !== requestVersion.current) return;
      setError(null);
      setFeedback(previous => ({ ...previous, [id]: value }));
      setRecipes(previous => previous.filter(recipe => recipe.id !== id));
    } catch (err) {
      if (version === requestVersion.current) setError(err.message || 'Could not save your recipe reaction.');
    }
  }

  function refresh() {
    setSearchActive(false);
    return loadFeed(0, true, true);
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

  return { recipes, feedback, loading, error, searchActive, search, refresh, setRecipeFeedback, addNewRecipe };
}