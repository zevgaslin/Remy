// Comprehensive culinary unit conversion across weight, volume, count, and culinary equivalents.
// Converts between same-family measurements (e.g. 1 lb -> 453.592 g, 1 cup -> 48 tsp) and bridges
// common ingredient-aware culinary units (e.g. 1 lb of onion >= 50 g or 1 each onion; 1 stick butter = 0.5 cup = 113.4 g)
// so Pantry quantities, Recipe requirements, and Grocery List reconciliation agree across all conceivable units.

export const UNIT_DEFINITIONS = {
  // Weight (base: gram 'g')
  mg: { canonical: 'mg', label: 'mg', family: 'weight', factor: 0.001 },
  g: { canonical: 'g', label: 'g', family: 'weight', factor: 1 },
  dag: { canonical: 'dag', label: 'dag', family: 'weight', factor: 10 },
  hg: { canonical: 'hg', label: 'hg', family: 'weight', factor: 100 },
  kg: { canonical: 'kg', label: 'kg', family: 'weight', factor: 1000 },
  oz: { canonical: 'oz', label: 'oz', family: 'weight', factor: 28.3495 },
  lb: { canonical: 'lb', label: 'lb', family: 'weight', factor: 453.592 },
  st: { canonical: 'st', label: 'st', family: 'weight', factor: 6350.29 },

  // Volume (base: teaspoon 'tsp', where 1 tsp = 4.92892 ml)
  drop: { canonical: 'drop', label: 'drop', family: 'volume', factor: 1 / 98.578 },
  smidgen: { canonical: 'smidgen', label: 'smidgen', family: 'volume', factor: 1 / 32 },
  pinch: { canonical: 'pinch', label: 'pinch', family: 'volume', factor: 1 / 16 },
  dash: { canonical: 'dash', label: 'dash', family: 'volume', factor: 1 / 8 },
  tad: { canonical: 'tad', label: 'tad', family: 'volume', factor: 0.25 },
  tsp: { canonical: 'tsp', label: 'tsp', family: 'volume', factor: 1 },
  dessertspoon: { canonical: 'dessertspoon', label: 'dsp', family: 'volume', factor: 2 },
  tbsp: { canonical: 'tbsp', label: 'tbsp', family: 'volume', factor: 3 },
  fl_oz: { canonical: 'fl_oz', label: 'fl oz', family: 'volume', factor: 6 },
  shot: { canonical: 'shot', label: 'shot', family: 'volume', factor: 9 },
  jigger: { canonical: 'jigger', label: 'jigger', family: 'volume', factor: 9 },
  gill: { canonical: 'gill', label: 'gill', family: 'volume', factor: 24 },
  cup: { canonical: 'cup', label: 'cup', family: 'volume', factor: 48 },
  pt: { canonical: 'pt', label: 'pt', family: 'volume', factor: 96 },
  qt: { canonical: 'qt', label: 'qt', family: 'volume', factor: 192 },
  pot: { canonical: 'pot', label: 'pottle', family: 'volume', factor: 384 },
  gal: { canonical: 'gal', label: 'gal', family: 'volume', factor: 768 },
  ml: { canonical: 'ml', label: 'ml', family: 'volume', factor: 0.202884 },
  cl: { canonical: 'cl', label: 'cl', family: 'volume', factor: 2.02884 },
  dl: { canonical: 'dl', label: 'dl', family: 'volume', factor: 20.2884 },
  l: { canonical: 'l', label: 'L', family: 'volume', factor: 202.884 },

  // Count (base: 'each')
  each: { canonical: 'each', label: 'each', family: 'count', factor: 1 },
  pair: { canonical: 'pair', label: 'pair', family: 'count', factor: 2 },
  dozen: { canonical: 'dozen', label: 'dozen', family: 'count', factor: 12 },

  // Culinary / Produce / Packaging units with standard gram & volume bridges
  stick: { canonical: 'stick', label: 'stick', family: 'culinary', factor: 1, grams: 113.4, tsp: 24, count: 1 },
  clove: { canonical: 'clove', label: 'clove', family: 'culinary', factor: 1, grams: 5, tsp: 1, count: 1 },
  head: { canonical: 'head', label: 'head', family: 'culinary', factor: 1, grams: 300, tsp: 96, count: 1 },
  bulb: { canonical: 'bulb', label: 'bulb', family: 'culinary', factor: 1, grams: 50, tsp: 10, count: 1 },
  bunch: { canonical: 'bunch', label: 'bunch', family: 'culinary', factor: 1, grams: 150, tsp: 48, count: 1 },
  stalk: { canonical: 'stalk', label: 'stalk', family: 'culinary', factor: 1, grams: 40, tsp: 16, count: 1 },
  rib: { canonical: 'rib', label: 'rib', family: 'culinary', factor: 1, grams: 40, tsp: 16, count: 1 },
  sprig: { canonical: 'sprig', label: 'sprig', family: 'culinary', factor: 1, grams: 2, tsp: 1, count: 1 },
  leaf: { canonical: 'leaf', label: 'leaf', family: 'culinary', factor: 1, grams: 1, tsp: 0.5, count: 1 },
  slice: { canonical: 'slice', label: 'slice', family: 'culinary', factor: 1, grams: 30, tsp: 12, count: 1 },
  fillet: { canonical: 'fillet', label: 'fillet', family: 'culinary', factor: 1, grams: 170, tsp: 36, count: 1 },
  breast: { canonical: 'breast', label: 'breast', family: 'culinary', factor: 1, grams: 200, tsp: 42, count: 1 },
  thigh: { canonical: 'thigh', label: 'thigh', family: 'culinary', factor: 1, grams: 120, tsp: 26, count: 1 },
  can: { canonical: 'can', label: 'can', family: 'culinary', factor: 1, grams: 400, tsp: 84, count: 1 },
  jar: { canonical: 'jar', label: 'jar', family: 'culinary', factor: 1, grams: 450, tsp: 96, count: 1 },
  bottle: { canonical: 'bottle', label: 'bottle', family: 'culinary', factor: 1, grams: 750, tsp: 152, count: 1 },
  carton: { canonical: 'carton', label: 'carton', family: 'culinary', factor: 1, grams: 946, tsp: 192, count: 1 },
  bag: { canonical: 'bag', label: 'bag', family: 'culinary', factor: 1, grams: 453.592, tsp: 96, count: 1 },
  box: { canonical: 'box', label: 'box', family: 'culinary', factor: 1, grams: 453.592, tsp: 96, count: 1 },
  pkg: { canonical: 'pkg', label: 'package', family: 'culinary', factor: 1, grams: 453.592, tsp: 96, count: 1 },
  loaf: { canonical: 'loaf', label: 'loaf', family: 'culinary', factor: 1, grams: 453.592, tsp: 96, count: 1 },
  bar: { canonical: 'bar', label: 'bar', family: 'culinary', factor: 1, grams: 100, tsp: 24, count: 1 },
  scoop: { canonical: 'scoop', label: 'scoop', family: 'culinary', factor: 1, grams: 30, tsp: 12, count: 1 },
  serving: { canonical: 'serving', label: 'serving', family: 'culinary', factor: 1, grams: 100, tsp: 24, count: 1 },
};

