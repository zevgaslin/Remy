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

describe('RecipesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recipeServices.getAllRecipes.mockResolvedValue([]);
    recipeServices.getRecipeFeed.mockResolvedValue([]);
    ingredientServices.getMyIngredients.mockResolvedValue([]);
  });

  it('renders the Recipe Keyword search input', async () => {
    render(<RecipesPanel />);
    const recipeSearchInput = screen.getByPlaceholderText('e.g. Chicken Alfredo, Tacos...');
    expect(recipeSearchInput).toBeInTheDocument();
    
    // Wait for the initial load to finish to prevent act() warnings
    await waitFor(() => expect(screen.getByText('Search', { selector: 'button[type="submit"]' })).not.toBeDisabled());
  });

  it('updates the recipeQuery state when typing', async () => {
    render(<RecipesPanel />);
    const recipeSearchInput = screen.getByPlaceholderText('e.g. Chicken Alfredo, Tacos...');
    
    fireEvent.change(recipeSearchInput, { target: { value: 'Pasta' } });
    expect(recipeSearchInput.value).toBe('Pasta');

    await waitFor(() => expect(screen.getByText('Search', { selector: 'button[type="submit"]' })).not.toBeDisabled());
  });

  it('calls searchRecipes with the query parameter on submit', async () => {
    recipeServices.searchRecipes.mockResolvedValue([]);
    
    render(<RecipesPanel />);
    const recipeSearchInput = screen.getByPlaceholderText('e.g. Chicken Alfredo, Tacos...');
    const submitButton = screen.getByText('Search', { selector: 'button[type="submit"]' });

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

  it('splits ingredient input by comma and calls searchRecipes', async () => {
    recipeServices.searchRecipes.mockResolvedValue([]);
    render(<RecipesPanel />);
    
    const ingredientInput = screen.getByPlaceholderText('spinach, egg, rice');
    const submitButton = screen.getByText('Search', { selector: 'button[type="submit"]' });

    await waitFor(() => expect(submitButton).not.toBeDisabled());

    fireEvent.change(ingredientInput, { target: { value: 'egg, milk' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(recipeServices.searchRecipes).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: ['egg', 'milk']
        })
      );
    });
  });

  it('passes dietary preference when a diet is selected', async () => {
    recipeServices.searchRecipes.mockResolvedValue([]);
    render(<RecipesPanel />);
    
    const dietSelect = screen.getByRole('combobox');
    const submitButton = screen.getByText('Search', { selector: 'button[type="submit"]' });

    await waitFor(() => expect(submitButton).not.toBeDisabled());

    fireEvent.change(dietSelect, { target: { value: 'vegetarian' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(recipeServices.searchRecipes).toHaveBeenCalledWith(
        expect.objectContaining({
          preferences: [{ name: 'diet', value: 'vegetarian' }]
        })
      );
    });
  });

  it('calls searchRecipes with the random flag when Random button is clicked', async () => {
    recipeServices.searchRecipes.mockResolvedValue([]);
    render(<RecipesPanel />);
    
    const randomButton = screen.getByText('Random', { selector: 'button' });

    await waitFor(() => expect(randomButton).not.toBeDisabled());

    fireEvent.click(randomButton);

    await waitFor(() => {
      expect(recipeServices.searchRecipes).toHaveBeenCalledWith(
        expect.objectContaining({
          random: true,
          query: '',
          ingredients: [],
          requireAllIngredients: false
        })
      );
    });
  });

  it('handles onlyMakeNow mutually excluding onlyCurrentIngredients', async () => {
    render(<RecipesPanel />);
    const currentIngredientsCheck = screen.getByLabelText('Only show recipes with some current ingredients');
    const makeNowCheck = screen.getByLabelText('Only show recipes I can make right now');

    await waitFor(() => expect(currentIngredientsCheck).not.toBeDisabled());

    // Check current ingredients
    fireEvent.click(currentIngredientsCheck);
    expect(currentIngredientsCheck).toBeChecked();

    // Check make now -> should uncheck and disable current ingredients
    fireEvent.click(makeNowCheck);
    expect(makeNowCheck).toBeChecked();
    expect(currentIngredientsCheck).not.toBeChecked();
    expect(currentIngredientsCheck).toBeDisabled();
  });

  it('correctly maps raw recipe objects into RecipeCards', async () => {
    const mockDirectRecipes = [
      { id: '1', name: 'Mac and Cheese' },
      { id: '2', name: 'Tomato Soup' }
    ];
    recipeServices.searchRecipes.mockResolvedValue(mockDirectRecipes);

    render(<RecipesPanel />);
    
    const recipeSearchInput = screen.getByPlaceholderText('e.g. Chicken Alfredo, Tacos...');
    const submitButton = screen.getByText('Search', { selector: 'button[type="submit"]' });

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

  it('displays no matching recipes message when search returns empty', async () => {
    recipeServices.searchRecipes.mockResolvedValue([]);
    render(<RecipesPanel />);
    
    const recipeSearchInput = screen.getByPlaceholderText('e.g. Chicken Alfredo, Tacos...');
    const submitButton = screen.getByText('Search', { selector: 'button[type="submit"]' });

    await waitFor(() => expect(submitButton).not.toBeDisabled());

    fireEvent.change(recipeSearchInput, { target: { value: 'Unknown Recipe' } });
    fireEvent.click(submitButton);

    expect(await screen.findByText('No recipes match your search criteria.')).toBeInTheDocument();
  });

  it('clears the form inputs when the search is cleared', async () => {
    recipeServices.searchRecipes.mockResolvedValue([]);
    render(<RecipesPanel />);
    
    const recipeSearchInput = screen.getByPlaceholderText('e.g. Chicken Alfredo, Tacos...');
    const submitButton = screen.getByText('Search', { selector: 'button[type="submit"]' });

    await waitFor(() => expect(submitButton).not.toBeDisabled());

    fireEvent.change(recipeSearchInput, { target: { value: 'Tacos' } });
    fireEvent.click(submitButton);

    // Wait for the clear button to appear
    const clearButton = await screen.findByTitle('Clear search');
    
    // Click clear
    fireEvent.click(clearButton);

    // Input should be empty again
    expect(recipeSearchInput.value).toBe('');
  });

  it('refreshes the feed when Refresh Feed button is clicked', async () => {
    recipeServices.getAllRecipes.mockResolvedValue([{ id: '3', name: 'Fresh Salad' }]);
    render(<RecipesPanel />);
    
    const refreshButton = screen.getByText('Refresh feed', { selector: 'button' });

    await waitFor(() => expect(refreshButton).not.toBeDisabled());

    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByTestId('recipe-card')).toHaveTextContent('Fresh Salad');
    });
  });
});