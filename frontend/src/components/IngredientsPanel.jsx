import { useState } from 'react';

const MOCK_EXPIRING = [
  { id: 1, name: 'Spinach', daysLeft: -1 },
  { id: 2, name: 'Chicken Breast', daysLeft: 0 },
  { id: 3, name: 'Greek Yogurt', daysLeft: 2 },
  { id: 4, name: 'Bell Peppers', daysLeft: 3 },
];

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
  const [ingredients] = useState(MOCK_EXPIRING);

  return (
    <section className="ingredients-panel">
      <h2>Expiring Soon</h2>
      <ul className="ingredients-list">
        {ingredients.map((item) => (
          <li key={item.id} className={urgencyClass(item.daysLeft)}>
            <span>{item.name}</span>
            <span className="ingredient-status">{statusLabel(item.daysLeft)}</span>
          </li>
        ))}
      </ul>
      <button type="button" className="add-ingredient-button">+ Add Ingredient</button>
    </section>
  );
}

export default IngredientsPanel;
