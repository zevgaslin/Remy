import { useState } from 'react';
import { NUTRIENTS } from '../utils/nutritionGoals';
import { useSupplements } from '../hooks/useSupplements';
import { collectSupplementEffects, getSupplementNutritionTotals } from '../services/supplementServices';
import GoalPresetPicker from './GoalPresetPicker';

function toForm(goals) {
  return Object.fromEntries(NUTRIENTS.map(({ key }) => [key, String(goals[key])]));
}

function validate(form) {
  for (const { key, label, min, max, unit } of NUTRIENTS) {
    const value = Number(form[key]);
    if (form[key] === '' || !Number.isInteger(value) || value < min || value > max) {
      return `${label} must be a whole number from ${min} to ${max} ${unit}.`;
    }
  }
  return null;
}

function NutritionGoalsCard({ currentUser, goals, loadError, onSave }) {
  const { supplements } = useSupplements(currentUser);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [presetNote, setPresetNote] = useState('');

  const goalSupplements = supplements.filter((s) => s.addToGoals);
  const supplementEffects = collectSupplementEffects(supplements, { onlyGoals: true });
  const supplementMacros = getSupplementNutritionTotals(supplements);
  const hasSupplementMacros = Object.values(supplementMacros).some((v) => v > 0);

  function startEditing() {
    setForm(toForm(goals));
    setError('');
    setPresetNote('');
  }

  function applyPreset(presetGoals, note) {
    setForm(toForm(presetGoals));
    setError('');
    setPresetNote(note);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const problem = validate(form);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    try {
      await onSave(Object.fromEntries(NUTRIENTS.map(({ key }) => [key, Number(form[key])])));
      setForm(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="goals-card" aria-labelledby="goals-title">
      <div className="goals-card-header">
        <h2 id="goals-title">Daily goals</h2>
        {currentUser && !form && (
          <button type="button" className="goals-edit-button" onClick={startEditing}>
            Edit goals
          </button>
        )}
        {!currentUser && <span className="goals-hint">Log in to set your own goals.</span>}
      </div>

      {loadError && <p className="error-text">{loadError}</p>}

      {form ? (
        <form className="goals-form" onSubmit={handleSubmit} noValidate>
          <GoalPresetPicker onApply={applyPreset} />
          {presetNote && (
            <p className="goal-presets-applied" role="status">
              {presetNote} Adjust anything below, then save.
            </p>
          )}
          {NUTRIENTS.map(({ key, label, unit, min, max }) => (
            <label key={key} className="goals-field">
              <span>
                {label} ({unit})
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                step={1}
                value={form[key]}
                onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
              />
            </label>
          ))}
          {error && <p className="error-text goals-form-error">{error}</p>}
          <div className="goals-form-actions">
            <button type="submit" className="goals-save-button" disabled={saving}>
              {saving ? 'Saving…' : 'Save goals'}
            </button>
            <button type="button" className="goals-cancel-button" onClick={() => setForm(null)} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <ul className="goals-list">
            {NUTRIENTS.map(({ key, label, suffix, unit }) => (
              <li key={key}>
                <strong>
                  {goals[key]}
                  {suffix || ` ${unit}`}
                </strong>{' '}
                <span>{label.toLowerCase()}</span>
              </li>
            ))}
          </ul>

          {(goalSupplements.length > 0 || supplementEffects.length > 0) && (
            <div className="goals-supplements-summary" aria-label="Daily supplement effects">
              <div className="goals-supplements-header">
                <strong>Daily Supplements ({goalSupplements.map((s) => `${s.name} · ${s.dosage}`).join(', ')})</strong>
                {hasSupplementMacros && (
                  <span className="goals-supplements-macros">
                    Provides +{supplementMacros.calories} kcal · +{supplementMacros.protein}g protein · +{supplementMacros.carbs}g carbs · +{supplementMacros.fat}g fat
                  </span>
                )}
              </div>
              {supplementEffects.length > 0 && (
                <ul className="supplement-effects-list" aria-label="Supplement effect messages">
                  {supplementEffects.map((item) => (
                    <li key={item.id} className="supplement-effect-box">
                      {item.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default NutritionGoalsCard;