export const UNIT_ALIASES = {
  // Weight
  milligram: 'mg',
  milligrams: 'mg',
  mg: 'mg',
  gram: 'g',
  grams: 'g',
  gm: 'g',
  gms: 'g',
  g: 'g',
  dekagram: 'dag',
  decagram: 'dag',
  dag: 'dag',
  hectogram: 'hg',
  hg: 'hg',
  kilogram: 'kg',
  kilograms: 'kg',
  kilo: 'kg',
  kilos: 'kg',
  kg: 'kg',
  kgs: 'kg',
  ounce: 'oz',
  ounces: 'oz',
  oz: 'oz',
  ozs: 'oz',
  pound: 'lb',
  pounds: 'lb',
  lb: 'lb',
  lbs: 'lb',
  stone: 'st',
  stones: 'st',
  st: 'st',

  // Volume
  drop: 'drop',
  drops: 'drop',
  gt: 'drop',
  gtt: 'drop',
  smidgen: 'smidgen',
  smidgens: 'smidgen',
  pinch: 'pinch',
  pinches: 'pinch',
  pn: 'pinch',
  dash: 'dash',
  dashes: 'dash',
  ds: 'dash',
  tad: 'tad',
  tads: 'tad',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tsp: 'tsp',
  tsps: 'tsp',
  tspn: 'tsp',
  t: 'tsp',
  dessertspoon: 'dessertspoon',
  dessertspoons: 'dessertspoon',
  dsp: 'dessertspoon',
  dstspn: 'dessertspoon',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tbsp: 'tbsp',
  tbsps: 'tbsp',
  tbspn: 'tbsp',
  tbs: 'tbsp',
  tb: 'tbsp',
  'fluid ounce': 'fl_oz',
  'fluid ounces': 'fl_oz',
  'fl oz': 'fl_oz',
  'floz': 'fl_oz',
  fl_oz: 'fl_oz',
  'oz fl': 'fl_oz',
  shot: 'shot',
  shots: 'shot',
  jigger: 'jigger',
  jiggers: 'jigger',
  gill: 'gill',
  gills: 'gill',
  cup: 'cup',
  cups: 'cup',
  c: 'cup',
  pint: 'pt',
  pints: 'pt',
  pt: 'pt',
  pts: 'pt',
  'fl pt': 'pt',
  quart: 'qt',
  quarts: 'qt',
  qt: 'qt',
  qts: 'qt',
  'fl qt': 'qt',
  pottle: 'pot',
  pottles: 'pot',
  pot: 'pot',
  gallon: 'gal',
  gallons: 'gal',
  gal: 'gal',
  gals: 'gal',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  ml: 'ml',
  mls: 'ml',
  cc: 'ml',
  centiliter: 'cl',
  centiliters: 'cl',
  centilitre: 'cl',
  centilitres: 'cl',
  cl: 'cl',
  deciliter: 'dl',
  deciliters: 'dl',
  decilitre: 'dl',
  decilitres: 'dl',
  dl: 'dl',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  l: 'l',

  // Count
  '': 'each',
  each: 'each',
  ea: 'each',
  item: 'each',
  items: 'each',
  piece: 'each',
  pieces: 'each',
  pc: 'each',
  pcs: 'each',
  unit: 'each',
  units: 'each',
  whole: 'each',
  small: 'each',
  medium: 'each',
  large: 'each',
  pair: 'pair',
  pairs: 'pair',
  dozen: 'dozen',
  doz: 'dozen',

  // Culinary / Produce / Packaging
  stick: 'stick',
  sticks: 'stick',
  clove: 'clove',
  cloves: 'clove',
  head: 'head',
  heads: 'head',
  bulb: 'bulb',
  bulbs: 'bulb',
  bunch: 'bunch',
  bunches: 'bunch',
  stalk: 'stalk',
  stalks: 'stalk',
  rib: 'rib',
  ribs: 'rib',
  sprig: 'sprig',
  sprigs: 'sprig',
  leaf: 'leaf',
  leaves: 'leaf',
  slice: 'slice',
  slices: 'slice',
  fillet: 'fillet',
  fillets: 'fillet',
  filet: 'fillet',
  filets: 'fillet',
  breast: 'breast',
  breasts: 'breast',
  thigh: 'thigh',
  thighs: 'thigh',
  can: 'can',
  cans: 'can',
  tin: 'can',
  tins: 'can',
  jar: 'jar',
  jars: 'jar',
  bottle: 'bottle',
  bottles: 'bottle',
  carton: 'carton',
  cartons: 'carton',
  bag: 'bag',
  bags: 'bag',
  box: 'box',
  boxes: 'box',
  package: 'pkg',
  packages: 'pkg',
  packet: 'pkg',
  packets: 'pkg',
  pkg: 'pkg',
  pkgs: 'pkg',
  pack: 'pkg',
  packs: 'pkg',
  loaf: 'loaf',
  loaves: 'loaf',
  bar: 'bar',
  bars: 'bar',
  scoop: 'scoop',
  scoops: 'scoop',
  serving: 'serving',
  servings: 'serving',
};

