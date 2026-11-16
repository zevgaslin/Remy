// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import IngredientsPanel, { setSharedPlannedMeals } from './IngredientsPanel';
import * as ingredientServices from '../services/ingredientServices';
import * as trashSounds from '../utils/trashSounds';
import * as groceryListServices from '../services/groceryListServices';

vi.mock('../services/ingredientServices', () => ({
  getMyIngredients: vi.fn(),
  deleteIngredient: vi.fn(),
  toggleFavoriteIngredient: vi.fn(),
  createIngredient: vi.fn(),
  updateIngredient: vi.fn(),
}));

vi.mock('../services/groceryListServices', () => ({
  getGroceryList: vi.fn(),
  setGroceryItemChecked: vi.fn(),
  clearCheckedGroceryItems: vi.fn(),
}));

const emptyGroceryList = { from: '2030-01-01', to: '2030-01-07', plannedMeals: 0, items: [] };

vi.mock('../utils/trashSounds', () => ({
  playLidSound: vi.fn(),
  playTrashSound: vi.fn(),
  playRestoreSound: vi.fn(),
}));

const user = { id: 1, username: 'jordan', token: 'abc' };
const ingredients = [
  { id: 10, name: 'Milk', quantity: 1, unit: 'bottle', expirationDate: '2099-01-01', favorite: false, calories: 150, protein: 8, carbs: 12, fat: 8 },
  { id: 11, name: 'Eggs', quantity: 12, unit: 'pieces', expirationDate: '2099-01-02', favorite: true, calories: 70, protein: 6, carbs: 1, fat: 5 },
];

// Unmount anything rendered by the previous test
afterEach(() => {
  cleanup();
});

// The planned meals live in a shared module-level subject,
// so reset them before every test to keep tests independent.
beforeEach(() => {
  localStorage.clear();
  setSharedPlannedMeals({});
  groceryListServices.getGroceryList.mockResolvedValue(emptyGroceryList);
});

async function renderPanel() {
  render(<IngredientsPanel currentUser={user} />);
  await act(async () => {});
  const trash = screen.getByTestId('trash-can');
  trash.getBoundingClientRect = () => ({ left: 500, right: 560, top: 500, bottom: 560, width: 60, height: 60 });
  return trash;
}

function dragTo(row, x, y, { release = true } = {}) {
  fireEvent.pointerDown(row, { pointerType: 'mouse', button: 0, clientX: 10, clientY: 10 });
  fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: 40, clientY: 40 });
  fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: x, clientY: y });
  if (release) fireEvent.pointerUp(window, { pointerType: 'mouse', clientX: x, clientY: y });
}

describe('IngredientsPanel trash can', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    ingredientServices.getMyIngredients.mockResolvedValue(ingredients);
    ingredientServices.deleteIngredient.mockResolvedValue({ deleted: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens the lid while an ingredient hovers over the trash can', async () => {
    const trash = await renderPanel();

    dragTo(screen.getByText('Milk').closest('li'), 520, 520, { release: false });

    expect(trash).toHaveClass('trash-can--open');
    expect(screen.getByText('Let go to delete')).toBeInTheDocument();
    expect(trashSounds.playLidSound).toHaveBeenCalledTimes(1);
  });

  it('deletes an ingredient dropped on the trash can after the undo window', async () => {
    await renderPanel();

    dragTo(screen.getByText('Milk').closest('li'), 520, 520);

    expect(screen.queryByText('Milk')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Milk deleted');
    expect(trashSounds.playTrashSound).toHaveBeenCalledTimes(1);
    expect(ingredientServices.deleteIngredient).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(ingredientServices.deleteIngredient).toHaveBeenCalledWith('abc', 10);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('puts the ingredient back when Undo is clicked', async () => {
    await renderPanel();

    dragTo(screen.getByText('Milk').closest('li'), 520, 520);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(trashSounds.playRestoreSound).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(ingredientServices.deleteIngredient).not.toHaveBeenCalled();
  });

  it('keeps the ingredient when it is dropped somewhere else', async () => {
    await renderPanel();

    dragTo(screen.getByText('Milk').closest('li'), 100, 100);

    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(trashSounds.playTrashSound).not.toHaveBeenCalled();
  });

  it('trashes the focused ingredient with the Delete key', async () => {
    await renderPanel();

    fireEvent.keyDown(screen.getByText('Eggs').closest('li'), { key: 'Delete' });

    expect(screen.queryByText('Eggs')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Eggs deleted');
  });

  it('sends the previous delete right away when a second item is trashed', async () => {
    await renderPanel();

    dragTo(screen.getByText('Milk').closest('li'), 520, 520);
    dragTo(screen.getByText('Eggs').closest('li'), 520, 520);

    expect(ingredientServices.deleteIngredient).toHaveBeenCalledWith('abc', 10);
    expect(ingredientServices.deleteIngredient).not.toHaveBeenCalledWith('abc', 11);
    expect(screen.getByRole('status')).toHaveTextContent('Eggs deleted');
  });

  it('restores the ingredient and explains when the server delete fails', async () => {
    ingredientServices.deleteIngredient.mockRejectedValue(new Error('nope'));
    await renderPanel();

    dragTo(screen.getByText('Milk').closest('li'), 520, 520);
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Could not delete Milk');
  });
});

describe('IngredientsPanel pantry quantities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ingredientServices.getMyIngredients.mockResolvedValue(ingredients);
  });

  it('shows the quantity and unit next to each ingredient name', async () => {
    await renderPanel();

    expect(screen.getByText('· 1 bottle')).toBeInTheDocument();
    expect(screen.getByText('· 12 pieces')).toBeInTheDocument();
  });
});

