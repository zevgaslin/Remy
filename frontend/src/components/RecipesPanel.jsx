import { useEffect, useState } from 'react';
import RecipeCard from './recipes';
import { useRecipes } from '../hooks/useRecipes';

const DIET_OPTIONS = [
  { value: '', label: 'Any diet' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'dairy-free', label: 'Dairy-free' },
  { value: 'high-protein', label: 'High protein' },
  { value: 'high-fiber', label: 'High fiber' },
];

function RecipesPanel({ currentUser }) {
  const { recipes, feedback, loading, error, searchActive, search, refresh, setRecipeFeedback } = useRecipes(currentUser);
  const [recipeQuery, setRecipeQuery] = useState('');
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [diet, setDiet] = useState('');
  const [onlyCurrentIngredients, setOnlyCurrentIngredients] = useState(false);
  const [onlyMakeNow, setOnlyMakeNow] = useState(false);

  function resetFilters() {
    setRecipeQuery('');
    setIngredientQuery('');
    setDiet('');
    setOnlyCurrentIngredients(false);
    setOnlyMakeNow(false);
  }

  useEffect(() => { resetFilters(); }, [currentUser?.token]);

  function handleSearch(event) {
    event.preventDefault();
    search({
      query: recipeQuery,
      ingredients: ingredientQuery.split(',').map(value => value.trim()).filter(Boolean),
      preferences: diet ? [{ name: 'diet', value: diet }] : [],
      requireAllIngredients: onlyMakeNow,
      useCurrentIngredients: onlyCurrentIngredients,
    });
  }

  function refreshFeed() {
    resetFilters();
    return refresh();
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

      <form 
        className="recipe-search" 
        onSubmit={handleSearch} 
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <div style={{ display: 'flex', width: '100%' }}>
          <label className="recipe-search-field" style={{ flex: 1, width: '100%', margin: 0 }}>
            <span>Search Recipes</span>
            <input
              type="search"
              value={recipeQuery}
              onChange={(event) => setRecipeQuery(event.target.value)}
              placeholder="e.g. Chicken Alfredo, Tacos..."
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'flex-end' }}>
          <label className="recipe-search-field" style={{ flex: 1, margin: 0 }}>
            <span>Ingredients</span>
            <input
              type="search"
              value={ingredientQuery}
              onChange={(event) => setIngredientQuery(event.target.value)}
              placeholder="spinach, egg, rice"
            />
          </label>

          <label className="recipe-search-field recipe-diet-field" style={{ minWidth: '150px', margin: 0 }}>
            <span>Diet</span>
            <select value={diet} onChange={(event) => setDiet(event.target.value)}>
              {DIET_OPTIONS.map((option) => (
                <option key={option.value || 'any'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="recipe-search-submit" disabled={loading} style={{ margin: 0, height: '100%' }}>
              Search
            </button>
            {searchActive && (
              <button
                type="button"
                className="recipe-search-clear"
                aria-label="Clear recipe search"
                title="Clear search"
                onClick={refreshFeed}
                disabled={loading}
                style={{ margin: 0, height: '100%' }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="recipe-search-options" style={{ margin: 0 }}>
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
      </form>

      {loading && <p>Loading recipes...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && (
        <div className="recipes-list">
          {recipes.length === 0 ? (
            <p>
              {searchActive
                ? 'No recipes match your search criteria.'
                : 'No more recipes right now. Refresh to load another batch.'}
            </p>
          ) : (
            recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
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