// Typical culinary ingredient densities (grams per US cup) and single-item weights (grams per 'each')
// so cross-dimension recipe/pantry comparisons (e.g. 1 lb onion vs 1 each onion or 1 cup chopped onion,
// or 1 lb flour vs 2 cups flour) convert seamlessly.
const INGREDIENT_PROFILES = [
  { match: /\b(onion|shallot|scallion|green onion|leek)s?\b/i, gramsPerEach: 150, gramsPerCup: 160 },
  { match: /\bgarlic\b/i, gramsPerEach: 5, gramsPerCup: 136 },
  { match: /\b(potato|sweet potato|yam)e?s?\b/i, gramsPerEach: 200, gramsPerCup: 150 },
  { match: /\b(tomato)e?s?\b/i, gramsPerEach: 150, gramsPerCup: 180 },
  { match: /\b(carrot)s?\b/i, gramsPerEach: 65, gramsPerCup: 128 },
  { match: /\b(bell pepper|pepper|jalapeno|chili)e?s?\b/i, gramsPerEach: 150, gramsPerCup: 150 },
  { match: /\b(cucumber|zucchini|squash)e?s?\b/i, gramsPerEach: 200, gramsPerCup: 130 },
  { match: /\b(broccoli|cauliflower)\b/i, gramsPerEach: 300, gramsPerCup: 91 },
  { match: /\b(spinach|kale|lettuce|arugula|greens|cabbage)\b/i, gramsPerEach: 150, gramsPerCup: 30 },
  { match: /\b(avocado)s?\b/i, gramsPerEach: 170, gramsPerCup: 150 },
  { match: /\b(lemon|lime|orange)s?\b/i, gramsPerEach: 100, gramsPerCup: 240 },
  { match: /\b(banana)s?\b/i, gramsPerEach: 120, gramsPerCup: 150 },
  { match: /\b(apple|pear|peach)e?s?\b/i, gramsPerEach: 180, gramsPerCup: 125 },
  { match: /\b(berry|berries|blueberr|strawberr|raspberr)/i, gramsPerEach: 15, gramsPerCup: 148 },
  { match: /\b(celery)\b/i, gramsPerEach: 40, gramsPerCup: 100 },
  { match: /\b(egg)s?\b/i, gramsPerEach: 50, gramsPerCup: 243 },
  { match: /\b(chicken breast)\b/i, gramsPerEach: 200, gramsPerCup: 140 },
  { match: /\b(chicken|turkey|beef|pork|salmon|fish|shrimp|tofu)\b/i, gramsPerEach: 170, gramsPerCup: 140 },
  { match: /\b(butter|margarine)\b/i, gramsPerEach: 113.4, gramsPerCup: 226.8 },
  { match: /\b(flour|masa harina|cornstarch)\b/i, gramsPerEach: 120, gramsPerCup: 120 },
  { match: /\b(sugar|brown sugar)\b/i, gramsPerEach: 200, gramsPerCup: 200 },
  { match: /\b(powdered sugar|confectioners? sugar|icing sugar)\b/i, gramsPerEach: 120, gramsPerCup: 120 },
  { match: /\b(rice|quinoa|couscous|lentil|beans?|chickpeas?)\b/i, gramsPerEach: 185, gramsPerCup: 185 },
  { match: /\b(oats|oatmeal|granola|breadcrumbs)\b/i, gramsPerEach: 90, gramsPerCup: 90 },
  { match: /\b(pasta|macaroni|noodles?|spaghetti)\b/i, gramsPerEach: 100, gramsPerCup: 100 },
  { match: /\b(cheddar|parmesan|mozzarella|cheese)\b/i, gramsPerEach: 113, gramsPerCup: 113 },
  { match: /\b(milk|cream|yogurt|greek yogurt|broth|stock|water|juice|soy sauce|oil|olive oil)\b/i, gramsPerEach: 240, gramsPerCup: 240 },
  { match: /\b(peanut butter|almond butter|honey|syrup|jam|mustard)\b/i, gramsPerEach: 250, gramsPerCup: 256 },
  { match: /\b(tortilla|bread|bun|roll|pita)s?\b/i, gramsPerEach: 45, gramsPerCup: 100 },
];

