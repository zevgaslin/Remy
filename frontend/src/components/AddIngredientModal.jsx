import { useState } from 'react';
import BarcodeScanner from './BarcodeScanner';
import { packageQuantity } from '../utils/packageQuantity';
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
  const [scannedProduct, setScannedProduct] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function applyProduct(product) {
    setName(product.name || '');
    const packageAmount = packageQuantity(product.packageSize, product.basisUnit);
    setQuantity(packageAmount ? String(packageAmount.quantity) : '');
    setUnit(product.basisUnit || packageAmount?.unit || '');
    setNutrition(Object.fromEntries(NUTRITION_FIELDS.map(({ key }) => {
      const value = product.nutritionPer100?.[key];
      return [key, typeof value === 'number' && Number.isFinite(value) && value >= 0 ? String(Number((value / 100).toFixed(8))) : ''];
    })));
    setScannedProduct({ ...product, basisUnit: product.basisUnit || packageAmount?.unit || null, hasPackageAmount: !!packageAmount });
    setError(null);
    setActiveTab('manual');
  }

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
      <div className="auth-modal" role="dialog" aria-modal="true" aria-label="Add Ingredient" onClick={(event) => event.stopPropagation()}>
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
        {activeTab === 'scan' && <div role="tabpanel" id="ingredient-scan-panel" aria-labelledby="ingredient-scan-tab"><BarcodeScanner token={token} onProduct={applyProduct} /></div>}
        <div role="tabpanel" id="ingredient-manual-panel" aria-labelledby="ingredient-manual-tab" hidden={activeTab !== 'manual'}>
        {scannedProduct && <aside className="barcode-product-note" role="status">
          <strong>Food found{scannedProduct.brand ? ` · ${scannedProduct.brand}` : ''}</strong>
          <p>Review the name and nutrition against your label. Values were imported per 100 g or 100 ml and converted to per {unit || 'g / ml'}. Enter how many {unit || 'g / ml'} you have.</p>
          {scannedProduct.packageSize && <p>Package: {scannedProduct.packageSize}</p>}
          <p>{scannedProduct.hasPackageAmount ? 'Quantity starts with the full package size. Edit it to the amount remaining if the package is partially used.' : 'Package quantity could not be determined for this nutrition unit. Enter the amount you have.'}</p>
          {scannedProduct.servingSize && <p>Label serving: {scannedProduct.servingSize}</p>}
          {!scannedProduct.basisUnit && <p>Choose whether the nutrition label is per 100 g or per 100 ml below.</p>}
          {NUTRITION_FIELDS.some(({key}) => scannedProduct.nutritionPer100?.[key] == null) && <p>Some nutrition values are missing. Blank fields stay unknown; fill them from the label if available.</p>}
          <a href={scannedProduct.sourceUrl} target="_blank" rel="noreferrer">Source: Open Food Facts (ODbL)</a>
          <button type="button" onClick={() => { setScannedProduct(null); setUnit(''); setQuantity('1'); setNutrition({ calories: '', protein: '', carbs: '', fat: '' }); }}>Use a different unit and enter nutrition manually</button>
        </aside>}
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
            {scannedProduct ? <select value={unit} onChange={event => { setUnit(event.target.value); setQuantity(''); }} required>
              <option value="">Choose the nutrition label basis</option>
              <option value="g">g — label nutrition per 100 g</option>
              <option value="ml">ml — label nutrition per 100 ml</option>
            </select> : <input type="text" placeholder="e.g. lb, bag, each" value={unit}
              onChange={event => setUnit(event.target.value)} required />}
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
