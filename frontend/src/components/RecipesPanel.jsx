import { useEffect, useState } from 'react';
import RecipeCard from './recipes';
import { getAllRecipes } from '../services/recipeServices';

function RecipesPanel() {
  const [recipes, setRecipes] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAllRecipes()
      .then((data) => {
        setRecipes(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load recipes. Is the backend running?');
        setLoading(false);
      });
  }, []);

  function setRecipeFeedback(id, value) {
    setFeedback((prev) => ({
      ...prev,
      [id]: prev[id] === value ? null : value,
    }));
  }

  return (
    <section className="recipes-panel">
      <h2>Recipes For You</h2>
      {loading && <p>Loading recipes...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && (
        <div className="recipes-list">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              name={recipe.name}
              instructions={recipe.instructions}
              feedback={feedback[recipe.id]}
              onFavorite={() => setRecipeFeedback(recipe.id, 'favorite')}
              onDislike={() => setRecipeFeedback(recipe.id, 'dislike')}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default RecipesPanel;
