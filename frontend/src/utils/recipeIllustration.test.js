import { describe, expect, it } from 'vitest';
import { getRecipeIllustration } from './recipeIllustration';

describe('recipe illustrations', () => {
  it.each([
    ['Black Bean Sweet Potato Tacos', 'taco'],
    ['Easy Mac and Cheese', 'pasta'],
    ['Chicken Salad', 'salad'],
    ['Homemade Chicken Noodle Soup', 'soup'],
    ['Spinach Egg Breakfast Wrap', 'wrap'],
    ['Salmon Quinoa Bowl', 'rice'],
    ['Lemon Yogurt Chicken', 'chicken'],
    ['Banana Peanut Butter Oats', 'bowl'],
    ['Lemon Méringue Pudding', 'custard'],
    ['Chocolate Chunk Cookies', 'cookie'],
    ['Tomato-Eggs', 'egg'],
    ['Chicken & Rice', 'rice'],
    ['Eggplant', 'salad'],
    ['Breaded chicken', 'chicken'],
  ])('matches %s to the appropriate dish family', (name, asset) => {
    expect(getRecipeIllustration(name).src).toBe(`/illustrations/${asset}.svg`);
  });

  it.each([undefined, null, '', 'A family favorite', 'A Mustard Poultice'])('uses a neutral fallback for %s', name => {
    expect(getRecipeIllustration(name)).toEqual({ src: '/illustrations/plate.svg', alt: 'Dish illustration' });
  });
});
