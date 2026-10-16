import { useState } from 'react';
import {
  ACTIVITY_LEVELS,
  GOAL_PRESETS,
  WEIGHT_LIMITS,
  calculatePresetGoals,
  isValidWeight,
} from '../utils/goalPresets';

function GoalPresetPicker({ onApply }) {
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('lb');
  const [activityId, setActivityId] = useState('moderate');
  const [error, setError] = useState('');

  function applyPreset(preset) {
    const value = Number(weight);
    if (weight === '' || !isValidWeight(value, unit)) {
      const { min, max } = WEIGHT_LIMITS[unit];
      setError(`Enter your weight (${min}–${max} ${unit}) to use a preset.`);
      return;
    }
    setError('');
    const activity = ACTIVITY_LEVELS.find((level) => level.id === activityId);
    const goals = calculatePresetGoals({ weight: value, unit, activityId, presetId: preset.id });
    onApply(goals, `Filled in from the ${preset.label} preset for ${value} ${unit}, ${activity.label.toLowerCase()}.`);
  }

  return (
    <fieldset className="goal-presets">
      <legend>Start from a preset</legend>
      <div className="goal-presets-inputs">
        <label className="goals-field">
          <span>Body weight</span>
          <div className="goal-presets-weight">
            <input
              type="number"
              inputMode="decimal"
              min={WEIGHT_LIMITS[unit].min}
              max={WEIGHT_LIMITS[unit].max}
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              aria-label="Body weight"
            />
            <select value={unit} onChange={(event) => setUnit(event.target.value)} aria-label="Weight unit">
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </div>
        </label>
        <label className="goals-field">
          <span>Activity level</span>
          <select value={activityId} onChange={(event) => setActivityId(event.target.value)}>
            {ACTIVITY_LEVELS.map((level) => (
              <option key={level.id} value={level.id}>
                {level.label} ({level.description.toLowerCase()})
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="goal-presets-buttons">
        {GOAL_PRESETS.map((preset) => (
          <button key={preset.id} type="button" className="goal-preset-button" onClick={() => applyPreset(preset)}>
            <strong>{preset.label}</strong>{' '}
            <span>{preset.description}</span>
          </button>
        ))}
      </div>
      {error && <p className="error-text goal-presets-error">{error}</p>}
      <p className="goal-presets-note">
        Rough estimates from body weight only. They don’t account for height, age, sex or health
        conditions, so adjust them to suit you.
      </p>
    </fieldset>
  );
}

export default GoalPresetPicker;
