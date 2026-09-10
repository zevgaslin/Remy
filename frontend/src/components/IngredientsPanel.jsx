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

  return (
    <section className="ingredients-panel">
      <h2>Expiring Soon</h2>
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
