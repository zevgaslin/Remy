// Parse only explicit mass/volume sizes. Never treat servings or item counts as grams.
export function packageQuantity(size, nutritionUnit) {
  if (typeof size !== 'string') return null;
  const match = size.trim().match(/^(?:(\d+)\s*[x×*]\s*)?(\d+(?:[.,]\d+)?)\s*(kg|mg|g|ml|cl|dl|l)$/i);
  if (!match) return null;
  const [, count = '1', amount, rawUnit] = match;
  const units = { kg: ['g', 1000], g: ['g', 1], mg: ['g', 0.001], l: ['ml', 1000], dl: ['ml', 100], cl: ['ml', 10], ml: ['ml', 1] };
  const [unit, scale] = units[rawUnit.toLowerCase()];
  if (nutritionUnit && nutritionUnit !== unit) return null;
  const quantity = Number(count) * Number(amount.replace(',', '.')) * scale;
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  return { quantity: Number(quantity.toFixed(6)), unit };
}
