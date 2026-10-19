import { useState } from 'react';
import IngredientCamera from './IngredientCamera';
import './AddIngredientModal.css';
import { createIngredient } from '../services/ingredientServices';

const NUTRITION_FIELDS = [
  { key: 'calories', label: 'Calories' },
  { key: 'protein', label: 'Protein (g)' },
  { key: 'carbs', label: 'Carbs (g)' },
  { key: 'fat', label: 'Fat (g)' },
];

// Blank inputs mean "not provided", so send null rather than 0.
function toOptionalNumber(value) {
  return value === '' ? null : Number(value);
}

function AddIngredientModal({ token, onClose, onAdded }) {
  const [activeTab, setActiveTab] = useState('manual');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [nutrition, setNutrition] = useState({ calories: '', protein: '', carbs: '', fat: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const saved = await createIngredient(token, {
        name,
        quantity: Number(quantity),
        unit,
        expirationDate,
        calories: toOptionalNumber(nutrition.calories),
        protein: toOptionalNumber(nutrition.protein),
        carbs: toOptionalNumber(nutrition.carbs),
        fat: toOptionalNumber(nutrition.fat),
      });
      onAdded(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>Add Ingredient</h2>
          <button type="button" className="auth-modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="ingredient-entry-tabs" role="tablist" aria-label="Ingredient entry method">
          {['manual', 'scan'].map((tab) => (
            <button key={tab} type="button" role="tab" id={`ingredient-${tab}-tab`}
              aria-selected={activeTab === tab} aria-controls={`ingredient-${tab}-panel`}
              tabIndex={activeTab === tab ? 0 : -1}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(event) => {
                if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                  event.preventDefault();
                  const next = event.key === 'Home' ? 'manual' : event.key === 'End' ? 'scan' : activeTab === 'manual' ? 'scan' : 'manual';
                  setActiveTab(next);
                  document.getElementById(`ingredient-${next}-tab`)?.focus();
                }
              }}>
              {tab === 'manual' ? 'Manual Entry' : 'Scan Barcode'}
            </button>
          ))}
        </div>
        {activeTab === 'scan' && <div role="tabpanel" id="ingredient-scan-panel" aria-labelledby="ingredient-scan-tab"><IngredientCamera /></div>}
        <div role="tabpanel" id="ingredient-manual-panel" aria-labelledby="ingredient-manual-tab" hidden={activeTab !== 'manual'}>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Name
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Quantity
            <input
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
            />
          </label>
          <label>
            Unit
            <input
              type="text"
              placeholder="e.g. lb, bag, each"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              required
            />
          </label>
          <label>
            Expiration Date
            <input
              type="date"
              value={expirationDate}
              onChange={(event) => setExpirationDate(event.target.value)}
              required
            />
          </label>
          <fieldset className="nutrition-fields">
            <legend>Nutrition per {unit || 'unit'} (optional)</legend>
            {NUTRITION_FIELDS.map(({ key, label }) => (
              <label key={key}>
                {label}
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={nutrition[key]}
                  onChange={(event) => setNutrition((prev) => ({ ...prev, [key]: event.target.value }))}
                />
              </label>
            ))}
          </fieldset>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Ingredient'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}

export default AddIngredientModal;
