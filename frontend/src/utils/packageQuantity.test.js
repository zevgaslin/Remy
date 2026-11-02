import { expect, it } from 'vitest';
import { packageQuantity } from './packageQuantity';
it.each([
  ['400 g', 'g', 400, 'g'], ['1.5 kg', 'g', 1500, 'g'], ['1 L', 'ml', 1000, 'ml'],
  ['1,5 l', 'ml', 1500, 'ml'], ['33 cl', 'ml', 330, 'ml'], ['6 x 125 g', 'g', 750, 'g'],
  ['4 × 250 ml', null, 1000, 'ml'],
])('normalizes %s without mixing weight and volume', (size, basis, quantity, unit) => {
  expect(packageQuantity(size, basis)).toEqual({ quantity, unit });
});
it.each(['', '1 bottle', '6 servings', '400 g / 500 ml', '0 g', '-10 g', 'about 400g', null])('does not invent an amount for %s', size => {
  expect(packageQuantity(size, 'g')).toBeNull();
});
it('does not convert volume to weight or weight to volume', () => {
  expect(packageQuantity('400 g', 'ml')).toBeNull();
  expect(packageQuantity('1 L', 'g')).toBeNull();
});
