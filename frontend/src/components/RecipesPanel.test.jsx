import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecipesPanel from './RecipesPanel';
import * as recipeServices from '../services/recipeServices';
import * as ingredientServices from '../services/ingredientServices';

// Mock child components to isolate RecipesPanel testing
vi.mock('./recipes', () => ({
  default: ({ name }) => <div data-testid="recipe-card">{name}</div>,
}));

// Mock the API services
vi.mock('../services/recipeServices', () => ({
  searchRecipes: vi.fn(),
  getRecipeFeed: vi.fn(),
  getAllRecipes: vi.fn(),
  likeRecipe: vi.fn(),
  dislikeRecipe: vi.fn(),
}));

vi.mock('../services/ingredientServices', () => ({
  getMyIngredients: vi.fn(),
}));

describe('RecipesPanel - Search Feature Additions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recipeServices.getAllRecipes.mockResolvedValue([]);
    recipeServices.getRecipeFeed.mockResolvedValue([]);
    ingredientServices.getMyIngredients.mockResolvedValue([]);
  });

  it('renders the new Recipe Keyword search input', async () => {
    render(<RecipesPanel />);
    const recipeSearchInput = screen.getByPlaceholderText('e.g. Chicken Alfredo, Tacos...');
    expect(recipeSearchInput).toBeInTheDocument();
    
    // Wait for the initial load to finish to prevent act() warnings
    await waitFor(() => expect(screen.getByText('Search', { selector: 'button' })).not.toBeDisabled());
  });

  it('updates the recipeQuery state when typing', async () => {
    render(<RecipesPanel />);
    const recipeSearchInput = screen.getByPlaceholderText('e.g. Chicken Alfredo, Tacos...');
    
    fireEvent.change(recipeSearchInput, { target: { value: 'Pasta' } });
    expect(recipeSearchInput.value).toBe('Pasta');

    await waitFor(() => expect(screen.getByText('Search', { selector: 'button' })).not.toBeDisabled());
  });

  it('calls searchRecipes with the new query parameter on submit', async () => {
    recipeServices.searchRecipes.mockResolvedValue([]);
    
    render(<RecipesPanel />);
    const recipeSearchInput = screen.getByPlaceholderText('e.g. Chicken Alfredo, Tacos...');
    const submitButton = screen.getByText('Search', { selector: 'button[type="submit"]' });

    // Wait for the initial load to finish so the button is clickable
    await waitFor(() => expect(submitButton).not.toBeDisabled());

    fireEvent.change(recipeSearchInput, { target: { value: 'Chicken Parmesan' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(recipeServices.searchRecipes).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'Chicken Parmesan'
        })
      );
    });
  });

  it('correctly maps raw recipe objects (handling the match.recipe || match fallback logic)', async () => {
    const mockDirectRecipes = [
      { id: '1', name: 'Mac and Cheese' },
      { id: '2', name: 'Tomato Soup' }
    ];
    recipeServices.searchRecipes.mockResolvedValue(mockDirectRecipes);

    render(<RecipesPanel />);
    
    const recipeSearchInput = screen.getByPlaceholderText('e.g. Chicken Alfredo, Tacos...');
    const submitButton = screen.getByText('Search', { selector: 'button[type="submit"]' });

    // Wait for the initial load to finish so the button is clickable
    await waitFor(() => expect(submitButton).not.toBeDisabled());

    fireEvent.change(recipeSearchInput, { target: { value: 'Soup' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const recipeCards = screen.getAllByTestId('recipe-card');
      expect(recipeCards).toHaveLength(2);
      expect(recipeCards[0]).toHaveTextContent('Mac and Cheese');
      expect(recipeCards[1]).toHaveTextContent('Tomato Soup');
    });
  });

  it('clears the recipeQuery when the search is cleared', async () => {
    recipeServices.searchRecipes.mockResolvedValue([]);
    render(<RecipesPanel />);
    
    const recipeSearchInput = screen.getByPlaceholderText('e.g. Chicken Alfredo, Tacos...');
    const submitButton = screen.getByText('Search', { selector: 'button[type="submit"]' });

    // Wait for the initial load to finish so the button is clickable
    await waitFor(() => expect(submitButton).not.toBeDisabled());

    // Type and search
    fireEvent.change(recipeSearchInput, { target: { value: 'Tacos' } });
    fireEvent.click(submitButton);

    // Wait for the clear button to appear (searchActive becomes true)
    const clearButton = await screen.findByTitle('Clear search');
    
    // Click clear
    fireEvent.click(clearButton);

    // Input should be empty again
    expect(recipeSearchInput.value).toBe('');
  });
});