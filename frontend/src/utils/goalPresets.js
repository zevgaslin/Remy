// Rough, weight-based rules of thumb for daily goals. They ignore height, age and sex,
// so they are a starting point to adjust, not a prescription.

const LB_PER_KG = 2.20462;

export const WEIGHT_LIMITS = {
  lb: { min: 70, max: 700 },
  kg: { min: 30, max: 320 },
};

// Maintenance calories per pound of body weight.
export const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', description: 'Little or no exercise', caloriesPerLb: 13 },
  { id: 'light', label: 'Lightly active', description: 'Exercise 1–3 days a week', caloriesPerLb: 14 },
  { id: 'moderate', label: 'Moderately active', description: 'Exercise 3–5 days a week', caloriesPerLb: 15 },
  { id: 'very', label: 'Very active', description: 'Hard exercise 6–7 days a week', caloriesPerLb: 17 },
];

export const GOAL_PRESETS = [
  { id: 'cut', label: 'Cut', description: 'Lose fat, keep muscle', calorieChange: -0.2, proteinPerLb: 1.0 },
  { id: 'maintain', label: 'Maintain', description: 'Stay at your weight', calorieChange: 0, proteinPerLb: 0.8 },
  { id: 'lean-bulk', label: 'Lean bulk', description: 'Slow, steady gain', calorieChange: 0.1, proteinPerLb: 0.9 },
  { id: 'bulk', label: 'Bulk', description: 'Gain size faster', calorieChange: 0.2, proteinPerLb: 0.9 },
];

const FAT_SHARE_OF_CALORIES = 0.25;

export function toPounds(weight, unit) {
  return unit === 'kg' ? weight * LB_PER_KG : weight;
}

export function isValidWeight(weight, unit) {
  const limits = WEIGHT_LIMITS[unit];
  return Number.isFinite(weight) && weight >= limits.min && weight <= limits.max;
}

export function calculatePresetGoals({ weight, unit, activityId, presetId }) {
  const activity = ACTIVITY_LEVELS.find((level) => level.id === activityId);
  const preset = GOAL_PRESETS.find((option) => option.id === presetId);
  if (!activity || !preset || !isValidWeight(weight, unit)) {
    throw new Error('A valid weight, activity level and preset are required.');
  }

  const pounds = toPounds(weight, unit);
  const maintenance = pounds * activity.caloriesPerLb;
  const calories = Math.round((maintenance * (1 + preset.calorieChange)) / 50) * 50;
  const protein = Math.round(pounds * preset.proteinPerLb);
  const fat = Math.round((calories * FAT_SHARE_OF_CALORIES) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  return { calories, protein, carbs, fat };
}
