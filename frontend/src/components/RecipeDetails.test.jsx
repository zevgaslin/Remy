import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecipeCard from './recipes';

describe('Supabase recipe details', () => {
  it('renders structured ingredients and ordered steps from the backend JSON document', () => {
    const recipe = {
      name: 'Garlic Butter Pasta', description: 'A pantry pasta.', instructions: 'Compatibility text',
      document: {
        servings: 2, cuisine: 'Italian',
        ingredients: [{ name: 'Pasta', quantity: 8, unit: 'oz' }, { name: 'Pepper', quantityText: 'to taste', optional: true }],
        instructions: [{ text: 'Boil 8 cups water over high heat.' }, { text: 'Cook pasta for the package time.' }],
        source: { url: 'https://example.com/pasta', siteName: 'Cooking source' },
      },
    };
    render(<RecipeCard {...recipe} recipe={recipe} />);
    expect(screen.getByText('View recipe')).toBeInTheDocument();
    expect(screen.getByText('8 oz Pasta')).toBeInTheDocument();
    expect(screen.getByText('to taste Pepper (optional)')).toBeInTheDocument();
    expect(screen.getByText('Boil 8 cups water over high heat.').closest('ol')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Source: Cooking source', hidden: true })).toHaveAttribute('href', 'https://example.com/pasta');
    expect(screen.queryByText('0% match')).not.toBeInTheDocument();
  });
});