const DEFAULT_PROFILE = { gramsPerEach: 120, gramsPerCup: 160 };

export function getIngredientProfile(ingredientName = '') {
  const name = String(ingredientName ?? '').trim();
  if (!name) return DEFAULT_PROFILE;
  const found = INGREDIENT_PROFILES.find((entry) => entry.match.test(name));
  return found ? { gramsPerEach: found.gramsPerEach, gramsPerCup: found.gramsPerCup } : DEFAULT_PROFILE;
}

export function normalizeUnit(rawUnit) {
  if (rawUnit == null) return 'each';
  let cleaned = String(rawUnit)
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');
  if (!cleaned) return 'each';
  if (UNIT_ALIASES[cleaned]) return UNIT_ALIASES[cleaned];
  if (cleaned.length > 2 && cleaned.endsWith('es') && UNIT_ALIASES[cleaned.slice(0, -2)]) {
    return UNIT_ALIASES[cleaned.slice(0, -2)];
  }
  if (cleaned.length > 1 && cleaned.endsWith('s') && !cleaned.endsWith('ss') && UNIT_ALIASES[cleaned.slice(0, -1)]) {
    return UNIT_ALIASES[cleaned.slice(0, -1)];
  }
  return UNIT_DEFINITIONS[cleaned] ? cleaned : cleaned;
}

export function getUnitInfo(rawUnit) {
  const canonical = normalizeUnit(rawUnit);
  return UNIT_DEFINITIONS[canonical] || {
    canonical,
    label: String(rawUnit ?? '').trim() || 'each',
    family: `custom:${canonical}`,
    factor: 1,
  };
}

export function formatConvertedNumber(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '0';
  if (value >= 100) return String(Math.round(value * 10) / 10);
  if (value >= 1) return String(Math.round(value * 100) / 100);
  if (value >= 0.01) return String(Math.round(value * 1000) / 1000);
  return String(Number(value.toPrecision(2)));
}

export function formatUnitQuantity(quantity, rawUnit) {
  const info = getUnitInfo(rawUnit);
  const numStr = formatConvertedNumber(quantity);
  return info.label ? `${numStr} ${info.label}` : numStr;
}

// Converts an amount in `fromUnit` into `toUnit`.
// Supports:
//   1. Exact same unit family (weight <-> weight, volume <-> volume, count <-> count)
//   2. Culinary / produce / packaging bridges (e.g. stick, clove, can, lb <-> each/cup/g using ingredient profile)
export function convertQuantity(quantity, fromUnit, toUnit, ingredientName = '') {
  const numeric = Number(quantity);
  if (!Number.isFinite(numeric)) return null;
  if (numeric === 0) return 0;

  const from = getUnitInfo(fromUnit);
  const to = getUnitInfo(toUnit);

  if (from.canonical === to.canonical) {
    return numeric;
  }

  // Same standard family (weight -> weight, volume -> volume, count -> count)
  if (from.family === to.family && from.family !== 'culinary') {
    return (numeric * from.factor) / to.factor;
  }

  // Convert source to canonical grams using ingredient profile
  const profile = getIngredientProfile(ingredientName);
  const gramsPerTsp = profile.gramsPerCup / 48;

  const toGrams = (qty, unitInfo) => {
    if (unitInfo.family === 'weight') return qty * unitInfo.factor;
    if (unitInfo.family === 'volume') return qty * unitInfo.factor * gramsPerTsp;
    if (unitInfo.family === 'count') return qty * unitInfo.factor * profile.gramsPerEach;
    if (unitInfo.family === 'culinary') {
      if (unitInfo.grams) return qty * unitInfo.grams;
    }
    return null;
  };

  const fromGrams = (grams, unitInfo) => {
    if (unitInfo.family === 'weight') return grams / unitInfo.factor;
    if (unitInfo.family === 'volume') return grams / (unitInfo.factor * gramsPerTsp);
    if (unitInfo.family === 'count') return grams / (unitInfo.factor * profile.gramsPerEach);
    if (unitInfo.family === 'culinary') {
      if (unitInfo.grams) return grams / unitInfo.grams;
    }
    return null;
  };

  const sourceGrams = toGrams(numeric, from);
  if (sourceGrams == null) return null;

  return fromGrams(sourceGrams, to);
}

