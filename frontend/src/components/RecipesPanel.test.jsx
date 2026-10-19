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
  createRecipe: vi.fn(), // Added to mock the new feature
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
    recipeServices.createRecipe.mockResolvedValue({ id: 'mock-new-id' });
  });

  // --- EXISTING SEARCH TESTS ---

  it('renders the Recipe Keyword search input', async () => {
    render(<RecipesPanel />);
    const recipeSearchInput = screen.getByPlaceholderText('e.g. Chicken Alfredo, Tacos...');
    expect(recipeSearchInput).toBeInTheDocument();
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
        expect.objectContaining({ query: 'Chicken Parmesan' })
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
        expect.objectContaining({ ingredients: ['egg', 'milk'] })
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
        expect.objectContaining({ preferences: [{ name: 'diet', value: 'vegetarian' }] })
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
        expect.objectContaining({ random: true, query: '', ingredients: [], requireAllIngredients: false })
      );
    });
  });

  it('handles onlyMakeNow mutually excluding onlyCurrentIngredients', async () => {
    render(<RecipesPanel />);
    const currentIngredientsCheck = screen.getByLabelText('Only show recipes with some current ingredients');
    const makeNowCheck = screen.getByLabelText('Only show recipes I can make right now');

    await waitFor(() => expect(currentIngredientsCheck).not.toBeDisabled());

    fireEvent.click(currentIngredientsCheck);
    expect(currentIngredientsCheck).toBeChecked();

    fireEvent.click(makeNowCheck);
    expect(makeNowCheck).toBeChecked();
    expect(currentIngredientsCheck).not.toBeChecked();
    expect(currentIngredientsCheck).toBeDisabled();
  });

  it('correctly maps raw recipe objects into RecipeCards', async () => {
    const mockDirectRecipes = [{ id: '1', name: 'Mac and Cheese' }, { id: '2', name: 'Tomato Soup' }];
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

    const clearButton = await screen.findByTitle('Clear search');
    fireEvent.click(clearButton);

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

  // --- NEW ADD RECIPE MODAL TESTS ---

  it('opens and closes the Add Recipe modal', async () => {
    render(<RecipesPanel />);
    const addButton = await screen.findByText('+ Add Recipe');
    
    // Open Modal
    fireEvent.click(addButton);
    expect(screen.getByText('Add Comprehensive Recipe')).toBeInTheDocument();

    // Close Modal
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(screen.queryByText('Add Comprehensive Recipe')).not.toBeInTheDocument();
  });

  it('updates standard, nested, and array fields in the modal form', async () => {
    render(<RecipesPanel />);
    fireEvent.click(await screen.findByText('+ Add Recipe'));

    // Update standard field (Recipe Name)
    const recipeNameInput = screen.getAllByLabelText('Name *')[0]; // The first one is Recipe Name, second is Ingredient Name
    fireEvent.change(recipeNameInput, { target: { name: 'name', value: 'Test Cake' } });
    expect(recipeNameInput.value).toBe('Test Cake');

    // Update nested field (Nutrition -> Calories)
    const caloriesInput = screen.getByLabelText('Calories');
    fireEvent.change(caloriesInput, { target: { value: '300' } });
    expect(caloriesInput.value).toBe('300');

    // Update array field (Instructions -> Step 1)
    const step1Input = screen.getByLabelText('Step 1 *');
    fireEvent.change(step1Input, { target: { value: 'Mix ingredients.' } });
    expect(step1Input.value).toBe('Mix ingredients.');
  });

  it('adds and removes dynamic array items', async () => {
    render(<RecipesPanel />);
    fireEvent.click(await screen.findByText('+ Add Recipe'));

    // Check adding an ingredient
    const initialQtyInputs = screen.getAllByLabelText('Qty').length;
    const addIngredientBtn = screen.getByText('+ Add Ingredient');
    fireEvent.click(addIngredientBtn);
    expect(screen.getAllByLabelText('Qty').length).toBe(initialQtyInputs + 1);

    // Check adding a preference tag
    const addTagBtn = screen.getByText('+ Add Tag');
    fireEvent.click(addTagBtn);
    const tagInputs = screen.getAllByPlaceholderText('Name (e.g. diet)');
    expect(tagInputs.length).toBe(2); // 1 default + 1 new

    // Check removing a preference tag
    const removeTagBtn = tagInputs[1].nextSibling.nextSibling; // The 'X' button next to the inputs
    fireEvent.click(removeTagBtn);
    expect(screen.getAllByPlaceholderText('Name (e.g. diet)').length).toBe(1);
  });

  it('submits the form successfully and calls createRecipe API', async () => {
    render(<RecipesPanel currentUser={{ token: 'mock-token' }} />);
    fireEvent.click(await screen.findByText('+ Add Recipe'));

    // Fill out ALL required fields to satisfy HTML validation
    
    // 1. Recipe Name
    const recipeNameInput = screen.getAllByLabelText('Name *')[0];
    fireEvent.change(recipeNameInput, { target: { name: 'name', value: 'Delicious Soup' } });

    // 2. Ingredient Name (The second 'Name *' label on the screen)
    const ingredientNameInput = screen.getAllByLabelText('Name *')[1];
    fireEvent.change(ingredientNameInput, { target: { value: 'Water' } });

    // 3. Instruction Step
    const instructionInput = screen.getByLabelText('Step 1 *');
    fireEvent.change(instructionInput, { target: { value: 'Boil it.' } });

    // Submit form
    const saveButton = screen.getByText('Save Recipe');
    fireEvent.click(saveButton);

    // Wait for the API call to process
    await waitFor(() => {
      expect(recipeServices.createRecipe).toHaveBeenCalled();
    });

    // Ensure the modal automatically closes upon successful submission
    await waitFor(() => {
      expect(screen.queryByText('Add Comprehensive Recipe')).not.toBeInTheDocument();
    });
  });
});