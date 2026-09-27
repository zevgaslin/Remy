import { useCallback, useEffect, useState } from 'react';
import RecipeCard from './recipes';
import {
  dislikeRecipe,
  getAllRecipes,
  getRecipeFeed,
  likeRecipe,
  searchRecipes,
} from '../services/recipeServices';
import { getMyIngredients } from '../services/ingredientServices';

const DIET_OPTIONS = [
  { value: '', label: 'Any diet' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'dairy-free', label: 'Dairy-free' },
  { value: 'high-protein', label: 'High protein' },
  { value: 'high-fiber', label: 'High fiber' },
];

function RecipesPanel({ currentUser, pantryVersion }) {
  const [recipes, setRecipes] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [diet, setDiet] = useState('');
  const [currentIngredients, setCurrentIngredients] = useState([]);
  const [onlyCurrentIngredients, setOnlyCurrentIngredients] = useState(false);
  const [onlyMakeNow, setOnlyMakeNow] = useState(false);
  const [searchActive, setSearchActive] = useState(false);

  const loadFeed = useCallback(
    async (nextOffset = 0, replace = true) => {
      setLoading(true);
      setError(null);

      try {
        const data = currentUser
          ? await getRecipeFeed(currentUser.token, { limit: 10, offset: nextOffset })
          : await getAllRecipes();

        setRecipes((prev) => (replace ? data : [...prev, ...data]));
      } catch (err) {
        setError(err.message || 'Could not load recipes. Is the backend running?');
      } finally {
        setLoading(false);
      }
    },
    [currentUser],
  );

  useEffect(() => {
    setFeedback({});
    setIngredientQuery('');
    setDiet('');
    setOnlyCurrentIngredients(false);
    setOnlyMakeNow(false);
    setSearchActive(false);
    loadFeed(0, true);
  }, [currentUser, loadFeed]);

  useEffect(() => {
    if (!currentUser) {
      setCurrentIngredients([]);
      return;
    }

    getMyIngredients(currentUser.token)
      .then((data) => {
        setCurrentIngredients(data.map((item) => item.name).filter(Boolean));
      })
      .catch(() => {
        setCurrentIngredients([]);
      });
  }, [currentUser, pantryVersion]);

  async function handleSearch(event) {
    event.preventDefault();
    const typedIngredients = ingredientQuery
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const useCurrentIngredients = onlyCurrentIngredients || onlyMakeNow;
    const ingredients = useCurrentIngredients ? currentIngredients : typedIngredients;

    if (useCurrentIngredients && !currentUser) {
      setError('Log in to filter recipes by your current ingredients.');
      return;
    }

    if (useCurrentIngredients && currentIngredients.length === 0) {
      setError('Add at least one current ingredient before using that filter.');
      return;
    }

    if (ingredients.length === 0 && !diet) {
      setError('Enter at least one ingredient or choose a diet.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const matches = await searchRecipes({
        ingredients,
        preferences: diet ? [{ name: 'diet', value: diet }] : [],
        requireAllIngredients: onlyMakeNow,
        limit: 50,
      });
      setRecipes(
        matches.map((match) => ({
          ...match.recipe,
          matchScore: match.matchScore,
          matchedIngredients: ingredients.length > 0 ? match.matchedIngredients : [],
          missingIngredients: ingredients.length > 0 ? match.missingIngredients : [],
        })),
      );
      setSearchActive(true);
    } catch (err) {
      setError(err.message || 'Could not search recipes.');
    } finally {
      setLoading(false);
    }
  }

  async function clearSearch() {
    setIngredientQuery('');
    setDiet('');
    setOnlyCurrentIngredients(false);
    setOnlyMakeNow(false);
    setSearchActive(false);
    await loadFeed(0, true);
  }

  async function setRecipeFeedback(id, value) {
    if (!currentUser) {
      setError('Please log in to like or dislike recipes.');
      return;
    }

    try {
      if (value === 'favorite') {
        await likeRecipe(currentUser.token, id);
      } else {
        await dislikeRecipe(currentUser.token, id);
      }

      setFeedback((prev) => ({
        ...prev,
        [id]: prev[id] === value ? null : value,
      }));
      setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
    } catch (err) {
      setError(err.message || 'Could not save your recipe reaction.');
    }
  }

  async function refreshFeed() {
    setIngredientQuery('');
    setDiet('');
    setOnlyCurrentIngredients(false);
    setOnlyMakeNow(false);
    setSearchActive(false);
    await loadFeed(0, true);
  }

  return (
    <section className="recipes-panel">
      <div className="recipes-panel-header">
        <div>
          <h2>{searchActive ? 'Recipe Search' : 'Recipes For You'}</h2>
          {searchActive && !loading && (
            <span className="recipe-result-count">
              {recipes.length} {recipes.length === 1 ? 'match' : 'matches'}
            </span>
          )}
        </div>
        <button type="button" className="auth-button" onClick={refreshFeed} disabled={loading}>
          Refresh feed
        </button>
      </div>
      <form className="recipe-search" onSubmit={handleSearch}>
        <label className="recipe-search-field">
          <span>Ingredients</span>
          <input
            type="search"
            value={ingredientQuery}
            onChange={(event) => setIngredientQuery(event.target.value)}
            placeholder="spinach, egg, rice"
          />
        </label>
        <label className="recipe-search-field recipe-diet-field">
          <span>Diet</span>
          <select value={diet} onChange={(event) => setDiet(event.target.value)}>
            {DIET_OPTIONS.map((option) => (
              <option key={option.value || 'any'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="recipe-search-options">
          <label className="recipe-search-check">
            <input
              type="checkbox"
              checked={onlyCurrentIngredients}
              onChange={(event) => setOnlyCurrentIngredients(event.target.checked)}
              disabled={onlyMakeNow}
            />
            <span>Only show recipes with some current ingredients</span>
          </label>
          <label className="recipe-search-check">
            <input
              type="checkbox"
              checked={onlyMakeNow}
              onChange={(event) => {
                setOnlyMakeNow(event.target.checked);
                if (event.target.checked) {
                  setOnlyCurrentIngredients(false);
                }
              }}
            />
            <span>Only show recipes I can make right now</span>
          </label>
        </div>
        <button type="submit" className="recipe-search-submit" disabled={loading}>
          Search
        </button>
        {searchActive && (
          <button
            type="button"
            className="recipe-search-clear"
            aria-label="Clear recipe search"
            title="Clear search"
            onClick={clearSearch}
            disabled={loading}
          >
            ×
          </button>
        )}
      </form>
      {loading && <p>Loading recipes...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && (
        <div className="recipes-list">
          {recipes.length === 0 ? (
            <p>
              {searchActive
                ? 'No recipes match those ingredients and dietary choices.'
                : 'No more recipes right now. Refresh to load another batch.'}
            </p>
          ) : (
            recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                name={recipe.name}
                instructions={recipe.instructions}
                matchScore={recipe.matchScore}
                matchedIngredients={recipe.matchedIngredients}
                missingIngredients={recipe.missingIngredients}
                feedback={feedback[recipe.id]}
                onFavorite={() => setRecipeFeedback(recipe.id, 'favorite')}
                onDislike={() => setRecipeFeedback(recipe.id, 'dislike')}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
}

export default RecipesPanel;
