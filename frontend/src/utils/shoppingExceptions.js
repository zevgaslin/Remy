// Only plain/preparation water is assumed available. Keep purchased products and
// alternatives (e.g. coconut water, water chestnuts, or chicken broth or water).
const WATER_NAMES = new Set([
  'water', 'plain water', 'tap water', 'filtered water', 'pot of water',
  'hot water', 'very hot water', 'warm water', 'lukewarm water', 'cold water',
  'chilled water', 'ice water', 'ice cold water', 'room temperature water',
  'boiling water', 'boiled water', 'freshly boiled water',
  'water chilled', 'water cold', 'water warm', 'water hot', 'water boiling',
]);

export function isShoppingException(name) {
  const normalized = String(name ?? '').toLowerCase().replace(/[-(),]/g, ' ').replace(/\s+/g, ' ').trim();
  return WATER_NAMES.has(normalized)
    || /^water (?:as needed|for (?:cooking|boiling|rinsing|soaking|pasta)|to thin(?: .+)?)$/.test(normalized);
}
