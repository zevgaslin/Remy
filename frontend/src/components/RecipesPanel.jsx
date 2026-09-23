import { useCallback, useEffect, useState } from 'react';
import RecipeCard from './recipes';
import { dislikeRecipe, getAllRecipes, getRecipeFeed, likeRecipe } from '../services/recipeServices';

function RecipesPanel({ currentUser }) {
  const [recipes, setRecipes] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);

  const loadFeed = useCallback(
    async (nextOffset = 0, replace = true) => {
      setLoading(true);
      setError(null);

      try {
        const data = currentUser
          ? await getRecipeFeed(currentUser.token, { limit: 10, offset: nextOffset })
          : await getAllRecipes();

        setRecipes((prev) => (replace ? data : [...prev, ...data]));
        setOffset(nextOffset + data.length);
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
    setOffset(0);
    loadFeed(0, true);
  }, [currentUser, loadFeed]);

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
    await loadFeed(offset, true);
  }

  return (
    <section className="recipes-panel">
      <div className="recipes-panel-header">
        <h2>Recipes For You</h2>
        <button type="button" className="auth-button" onClick={refreshFeed} disabled={loading}>
          Refresh feed
        </button>
      </div>
      {loading && <p>Loading recipes...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && (
        <div className="recipes-list">
          {recipes.length === 0 ? (
            <p>No more recipes right now. Refresh to load another batch.</p>
          ) : (
            recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                name={recipe.name}
                instructions={recipe.instructions}
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
