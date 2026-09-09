import { useState, useEffect } from 'react';
import RecipeCard from '../components/recipes';
import { getAllRecipes } from '../services/recipeServices';

function HomePage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    getAllRecipes()
      .then(data => {
        setRecipes(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Could not load data. Is the backend running?');
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error)   return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>My Recipes</h1>
      {recipes.map(recipe => (
        <RecipeCard key={recipe.id} name={recipe.name} instructions={recipe.instructions} />
      ))}
    </div>
  );
}

export default HomePage;
