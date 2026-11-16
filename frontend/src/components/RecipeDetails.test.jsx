import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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
    render(
      <RecipeCard
        {...recipe}
        recipe={recipe}
        pantryIngredients={[{ id: 1, name: 'Pasta', quantity: 1, unit: 'lb' }]}
      />
    );
    expect(screen.getByText('View recipe')).toBeInTheDocument();
    expect(screen.getByText(/8 oz Pasta/)).toBeInTheDocument();
    expect(screen.getByText('(In pantry: 16 oz)')).toBeInTheDocument();
    expect(screen.getByText('to taste Pepper (optional)')).toBeInTheDocument();
    expect(screen.getByText('Boil 8 cups water over high heat.').closest('ol')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Source: Cooking source', hidden: true })).toHaveAttribute('href', 'https://example.com/pasta');
    expect(screen.queryByText('0% match')).not.toBeInTheDocument();
  });

  it('displays favoriteIngredients, expiringIngredients, matchedIngredients, missingIngredients, and handles actions', () => {
    const onFavorite = vi.fn();
    const onDislike = vi.fn();
    const onRate = vi.fn();
    const recipe = {
      name: 'Spinach Wrap',
      instructions: 'Wrap it.',
      usageCount: 1,
      ratingAverage: 4.5,
      ratingCount: 2,
    };

    render(
      <RecipeCard
        name="Spinach Wrap"
        instructions="Wrap it."
        recipe={recipe}
        matchScore={85}
        favoriteIngredients={['Spinach', 'Egg']}
        expiringIngredients={['Spinach']}
        matchedIngredients={['Spinach', 'Egg']}
        missingIngredients={['Tortilla']}
        feedback="favorite"
        rating={5}
        onFavorite={onFavorite}
        onDislike={onDislike}
        onRate={onRate}
      />
    );

    expect(screen.getByText('85% match')).toBeInTheDocument();
    expect(screen.getByText('Includes favorite: Spinach, Egg')).toBeInTheDocument();
    expect(screen.getByText('Uses up: Spinach')).toBeInTheDocument();
    expect(screen.getByText('Have: Spinach, Egg')).toBeInTheDocument();
    expect(screen.getByText('Need: Tortilla')).toBeInTheDocument();
    expect(screen.getByText('Planned or cooked by 1 person')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Favorite recipe' }));
    expect(onFavorite).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Dislike recipe' }));
    expect(onDislike).toHaveBeenCalledTimes(1);
  });
});