// Returns a list of helpful equivalent measurements to display in the Pantry UI
// (e.g., for 1 lb of Onion -> "453.6 g · 16 oz", for 2 cups of Milk -> "473.2 ml · 16 fl oz · 32 tbsp").
export function getUnitEquivalents(quantity, rawUnit, ingredientName = '') {
  const numeric = Number(quantity);
  if (!Number.isFinite(numeric) || numeric <= 0) return [];
  const info = getUnitInfo(rawUnit);

  let targets = [];
  if (info.family === 'weight') {
    targets = ['g', 'oz', 'lb', 'kg'].filter((u) => u !== info.canonical);
  } else if (info.family === 'volume') {
    targets = ['ml', 'tsp', 'tbsp', 'fl_oz', 'cup', 'l'].filter((u) => u !== info.canonical);
  } else if (info.family === 'culinary' || info.family === 'count') {
    targets = ['g', 'oz', 'cup'];
  }

  const results = [];
  for (const target of targets) {
    const converted = convertQuantity(numeric, rawUnit, target, ingredientName);
    if (converted != null && converted >= 0.05 && converted <= 50000) {
      results.push({
        unit: target,
        quantity: Number(formatConvertedNumber(converted)),
        text: formatUnitQuantity(converted, target),
      });
    }
  }
  return results;
}

export const PANTRY_UNIT_CATEGORIES = [
  {
    category: 'Weight',
    units: ['g', 'kg', 'mg', 'oz', 'lb'],
  },
  {
    category: 'Volume',
    units: ['tsp', 'tbsp', 'fl_oz', 'cup', 'pt', 'qt', 'gal', 'ml', 'cl', 'dl', 'l', 'pinch', 'dash', 'drop'],
  },
  {
    category: 'Count & Produce',
    units: ['each', 'dozen', 'pair', 'clove', 'head', 'bulb', 'bunch', 'stalk', 'rib', 'sprig', 'leaf', 'slice', 'fillet', 'breast', 'thigh'],
  },
  {
    category: 'Containers & Culinary',
    units: ['stick', 'can', 'jar', 'bottle', 'carton', 'bag', 'box', 'pkg', 'loaf', 'bar', 'scoop', 'serving'],
  },
];

// Normalize ingredient names for client-side comparison (mirrors backend IngredientNameNormalizer).
const NAME_ALIASES = {
  'clove of garlic': 'garlic',
  'cloves of garlic': 'garlic',
  scallion: 'green onion',
  'spring onion': 'green onion',
  'garbanzo bean': 'chickpea',
  'confectioner sugar': 'powdered sugar',
  'confectioners sugar': 'powdered sugar',
  'icing sugar': 'powdered sugar',
};

const IRREGULAR_SINGULARS = {
  leaves: 'leaf',
  loaves: 'loaf',
  knives: 'knife',
  halves: 'half',
  wives: 'wife',
  tomatoes: 'tomato',
  potatoes: 'potato',
};

const UNCOUNTABLE = new Set(['asparagus', 'cheese', 'couscous', 'gas', 'hummus', 'molasses', 'species', 'oats']);

function singularizeWord(word) {
  if (UNCOUNTABLE.has(word)) return word;
  if (IRREGULAR_SINGULARS[word]) return IRREGULAR_SINGULARS[word];
  if (word.endsWith('ies') && word.length > 3) return `${word.slice(0, -3)}y`;
  if ((word.endsWith('ches') || word.endsWith('shes') || word.endsWith('xes') || word.endsWith('zes')) && word.length > 2) {
    return word.slice(0, -2);
  }
  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us') && !word.endsWith('is') && !word.endsWith('ous') && word.length > 1) {
    return word.slice(0, -1);
  }
  return word;
}

