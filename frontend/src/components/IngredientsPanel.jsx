import { useEffect, useState } from 'react';
import { getMyIngredients } from '../services/ingredientServices';
import AddIngredientModal from './AddIngredientModal';

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

const MACROS = ['protein', 'carbs', 'fat'];

// Nutrition is stored per unit, so an item's totals scale with its quantity.
function itemTotal(item, key) {
  return item[key] == null ? null : item[key] * item.quantity;
}

function hasNutrition(item) {
  return item.calories != null || MACROS.some((key) => item[key] != null);
}

function formatAmount(value) {
  return Math.round(value).toLocaleString();
}

function macroTooltip(item) {
  return MACROS.filter((key) => item[key] != null)
    .map((key) => `${key[0].toUpperCase()}${key.slice(1)}: ${formatAmount(itemTotal(item, key))}g`)
    .join(' · ');
}

function pantryTotals(ingredients) {
  const tracked = ingredients.filter(hasNutrition);
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  tracked.forEach((item) => {
    Object.keys(totals).forEach((key) => {
      totals[key] += itemTotal(item, key) ?? 0;
    });
  });
  return { totals, trackedCount: tracked.length };
}

function IngredientsPanel({ currentUser }) {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    getMyIngredients(currentUser.token)
      .then((data) => {
        setIngredients(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load ingredients. Is the backend running?');
        setLoading(false);
      });
  }, [currentUser]);

  function handleAdded(newIngredient) {
    setIngredients((prev) => [...prev, newIngredient]);
    setModalOpen(false);
  }

  const sortedIngredients = [...ingredients].sort(
    (a, b) => daysUntil(a.expirationDate) - daysUntil(b.expirationDate),
  );

  const { totals, trackedCount } = pantryTotals(ingredients);

  return (
    <section className="ingredients-panel">
      <h2>Ingredients</h2>
      {currentUser && !loading && !error && trackedCount > 0 && (
        <div className="pantry-macros" aria-label="Pantry nutrition totals">
          <span><strong>{formatAmount(totals.calories)}</strong> kcal</span>
          <span><strong>{formatAmount(totals.protein)}g</strong> protein</span>
          <span><strong>{formatAmount(totals.carbs)}g</strong> carbs</span>
          <span><strong>{formatAmount(totals.fat)}g</strong> fat</span>
        </div>
      )}
      {!currentUser && <p>Log in to track your ingredients.</p>}
      {currentUser && loading && <p>Loading ingredients...</p>}
      {currentUser && error && <p className="error-text">{error}</p>}
      {currentUser && !loading && !error && (
        <ul className="ingredients-list">
          {sortedIngredients.map((item) => {
            const daysLeft = daysUntil(item.expirationDate);
            return (
              <li key={item.id} className={urgencyClass(daysLeft)}>
                <span>{item.name}</span>
                {hasNutrition(item) && (
                  <span className="ingredient-calories" title={macroTooltip(item)}>
                    {item.calories != null ? `${formatAmount(itemTotal(item, 'calories'))} kcal` : 'Macros'}
                  </span>
                )}
                <span className="ingredient-status">{statusLabel(daysLeft)}</span>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        className="add-ingredient-button"
        disabled={!currentUser}
        onClick={() => setModalOpen(true)}
      >
        + Add Ingredient
      </button>
      {modalOpen && (
        <AddIngredientModal
          token={currentUser.token}
          onClose={() => setModalOpen(false)}
          onAdded={handleAdded}
        />
      )}
    </section>
  );
}

export default IngredientsPanel;