describe('IngredientsPanel favorite foods & Supplements toggle bar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ingredientServices.getMyIngredients.mockResolvedValue(ingredients);
  });

  it('renders All Foods, Supplements, and Favorite foods in the toggle bar and switches between them', async () => {
    ingredientServices.toggleFavoriteIngredient.mockResolvedValue({
      ...ingredients[0],
      favorite: true,
    });
    await renderPanel();

    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['All Foods', 'Supplements', 'Favorite foods']);

    const favMilkBtn = screen.getByRole('button', { name: 'Favorite Milk' });
    expect(favMilkBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Unfavorite Eggs' })).toHaveAttribute('aria-pressed', 'true');

    // Filter to Favorite foods only before toggling Milk
    fireEvent.click(screen.getByRole('tab', { name: 'Favorite foods' }));
    expect(screen.queryByText('Milk')).not.toBeInTheDocument();
    expect(screen.getByText('Eggs')).toBeInTheDocument();

    // Switch to Supplements panel
    fireEvent.click(screen.getByRole('tab', { name: 'Supplements' }));
    expect(screen.getByTestId('supplements-panel')).toBeInTheDocument();
    expect(screen.queryByText('Eggs')).not.toBeInTheDocument();

    // Switch back to All Foods and favorite Milk
    fireEvent.click(screen.getByRole('tab', { name: 'All Foods' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Favorite Milk' }));
    });

    expect(ingredientServices.toggleFavoriteIngredient).toHaveBeenCalledWith('abc', 10, true);
    expect(screen.getByRole('button', { name: 'Unfavorite Milk' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('adds, edits, and deletes supplements with effect text boxes and trash can inside the Supplements panel', async () => {
    await renderPanel();

    fireEvent.click(screen.getByRole('tab', { name: 'Supplements' }));

    // Open Add Supplement modal (no quick presets, no Add to Nutrition Goals, no Add to Calendar Menu)
    fireEvent.click(screen.getByRole('button', { name: '+ Add Supplement' }));
    expect(screen.getByRole('dialog', { name: 'Add Supplement' })).toBeInTheDocument();
    expect(screen.queryByText('Quick presets:')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Add to Nutrition Goals')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Add to Calendar Menu')).not.toBeInTheDocument();

    // Manually fill supplement fields and effect text boxes
    fireEvent.change(screen.getByLabelText('Supplement Name'), { target: { value: 'Vitamin B12 Complex' } });
    fireEvent.change(screen.getByLabelText('Dosage / Serving'), { target: { value: '1000 mcg' } });
    fireEvent.change(screen.getByLabelText('Supplement effect 1'), { target: { value: '+ 490% B12' } });

    // Add another effect box and remove it
    fireEvent.click(screen.getByRole('button', { name: '+ Add Effect Message' }));
    expect(screen.getByLabelText('Supplement effect 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove effect 2' }));

    // Save the supplement
    fireEvent.click(screen.getByRole('button', { name: 'Add Supplement' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Verify it renders in the supplements list with its effect text boxes
    expect(screen.getByText('Vitamin B12 Complex')).toBeInTheDocument();
    expect(screen.getByText('+ 490% B12')).toBeInTheDocument();

    // Edit the supplement
    fireEvent.click(screen.getByRole('button', { name: 'Edit Vitamin B12 Complex' }));
    fireEvent.change(screen.getByLabelText('Supplement effect 1'), { target: { value: '+ 500% B12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Supplement' }));
    expect(screen.getByText('+ 500% B12')).toBeInTheDocument();

    // Delete the supplement via the trash can / Delete key
    fireEvent.keyDown(screen.getByText('Vitamin B12 Complex').closest('li'), { key: 'Delete' });
    expect(screen.queryByText('Vitamin B12 Complex')).not.toBeInTheDocument();
  });

  it('reverts the favorite state and shows an error toast if toggling fails', async () => {
    ingredientServices.toggleFavoriteIngredient.mockRejectedValue(new Error('Network error'));
    await renderPanel();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Favorite Milk' }));
    });

    expect(screen.getByRole('button', { name: 'Favorite Milk' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('Could not update favorite status for Milk.');
  });

  it('shows an empty message when filtering by Favorite foods with none marked', async () => {
    ingredientServices.getMyIngredients.mockResolvedValue([
      { id: 10, name: 'Milk', quantity: 1, unit: 'bottle', expirationDate: '2099-01-01', favorite: false },
    ]);
    await renderPanel();

    fireEvent.click(screen.getByRole('tab', { name: 'Favorite foods' }));
    expect(screen.getByText(/No favorite foods yet/)).toBeInTheDocument();
  });

  it('opens Add and Edit modals with favorite food option', async () => {
    ingredientServices.createIngredient.mockResolvedValue({
      id: 12,
      name: 'Avocado',
      quantity: 2,
      unit: 'each',
      expirationDate: '2099-01-05',
      favorite: true,
    });
    ingredientServices.updateIngredient.mockResolvedValue({
      ...ingredients[0],
      name: 'Oat Milk',
      favorite: true,
    });
    await renderPanel();

    // Open Add Ingredient modal
    fireEvent.click(screen.getByRole('button', { name: '+ Add Ingredient' }));
    const favCheckbox = screen.getByLabelText('Mark as favorite food');
    expect(favCheckbox).not.toBeChecked();
    fireEvent.click(favCheckbox);
    expect(favCheckbox).toBeChecked();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Avocado' } });
    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'each' } });
    fireEvent.change(screen.getByLabelText('Expiration Date'), { target: { value: '2099-01-05' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add Ingredient' }));
    });
    expect(ingredientServices.createIngredient).toHaveBeenCalledWith(
      'abc',
      expect.objectContaining({ name: 'Avocado', favorite: true }),
    );
    expect(screen.getByText('Avocado')).toBeInTheDocument();

    // Open Edit Ingredient modal
    fireEvent.click(screen.getByRole('button', { name: 'Edit Milk' }));
    const editFavCheckbox = screen.getByLabelText('Mark as favorite food');
    fireEvent.click(editFavCheckbox);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    });
    expect(ingredientServices.updateIngredient).toHaveBeenCalledWith(
      'abc',
      10,
      expect.objectContaining({ favorite: true }),
    );
  });
});

describe('IngredientsPanel grocery list (Observer)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ingredientServices.getMyIngredients.mockResolvedValue(ingredients);
    groceryListServices.getGroceryList.mockResolvedValue(emptyGroceryList);
  });

  it('shows the grocery list under the pantry and reloads it when the calendar changes', async () => {
    await renderPanel();
    expect(screen.getByRole('heading', { name: 'Grocery List' })).toBeInTheDocument();
    expect(groceryListServices.getGroceryList).toHaveBeenCalledTimes(1);
    expect(groceryListServices.getGroceryList).toHaveBeenCalledWith('abc', expect.any(String), expect.any(String));

    await act(async () => {
      setSharedPlannedMeals({ '2026-10-18::dinner': { id: 5, name: 'Cheese Omelet' } });
    });

    expect(groceryListServices.getGroceryList).toHaveBeenCalledTimes(2);
  });
});
