import { describe, expect, it } from 'vitest';
import {
  PANTRY_UNIT_CATEGORIES,
  canonicalizeIngredientName,
  checkPantryCoverageForRecipeIngredient,
  convertQuantity,
  formatConvertedNumber,
  formatUnitQuantity,
  getIngredientProfile,
  getUnitEquivalents,
  getUnitInfo,
  ingredientNamesMatch,
  normalizeUnit,
  parseGroceryAmountParts,
  reconcileGroceryItemsWithPantry,
} from './unitConversion';

describe('unitConversion utility', () => {
  it('normalizes aliases and plurals across all unit categories', () => {
    expect(normalizeUnit('Pounds')).toBe('lb');
    expect(normalizeUnit('lbs.')).toBe('lb');
    expect(normalizeUnit('Grams')).toBe('g');
    expect(normalizeUnit('kilograms')).toBe('kg');
    expect(normalizeUnit('milligrams')).toBe('mg');
    expect(normalizeUnit('ounces')).toBe('oz');
    expect(normalizeUnit('tablespoons')).toBe('tbsp');
    expect(normalizeUnit('teaspoons')).toBe('tsp');
    expect(normalizeUnit('fluid ounces')).toBe('fl_oz');
    expect(normalizeUnit('fl. oz.')).toBe('fl_oz');
    expect(normalizeUnit('Cups')).toBe('cup');
    expect(normalizeUnit('pints')).toBe('pt');
    expect(normalizeUnit('quarts')).toBe('qt');
    expect(normalizeUnit('gallons')).toBe('gal');
    expect(normalizeUnit('millilitres')).toBe('ml');
    expect(normalizeUnit('liters')).toBe('l');
    expect(normalizeUnit('pieces')).toBe('each');
    expect(normalizeUnit('cloves')).toBe('clove');
    expect(normalizeUnit('sticks')).toBe('stick');
    expect(normalizeUnit('cans')).toBe('can');
    expect(normalizeUnit('packages')).toBe('pkg');
    expect(normalizeUnit('loaves')).toBe('loaf');
    expect(normalizeUnit('leaves')).toBe('leaf');
    expect(normalizeUnit('pinches')).toBe('pinch');
    expect(normalizeUnit('')).toBe('each');
    expect(normalizeUnit(null)).toBe('each');
  });

  it('converts accurately within weight, volume, and count families', () => {
    // 1 lb = 453.592 g, 16 oz = 1 lb, 1 kg = 1000 g
    expect(convertQuantity(1, 'lb', 'g', 'Onion')).toBeCloseTo(453.592, 2);
    expect(convertQuantity(453.592, 'g', 'lb', 'Onion')).toBeCloseTo(1, 3);
    expect(convertQuantity(1, 'lb', 'oz')).toBeCloseTo(16, 2);
    expect(convertQuantity(1, 'kg', 'g')).toBe(1000);
    expect(convertQuantity(1000, 'mg', 'g')).toBe(1);

    // Volume conversions: 1 cup = 16 tbsp = 48 tsp = 8 fl oz; 1 l = 1000 ml
    expect(convertQuantity(1, 'cup', 'tbsp')).toBeCloseTo(16, 4);
    expect(convertQuantity(1, 'cup', 'tsp')).toBeCloseTo(48, 4);
    expect(convertQuantity(1, 'cup', 'fl oz')).toBeCloseTo(8, 4);
    expect(convertQuantity(1, 'gal', 'qt')).toBeCloseTo(4, 4);
    expect(convertQuantity(1, 'qt', 'pt')).toBeCloseTo(2, 4);
    expect(convertQuantity(1, 'pt', 'cup')).toBeCloseTo(2, 4);
    expect(convertQuantity(1, 'l', 'ml')).toBeCloseTo(1000, 1);

    // Count conversions: 1 dozen = 12 each, 1 pair = 2 each
    expect(convertQuantity(1, 'dozen', 'each')).toBe(12);
    expect(convertQuantity(2, 'pair', 'each')).toBe(4);
  });

  it('converts across culinary, produce, and container units using ingredient profiles', () => {
    // 1 lb of Onion (453.592 g) converts to > 3 each onions (~150 g each) and ~2.83 cups chopped onion
    expect(convertQuantity(1, 'lb', 'each', 'Onion')).toBeGreaterThan(3);
    expect(convertQuantity(1, 'lb', 'cup', 'Onion')).toBeGreaterThan(2.5);

    // 1 stick of butter = 113.4 g = 0.5 cup = 8 tbsp
    expect(convertQuantity(1, 'stick', 'g', 'Butter')).toBeCloseTo(113.4, 1);
    expect(convertQuantity(1, 'stick', 'cup', 'Butter')).toBeCloseTo(0.5, 2);
    expect(convertQuantity(1, 'stick', 'tbsp', 'Butter')).toBeCloseTo(8, 1);

    // 1 can of black beans = 400 g
    expect(convertQuantity(1, 'can', 'g', 'Black Beans')).toBeCloseTo(400, 1);

    expect(convertQuantity(0, 'lb', 'g')).toBe(0);
    expect(convertQuantity('not-a-number', 'lb', 'g')).toBeNull();
  });

  it('qualifies 1 lb of onion in the pantry for a 50 g onion recipe requirement', () => {
    const pantry = [{ id: 1, name: 'Onion', quantity: 1, unit: 'lb' }];
    const recipeIngredient = { name: 'Onion', quantity: 50, unit: 'g', optional: false };

    const result = checkPantryCoverageForRecipeIngredient(recipeIngredient, pantry);
    expect(result.covered).toBe(true);
    expect(result.haveInRecipeUnit).toBeCloseTo(453.59, 1);
    expect(result.remainingInRecipeUnit).toBe(0);

    // Insufficient quantity check: 20 g of onion in pantry does NOT cover 50 g needed
    const smallPantry = [{ id: 1, name: 'Onion', quantity: 20, unit: 'g' }];
    const insufficient = checkPantryCoverageForRecipeIngredient(recipeIngredient, smallPantry);
    expect(insufficient.covered).toBe(false);
    expect(insufficient.remainingInRecipeUnit).toBeCloseTo(30, 1);
  });

  it('reconciles grocery list items against pantry stock across different units', () => {
    const pantry = [
      { id: 1, name: 'Onion', quantity: 1, unit: 'lb' }, // 453.592 g -> covers 50 g onion completely
      { id: 2, name: 'Milk', quantity: 500, unit: 'ml' }, // ~2.11 cups -> partially covers 4 cup milk
    ];
    const rawGroceryItems = [
      { key: 'onion', name: 'Onion', amount: '50 g', have: '', recipes: ['Soup'], checked: false },
      { key: 'milk', name: 'Milk', amount: '4 cup', have: '', recipes: ['Pancakes'], checked: false },
      { key: 'eggs', name: 'Eggs', amount: '6', have: '', recipes: ['Omelet'], checked: false },
    ];

    const reconciled = reconcileGroceryItemsWithPantry(rawGroceryItems, pantry);
    // Onion is completely covered by 1 lb in pantry and removed from the shopping cart!
    expect(reconciled.map((i) => i.name)).toEqual(['Milk', 'Eggs']);
    const milkItem = reconciled.find((i) => i.name === 'Milk');
    expect(milkItem.amount).toMatch(/1\.89 cup/);
    expect(milkItem.have).toBe('500 ml');
  });

  it('formats unit quantities, equivalents, and canonical ingredient names', () => {
    expect(formatConvertedNumber(453.592)).toBe('453.6');
    expect(formatConvertedNumber(1.75)).toBe('1.75');
    expect(formatConvertedNumber(0.025)).toBe('0.025');
    expect(formatConvertedNumber(0.0042)).toBe('0.0042');
    expect(formatUnitQuantity(1, 'lb')).toBe('1 lb');

    const eqs = getUnitEquivalents(1, 'lb', 'Onion');
    expect(eqs.map((e) => e.unit)).toContain('g');
    expect(eqs.map((e) => e.unit)).toContain('oz');

    expect(canonicalizeIngredientName('Yellow Onions')).toBe('yellow onion');
    expect(canonicalizeIngredientName('Cloves of Garlic')).toBe('garlic');
    expect(canonicalizeIngredientName('Tomatoes')).toBe('tomato');
    expect(ingredientNamesMatch('onion', 'Yellow Onion')).toBe(true);
    expect(ingredientNamesMatch('pea', 'peanut')).toBe(false);

    expect(parseGroceryAmountParts('2 cup + 50 g')).toEqual([
      { quantity: 2, unit: 'cup' },
      { quantity: 50, unit: 'g' },
    ]);
    expect(getIngredientProfile('Onion').gramsPerEach).toBe(150);
    expect(getUnitInfo('unknown_xyz').family).toBe('custom:unknown xyz');
    expect(PANTRY_UNIT_CATEGORIES.length).toBeGreaterThanOrEqual(4);
  });

  it('scales pantry requirements and grocery list items when plannedServings is increased', async () => {
    const { getPlannedMealServings, getPantryRequirementForIngredient } = await import('./unitConversion');
    expect(getPlannedMealServings({ plannedServings: 3 })).toBe(3);
    expect(getPlannedMealServings({})).toBe(1);

    const onionPantry = { id: 1, name: 'Onion', quantity: 1, unit: 'lb' }; // 453.592 g
    const plannedMeals1 = {
      '2026-10-15::dinner': {
        id: 10,
        name: 'Onion Tart',
        plannedServings: 1,
        ingredients: [{ name: 'Onion', quantity: 200, unit: 'g' }],
      },
    };
    const req1 = getPantryRequirementForIngredient(onionPantry, plannedMeals1);
    expect(req1.covered).toBe(true);
    expect(req1.neededQuantity).toBeCloseTo(0.44, 2);

    const plannedMeals3 = {
      '2026-10-15::dinner': {
        id: 10,
        name: 'Onion Tart',
        plannedServings: 3,
        ingredients: [{ name: 'Onion', quantity: 200, unit: 'g' }],
      },
    };
    const req3 = getPantryRequirementForIngredient(onionPantry, plannedMeals3);
    expect(req3.covered).toBe(false);
    expect(req3.neededQuantity).toBeCloseTo(1.32, 2);

    const grocery = reconcileGroceryItemsWithPantry([], [onionPantry], plannedMeals3);
    expect(grocery).toHaveLength(1);
    expect(grocery[0].name).toBe('Onion');
    expect(grocery[0].amount).toBe('146.4 g');
  });
});