export function canonicalizeIngredientName(value = '') {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/\s+/g, ' ');
  if (!normalized) return '';
  if (NAME_ALIASES[normalized]) return NAME_ALIASES[normalized];
  const lastSpace = normalized.lastIndexOf(' ');
  const prefix = lastSpace < 0 ? '' : normalized.slice(0, lastSpace + 1);
  const lastWord = lastSpace < 0 ? normalized : normalized.slice(lastSpace + 1);
  const singular = `${prefix}${singularizeWord(lastWord)}`;
  return NAME_ALIASES[singular] || singular;
}

export function ingredientNamesMatch(neededName, ownedName) {
  const needed = canonicalizeIngredientName(neededName);
  const owned = canonicalizeIngredientName(ownedName);
  if (!needed || !owned) return false;
  if (needed === owned) return true;
  if (needed.length < 3 || owned.length < 3) return false;
  return ` ${owned} `.includes(` ${needed} `) || ` ${needed} `.includes(` ${owned} `);
}

// Checks whether a list of pantry ingredients covers a required recipe ingredient
// after automatic unit conversion across all compatible/bridged units.
export function checkPantryCoverageForRecipeIngredient(recipeIngredient, pantryIngredients = []) {
  const rawName = recipeIngredient?.name || recipeIngredient?.ingredientName || '';
  const neededQty = recipeIngredient?.quantity != null ? Number(recipeIngredient.quantity) : null;
  const neededUnit = recipeIngredient?.unit || 'each';

  const matchingPantry = (pantryIngredients || []).filter((item) =>
    ingredientNamesMatch(rawName, item?.name),
  );

  if (matchingPantry.length === 0) {
    return {
      covered: false,
      neededQuantity: neededQty,
      neededUnit,
      haveInRecipeUnit: 0,
      remainingInRecipeUnit: neededQty ?? 1,
      matchingPantry,
    };
  }

  // If the recipe does not specify a numeric quantity, owning any positive quantity covers it.
  if (neededQty == null || !Number.isFinite(neededQty) || neededQty <= 0) {
    const anyPositive = matchingPantry.some((item) => Number(item.quantity) > 0);
    return {
      covered: anyPositive,
      neededQuantity: null,
      neededUnit,
      haveInRecipeUnit: anyPositive ? 1 : 0,
      remainingInRecipeUnit: anyPositive ? 0 : 1,
      matchingPantry,
    };
  }

  let totalInTargetUnit = 0;
  for (const item of matchingPantry) {
    const itemQty = Number(item.quantity);
    if (!Number.isFinite(itemQty) || itemQty <= 0) continue;
    const converted = convertQuantity(itemQty, item.unit, neededUnit, rawName || item.name);
    if (converted != null && Number.isFinite(converted)) {
      totalInTargetUnit += converted;
    }
  }

  const remaining = Math.max(0, neededQty - totalInTargetUnit);
  const covered = remaining <= 1e-6;

  return {
    covered,
    neededQuantity: neededQty,
    neededUnit,
    haveInRecipeUnit: Number(formatConvertedNumber(totalInTargetUnit)),
    remainingInRecipeUnit: Number(formatConvertedNumber(remaining)),
    matchingPantry,
  };
}

// Parses a grocery list amount string like "50 g", "1.75 cup", or "2 cup + 50 g" into parts.
export function parseGroceryAmountParts(amountText = '') {
  const raw = String(amountText ?? '').trim();
  if (!raw) return [];
  return raw
    .split(/\s*\+\s*/)
    .map((segment) => {
      const match = /^(\d+(?:\.\d+)?)\s*(.*)$/.exec(segment.trim());
      if (!match) return null;
      const quantity = Number(match[1]);
      const unit = match[2]?.trim() || 'each';
      return Number.isFinite(quantity) && quantity > 0 ? { quantity, unit } : null;
    })
    .filter(Boolean);
}

