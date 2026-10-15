// Matches the backend's defaults (FDA daily values) for users who haven't set goals.
export const DEFAULT_GOALS = { calories: 2000, protein: 50, carbs: 275, fat: 78 };

export const NUTRIENTS = [
  { key: 'calories', label: 'Calories', short: 'Cal', unit: 'kcal', suffix: '', max: 20000, min: 1 },
  { key: 'protein', label: 'Protein', short: 'Pro', unit: 'g', suffix: 'g', max: 2000, min: 0 },
  { key: 'carbs', label: 'Carbs', short: 'Carb', unit: 'g', suffix: 'g', max: 2000, min: 0 },
  { key: 'fat', label: 'Fat', short: 'Fat', unit: 'g', suffix: 'g', max: 2000, min: 0 },
];
