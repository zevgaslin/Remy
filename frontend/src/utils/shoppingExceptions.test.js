import { expect, it } from 'vitest';
import { isShoppingException } from './shoppingExceptions';
it.each(['water', ' BOILING   WATER ', 'Water, chilled', 'pot of water', 'Very Hot Water', 'room-temperature water',
  'Water to thin peanut sauce', 'water (for boiling)', 'water as needed'])('omits plain preparation water: %s', name => {
  expect(isShoppingException(name)).toBe(true);
});
it.each(['Coconut water', 'Water chestnuts', 'Sparkling water', 'Rose water', 'Bottled water', 'Chicken broth or water',
  'Water or stock', 'Chicken broth + 2 cups water', 'Salt', '', null])('keeps other ingredients: %s', name => {
  expect(isShoppingException(name)).toBe(false);
});
