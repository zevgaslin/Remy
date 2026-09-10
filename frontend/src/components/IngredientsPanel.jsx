import { useEffect, useState } from 'react';
import { getAllIngredients } from '../services/ingredientServices';

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function statusLabel(daysLeft) {
  if (daysLeft < 0) return 'Expired';
  if (daysLeft === 0) return 'Expires today';
  return `Expires in ${daysLeft}d`;
}

function urgencyClass(daysLeft) {
  if (daysLeft <= 0) return 'urgent';
  if (daysLeft <= 3) return 'soon';
  return '';
}

function IngredientsPanel() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAllIngredients()
      .then((data) => {
        setIngredients(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load ingredients. Is the backend running?');
        setLoading(false);
      });
  }, []);

  return (
    <section className="ingredients-panel">
      <h2>Expiring Soon</h2>
      {loading && <p>Loading ingredients...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && (
        <ul className="ingredients-list">
          {ingredients.map((item) => {
            const daysLeft = daysUntil(item.expirationDate);
            return (
              <li key={item.id} className={urgencyClass(daysLeft)}>
                <span>{item.name}</span>
                <span className="ingredient-status">{statusLabel(daysLeft)}</span>
              </li>
            );
          })}
        </ul>
      )}
      <button type="button" className="add-ingredient-button">+ Add Ingredient</button>
    </section>
  );
}

export default IngredientsPanel;