export function getPlannedMealServings(meal) {
  const parsed = Number(meal?.plannedServings);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

// Calculates how much of a specific pantry ingredient is required across all planned meals in the calendar,
// scaled by each meal's `plannedServings` and converted into the pantry ingredient's unit.
export function getPantryRequirementForIngredient(pantryItem, plannedMeals = {}) {
  if (!pantryItem?.name || !plannedMeals || typeof plannedMeals !== 'object') {
    return null;
  }

  const targetUnit = pantryItem.unit || 'each';
  let totalNeededInTargetUnit = 0;
  let fallbackUnit = targetUnit;
  const recipes = new Set();

  for (const meal of Object.values(plannedMeals)) {
    if (!meal || typeof meal !== 'object') continue;
    const servings = getPlannedMealServings(meal);
    const mealIngredients = Array.isArray(meal.ingredients)
      ? meal.ingredients
      : Array.isArray(meal.document?.ingredients)
      ? meal.document.ingredients
      : [];

    for (const ing of mealIngredients) {
      const ingName = ing?.name || ing?.ingredientName || '';
      if (!ingredientNamesMatch(ingName, pantryItem.name)) continue;
      if (meal.name) recipes.add(meal.name);

      const rawQty = Number(ing?.quantity);
      if (!Number.isFinite(rawQty) || rawQty <= 0) continue;
      const scaledQty = rawQty * servings;
      const ingUnit = ing?.unit || targetUnit || 'each';

      const converted = convertQuantity(scaledQty, ingUnit, targetUnit, pantryItem.name || ingName);
      if (converted != null && Number.isFinite(converted)) {
        totalNeededInTargetUnit += converted;
      } else {
        totalNeededInTargetUnit += scaledQty;
        fallbackUnit = ingUnit;
      }
    }
  }

  if (totalNeededInTargetUnit <= 0 && recipes.size === 0) {
    return null;
  }

  const ownedQty = Number(pantryItem.quantity) || 0;
  const remainingAfterPlanned = Math.max(0, ownedQty - totalNeededInTargetUnit);
  const shortage = Math.max(0, totalNeededInTargetUnit - ownedQty);

  return {
    neededQuantity: Number(formatConvertedNumber(totalNeededInTargetUnit)),
    neededUnit: fallbackUnit,
    neededText: formatUnitQuantity(totalNeededInTargetUnit, fallbackUnit),
    remainingAfterPlanned: Number(formatConvertedNumber(remainingAfterPlanned)),
    remainingText: formatUnitQuantity(remainingAfterPlanned, fallbackUnit),
    shortageQuantity: Number(formatConvertedNumber(shortage)),
    shortageText: shortage > 1e-6 ? formatUnitQuantity(shortage, fallbackUnit) : '',
    covered: shortage <= 1e-6,
    recipes: Array.from(recipes),
  };
}

// Reconciles a GroceryList response against the user's current pantry items and calendar `plannedMeals`
// using full unit conversion and serving-size scaling so that:
//   1. Increasing serving size in the Calendar scales ingredient requirements in the shopping cart
//      (including revealing items that were previously covered at 1 serving when higher servings exceed pantry stock).
//   2. Pantry stock in any compatible unit (e.g. 1 lb of Onion vs 50 g of Onion) is subtracted accurately.
export function reconcileGroceryItemsWithPantry(items = [], pantryIngredients = [], plannedMeals = {}) {
  const safeItems = Array.isArray(items) ? items : [];
  const safePantry = Array.isArray(pantryIngredients) ? pantryIngredients : [];
  const mealEntries = plannedMeals && typeof plannedMeals === 'object' ? Object.values(plannedMeals) : [];

  // Track serving multipliers per recipe name and explicit recipe ingredient requirements from plannedMeals
  const recipeServingsMap = new Map();
  const explicitNeedsByKey = new Map();

  for (const meal of mealEntries) {
    if (!meal || typeof meal !== 'object' || !meal.name) continue;
    const servings = getPlannedMealServings(meal);
    const prev = recipeServingsMap.get(meal.name) || { occurrences: 0, totalServings: 0, hasIngredients: false };
    const mealIngredients = Array.isArray(meal.ingredients)
      ? meal.ingredients
      : Array.isArray(meal.document?.ingredients)
      ? meal.document.ingredients
      : [];

    recipeServingsMap.set(meal.name, {
      occurrences: prev.occurrences + 1,
      totalServings: prev.totalServings + servings,
      hasIngredients: prev.hasIngredients || mealIngredients.length > 0,
    });

    for (const ing of mealIngredients) {
      const ingName = (ing?.name || ing?.ingredientName || '').trim();
      if (!ingName) continue;
      const key = canonicalizeIngredientName(ingName);
      if (!key) continue;
      const rawQty = Number(ing?.quantity);
      const scaledQty = Number.isFinite(rawQty) && rawQty > 0 ? rawQty * servings : 0;
      const unit = ing?.unit || 'each';

      let entry = explicitNeedsByKey.get(key);
      if (!entry) {
        entry = {
          key,
          name: ingName.charAt(0).toUpperCase() + ingName.slice(1),
          parts: [],
          recipes: new Set(),
        };
        explicitNeedsByKey.set(key, entry);
      }
      entry.recipes.add(meal.name);
      if (scaledQty > 0) {
        const existingPart = entry.parts.find((p) => normalizeUnit(p.unit) === normalizeUnit(unit));
        if (existingPart) {
          existingPart.quantity += scaledQty;
        } else {
          entry.parts.push({ quantity: scaledQty, unit });
        }
      }
    }
  }

  // Merge server items with any client-side planned meal scaling or newly uncovered ingredients
  const workingItems = [];
  const seenKeys = new Set();

  for (const item of safeItems) {
    const itemKey = canonicalizeIngredientName(item.name || item.key);
    seenKeys.add(itemKey);

    const explicitNeed = explicitNeedsByKey.get(itemKey);
    if (explicitNeed && explicitNeed.parts.length > 0) {
      // Use the exact scaled requirement from plannedMeals so serving changes update immediately
      workingItems.push({
        ...item,
        amount: explicitNeed.parts.map((p) => formatUnitQuantity(p.quantity, p.unit)).join(' + '),
        have: '',
        recipes: Array.from(new Set([...(item.recipes || []), ...explicitNeed.recipes])),
      });
      continue;
    }

    // If the planned meal in plannedMeals doesn't carry an inline `ingredients` array,
    // check whether any recipe in `item.recipes` has a non-1 serving multiplier in `plannedMeals`.
    const matchingStats = (item.recipes || [])
      .map((rName) => recipeServingsMap.get(rName))
      .filter(Boolean);
    const multiplier =
      matchingStats.length > 0
        ? matchingStats.reduce((sum, s) => sum + s.totalServings, 0) /
          matchingStats.reduce((sum, s) => sum + s.occurrences, 0)
        : 1;

    if (Math.abs(multiplier - 1) > 1e-6) {
      const amountParts = parseGroceryAmountParts(item.amount);
      const haveParts = parseGroceryAmountParts(item.have);
      // Total baseline need is (remaining amount + already-subtracted have)
      const combinedParts = [...amountParts];
      for (const hp of haveParts) {
        const match = combinedParts.find((cp) => normalizeUnit(cp.unit) === normalizeUnit(hp.unit));
        if (match) {
          match.quantity += hp.quantity;
        } else {
          combinedParts.push({ ...hp });
        }
      }
      const scaledAmount = combinedParts
        .map((p) => formatUnitQuantity(p.quantity * multiplier, p.unit))
        .join(' + ');
      workingItems.push({
        ...item,
        amount: scaledAmount,
        have: '',
      });
    } else {
      workingItems.push(item);
    }
  }

  // Also include any explicit planned-meal ingredients that weren't in `safeItems`
  // (e.g. previously covered at 1 serving, now exceeding pantry when servings increased)
  for (const [key, explicitNeed] of explicitNeedsByKey.entries()) {
    if (seenKeys.has(key) || explicitNeed.parts.length === 0) continue;
    workingItems.push({
      key: explicitNeed.key,
      name: explicitNeed.name,
      amount: explicitNeed.parts.map((p) => formatUnitQuantity(p.quantity, p.unit)).join(' + '),
      have: '',
      recipes: Array.from(explicitNeed.recipes),
      checked: false,
    });
  }

  if (workingItems.length === 0) return [];
  if (safePantry.length === 0) return workingItems;

  const reconciled = [];
  for (const item of workingItems) {
    const matchingPantry = safePantry.filter((p) =>
      ingredientNamesMatch(item.name || item.key, p?.name),
    );
    if (matchingPantry.length === 0) {
      reconciled.push(item);
      continue;
    }

    const parts = parseGroceryAmountParts(item.amount);
    if (parts.length === 0) {
      const hasAny = matchingPantry.some((p) => Number(p.quantity) > 0);
      if (!hasAny) reconciled.push(item);
      continue;
    }

    // Determine how much the pantry holds in grams
    let availableGrams = 0;
    const haveLabels = [];
    for (const p of matchingPantry) {
      const q = Number(p.quantity);
      if (!Number.isFinite(q) || q <= 0) continue;
      const g = convertQuantity(q, p.unit, 'g', item.name || p.name);
      if (g != null) {
        availableGrams += g;
        haveLabels.push(formatUnitQuantity(q, p.unit));
      }
    }

    // If the server already subtracted some `item.have`, add `item.have` back to the needed parts first
    // so we compare total needed vs total owned in pantry without double-counting.
    const havePartsFromServer = parseGroceryAmountParts(item.have);
    let serverHaveGrams = 0;
    for (const hp of havePartsFromServer) {
      const g = convertQuantity(hp.quantity, hp.unit, 'g', item.name);
      if (g != null) serverHaveGrams += g;
    }

    let remainingGramsToCover = Math.max(0, availableGrams - serverHaveGrams);

    const remainingParts = [];
    for (const part of parts) {
      const partGrams = convertQuantity(part.quantity, part.unit, 'g', item.name);
      if (partGrams == null || partGrams <= 0) {
        remainingParts.push(formatUnitQuantity(part.quantity, part.unit));
        continue;
      }
      if (remainingGramsToCover >= partGrams - 1e-6) {
        remainingGramsToCover -= partGrams;
      } else if (remainingGramsToCover > 1e-6) {
        const leftGrams = partGrams - remainingGramsToCover;
        remainingGramsToCover = 0;
        const leftInPartUnit = convertQuantity(leftGrams, 'g', part.unit, item.name);
        if (leftInPartUnit != null && leftInPartUnit > 1e-4) {
          remainingParts.push(formatUnitQuantity(leftInPartUnit, part.unit));
        }
      } else {
        remainingParts.push(formatUnitQuantity(part.quantity, part.unit));
      }
    }

    if (remainingParts.length > 0) {
      reconciled.push({
        ...item,
        amount: remainingParts.join(' + '),
        have: item.have || haveLabels.join(' + '),
      });
    }
  }

  return reconciled;
}
