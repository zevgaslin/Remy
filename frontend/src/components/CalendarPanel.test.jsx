// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import CalendarPanel, {
  getDailyNutritionTotal,
  DailyNutritionSummary,
  VIEW_STRATEGIES,
} from './CalendarPanel';
import { getAllRecipes } from '../services/recipeServices';
import { getMealPlan, removePlannedMeal, saveDaySlots, savePlannedMeal } from '../services/mealPlanServices';
import { waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { plannedMealsSubject, setSharedPlannedMeals } from './IngredientsPanel';

// Mock the recipe service API call using Vitest's vi
vi.mock('../services/recipeServices', () => ({
  getAllRecipes: vi.fn(),
}));

vi.mock('../services/mealPlanServices', () => ({
  getMealPlan: vi.fn(),
  savePlannedMeal: vi.fn(),
  removePlannedMeal: vi.fn(),
  saveDaySlots: vi.fn(),
}));

// Unmount anything rendered by the previous test
afterEach(() => {
  cleanup();
});

// The planned meals and custom slots live in a shared module-level subject,
// so reset them before every test to keep tests independent.
beforeEach(() => {
  setSharedPlannedMeals({});
  plannedMealsSubject.setDailyMealSlots({});
});

describe('getDailyNutritionTotal', () => {
  it('returns combined nutrition totals for all planned meal slots on a specific date', () => {
    const fixedDate = new Date('2026-10-15T12:00:00Z');
    const mealSlots = [{ id: 'breakfast' }, { id: 'dinner' }];
    const mockMeals = {
      '2026-10-15-breakfast': {
        nutrition: { calories: 300, protein: 10, carbs: 40, fat: 10 },
      },
      '2026-10-15-dinner': {
        nutrition: { calories: 600, protein: 30, carbs: 50, fat: 20 },
      },
      '2026-10-16-breakfast': {
        nutrition: { calories: 500, protein: 20, carbs: 50, fat: 15 },
      },
    };

    const result = getDailyNutritionTotal(fixedDate, mockMeals, mealSlots);

    expect(result).toEqual({ calories: 900, protein: 40, carbs: 90, fat: 30 });
  });

  it('returns zeroes when there are no meals planned for the date', () => {
    const fixedDate = new Date('2026-10-15T12:00:00Z');
    const mealSlots = [{ id: 'breakfast' }, { id: 'lunch' }];
    const mockMeals = {};

    const result = getDailyNutritionTotal(fixedDate, mockMeals, mealSlots);

    expect(result).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('handles meals that are missing nutrition data gracefully without returning NaN', () => {
    const fixedDate = new Date('2026-10-15T12:00:00Z');
    const mealSlots = [{ id: 'snack' }];
    const mockMeals = {
      '2026-10-15-snack': { name: 'Apple' },
    };

    const result = getDailyNutritionTotal(fixedDate, mockMeals, mealSlots);

    expect(result).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('uses DEFAULT_MEAL_SLOTS when mealSlots argument is omitted', () => {
    const fixedDate = new Date('2026-10-15T12:00:00Z');
    const dKey = `${fixedDate.getFullYear()}-${String(fixedDate.getMonth() + 1).padStart(2, '0')}-${String(fixedDate.getDate()).padStart(2, '0')}`;
    const mockMeals = {
      [`${dKey}-breakfast`]: {
        nutrition: { calories: 250, protein: 15, carbs: 30, fat: 8 },
      },
    };

    const result = getDailyNutritionTotal(fixedDate, mockMeals);

    expect(result).toEqual({ calories: 250, protein: 15, carbs: 30, fat: 8 });
  });
});

describe('DailyNutritionSummary Component', () => {
  it('renders accurate daily totals and the percentage of each default goal', () => {
    const mockTotals = { calories: 1000, protein: 25, carbs: 137.5, fat: 39 };

    render(<DailyNutritionSummary totals={mockTotals} />);

    expect(screen.getByText('Cal: 1000')).toBeInTheDocument();
    expect(screen.getByText('Pro: 25g')).toBeInTheDocument();
    expect(screen.getByText('Carb: 137.5g')).toBeInTheDocument();
    expect(screen.getByText('Fat: 39g')).toBeInTheDocument();

    const percentageElements = screen.getAllByText('50%');
    expect(percentageElements).toHaveLength(4);
    expect(
      screen.getAllByRole('progressbar').map((bar) => bar.getAttribute('aria-valuenow'))
    ).toEqual(['50', '50', '50', '50']);
  });

  it('flags goals that are exceeded and caps the progress bar at 100%', () => {
    const massiveTotals = { calories: 5000, protein: 200, carbs: 500, fat: 150 };

    render(<DailyNutritionSummary totals={massiveTotals} />);

    expect(screen.getByText('250% · over')).toBeInTheDocument();
    expect(screen.getByText('400% · over')).toBeInTheDocument();
    expect(
      screen.getAllByRole('progressbar').map((bar) => bar.getAttribute('aria-valuenow'))
    ).toEqual(['100', '100', '100', '100']);
  });

  it('compares totals against the goals it is given', () => {
    const totals = { calories: 1500, protein: 90, carbs: 100, fat: 40 };
    const goals = { calories: 3000, protein: 180, carbs: 400, fat: 80 };

    render(<DailyNutritionSummary totals={totals} goals={goals} />);

    expect(screen.getAllByText('50%')).toHaveLength(3);
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Protein: 90 of 180 g' })
    ).toBeInTheDocument();
  });
});

describe('CalendarPanel Recipe Popup Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens the recipe selection popup and fetches data when an empty meal slot is clicked', async () => {
    getAllRecipes.mockResolvedValueOnce([{ id: 'r1', name: 'Avocado Toast' }]);

    render(<CalendarPanel />);

    const addButtons = screen.getAllByRole('button', { name: /Add .* for/i });
    fireEvent.click(addButtons[0]);

    expect(screen.getByText('Select a Recipe')).toBeInTheDocument();
    expect(screen.getByText('Loading recipes...')).toBeInTheDocument();

    const recipeItem = await screen.findByText('Avocado Toast');
    expect(recipeItem).toBeInTheDocument();
    expect(getAllRecipes).toHaveBeenCalledTimes(1);
  });

  it('adds a recipe to the calendar, supports hover state, and closes the popup when selected', async () => {
    const mockRecipe = {
      id: 'r2',
      name: 'Spicy Tacos',
      nutrition: { calories: 450, protein: 20, carbs: 50, fat: 18 },
    };
    getAllRecipes.mockResolvedValueOnce([mockRecipe]);

    render(<CalendarPanel />);

    const addButtons = screen.getAllByRole('button', { name: /Add .* for/i });
    fireEvent.click(addButtons[0]);

    const recipeItem = await screen.findByText('Spicy Tacos');
    fireEvent.mouseEnter(recipeItem);
    fireEvent.mouseLeave(recipeItem);
    fireEvent.click(recipeItem);

    expect(screen.queryByText('Select a Recipe')).not.toBeInTheDocument();
    expect(screen.getByText('Spicy Tacos')).toBeInTheDocument();
  });

  it('shows a failed load and lets the user retry successfully', async () => {
    getAllRecipes.mockRejectedValueOnce(new Error('Could not reach the backend.'));
    getAllRecipes.mockResolvedValueOnce([{ id: 'retry-recipe', name: 'Retry Pasta' }]);

    render(<CalendarPanel />);

    fireEvent.click(screen.getAllByRole('button', { name: /Add .* for/i })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not reach the backend.'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry loading recipes' }));
    expect(await screen.findByText('Retry Pasta')).toBeInTheDocument();
    expect(screen.queryByText('Loading recipes...')).not.toBeInTheDocument();
  });

  it('closes the popup without making changes when the close button is clicked', async () => {
    getAllRecipes.mockResolvedValueOnce([]);

    render(<CalendarPanel />);

    const addButtons = screen.getAllByRole('button', { name: /Add .* for/i });
    fireEvent.click(addButtons[0]);

    expect(screen.getByText('Select a Recipe')).toBeInTheDocument();
    expect(await screen.findByText('No recipes are available yet.')).toBeInTheDocument();

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(screen.queryByText('Select a Recipe')).not.toBeInTheDocument();
  });

  it('keeps planned meals after the calendar is unmounted and remounted (tab switch)', async () => {
    getAllRecipes.mockResolvedValueOnce([{ id: 'r9', name: 'Keeper Soup' }]);

    const { unmount } = render(<CalendarPanel />);
    fireEvent.click(screen.getAllByRole('button', { name: /Add Breakfast for/i })[0]);
    fireEvent.click(await screen.findByText('Keeper Soup'));
    unmount();

    render(<CalendarPanel />);
    expect(screen.getByText('Keeper Soup')).toBeInTheDocument();
  });
});

describe('CalendarPanel View Strategies & Timeline Compression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders compressed time ranges starting and ending at 12 AM in the Today view', () => {
    render(<CalendarPanel />);

    // Default meals are at 8 AM, 12 PM, 3 PM, 6 PM
    // Consecutive unused gaps > 2 hours should be combined into range labels:
    expect(screen.getByText('12 AM – 7 AM')).toBeInTheDocument();
    expect(screen.getByText('9 AM – 11 AM')).toBeInTheDocument();
    expect(screen.getByText('7 PM – 12 AM')).toBeInTheDocument();

    // Gaps of 2 hours or fewer (1 PM & 2 PM; 4 PM & 5 PM) remain single-hour rows:
    expect(screen.getByText('1 PM')).toBeInTheDocument();
    expect(screen.getByText('2 PM')).toBeInTheDocument();
    expect(screen.getByText('4 PM')).toBeInTheDocument();
    expect(screen.getByText('5 PM')).toBeInTheDocument();
  });

  it('switches between Today, This Week, Next 7 Days, and Month views using VIEW_STRATEGIES', async () => {
    getAllRecipes.mockResolvedValueOnce([
      {
        id: 'r-dot',
        name: 'Oatmeal',
        nutrition: { calories: 200, protein: 8, carbs: 35, fat: 4 },
      },
    ]);

    const { container } = render(<CalendarPanel />);

    // Plan a meal on Today so Month view renders a meal-dot indicator
    fireEvent.click(screen.getAllByRole('button', { name: /Add Breakfast for/i })[0]);
    fireEvent.click(await screen.findByText('Oatmeal'));

    // Switch to This Week view
    fireEvent.click(screen.getByRole('button', { name: 'This Week' }));
    expect(screen.getAllByRole('button', { name: /Add meals for/i })).toHaveLength(7);

    // Switch to Next 7 Days view
    fireEvent.click(screen.getByRole('button', { name: 'Next 7 Days' }));
    expect(screen.getAllByRole('button', { name: /Add meals for/i })).toHaveLength(7);
    // Switch to Month view
    fireEvent.click(screen.getByRole('button', { name: 'Month' }));
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(container.querySelector('.meal-dot')).toBeInTheDocument();

    // Verify VIEW_STRATEGIES registry exports expected keys
    expect(Object.keys(VIEW_STRATEGIES)).toEqual(['day', 'week', 'next7', 'month']);
  });
});

describe('Per-Day Meal Slot Management (Add & Remove Meals)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a meal slot for a specific day when clicking its × button', () => {
    render(<CalendarPanel />);

    expect(screen.getByText('Breakfast (8 AM)')).toBeInTheDocument();

    const removeBreakfastBtn = screen.getByRole('button', {
      name: /Remove Breakfast on/i,
    });
    fireEvent.click(removeBreakfastBtn);

    expect(screen.queryByText('Breakfast (8 AM)')).not.toBeInTheDocument();
  });

  it('opens the Add Meal modal, adds a custom timed meal to a single day, and closes on Cancel', () => {
    render(<CalendarPanel />);

    // Open and cancel modal first
    fireEvent.click(screen.getByRole('button', { name: '+ Add Meals' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Open modal and submit a custom meal at 10:30 AM
    fireEvent.click(screen.getByRole('button', { name: '+ Add Meals' }));
    fireEvent.change(screen.getByPlaceholderText(/Pre-Workout/i), {
      target: { value: 'Second Breakfast' },
    });
    fireEvent.change(screen.getByLabelText('Time'), {
      target: { value: '10:30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Meal' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Second Breakfast (10:30 AM)')).toBeInTheDocument();
  });

  it('adds a custom meal across all 7 days when the checkbox is selected in This Week view', () => {
    render(<CalendarPanel />);

    // Switch to This Week view (7 days)
    fireEvent.click(screen.getByRole('button', { name: 'This Week' }));

    const addMealsButtons = screen.getAllByRole('button', { name: /Add meals for/i });
    fireEvent.click(addMealsButtons[0]);

    // Fill out meal name, time, and check "Add this meal to all 7 days of the week"
    fireEvent.change(screen.getByPlaceholderText(/Pre-Workout/i), {
      target: { value: 'Evening Tea' },
    });
    fireEvent.change(screen.getByLabelText('Time'), {
      target: { value: '20:00' },
    });
    fireEvent.click(
      screen.getByLabelText('Add this meal to all 7 days of the week')
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add Meal' }));

    // Verify all 7 columns received the new meal slot
    expect(screen.getAllByText('Evening Tea (8 PM)')).toHaveLength(7);

    // Delete it from just the first day and verify 6 remain
    const removeButtons = screen.getAllByRole('button', {
      name: /Remove Evening Tea on/i,
    });
    fireEvent.click(removeButtons[0]);
    expect(screen.getAllByText('Evening Tea (8 PM)')).toHaveLength(6);
  });
});

describe('CalendarPanel saved meal plan', () => {
  const user = { id: 1, username: 'jordan', token: 'user-token' };
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  beforeEach(() => {
    vi.clearAllMocks();
    getMealPlan.mockResolvedValue({ meals: [], daySlots: {} });
    savePlannedMeal.mockResolvedValue({});
    removePlannedMeal.mockResolvedValue({});
    saveDaySlots.mockResolvedValue({});
  });

  it('removes a planned recipe but keeps its meal slot', async () => {
    getMealPlan.mockResolvedValue({
      meals: [{ date: todayKey, slotId: 'lunch', recipe: { id: 6, name: 'Leftover Curry' } }],
      daySlots: {},
    });
    render(<CalendarPanel currentUser={user} />);
    expect(await screen.findByText('Leftover Curry')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Remove Leftover Curry from Lunch on/i }));

    expect(screen.queryByText('Leftover Curry')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Lunch for/i })).toBeInTheDocument();
    expect(removePlannedMeal).toHaveBeenCalledWith('user-token', todayKey, 'lunch');
    expect(saveDaySlots).not.toHaveBeenCalled();
  });

  it('loads the saved plan for a logged-in user', async () => {
    getMealPlan.mockResolvedValue({
      meals: [{ date: todayKey, slotId: 'custom-brunch', recipe: { id: 4, name: 'Saved Shakshuka' } }],
      daySlots: { [todayKey]: [{ id: 'custom-brunch', label: 'Brunch', time: '10:00', hour: 10 }] },
    });

    render(<CalendarPanel currentUser={user} />);

    expect(await screen.findByText('Saved Shakshuka')).toBeInTheDocument();
    expect(screen.getByText('Brunch (10 AM)')).toBeInTheDocument();
    expect(screen.queryByText('Breakfast (8 AM)')).not.toBeInTheDocument();
    expect(getMealPlan).toHaveBeenCalledWith('user-token');
  });

  it('saves a chosen recipe and a removed slot to the server', async () => {
    getAllRecipes.mockResolvedValueOnce([{ id: 7, name: 'Saved Oats' }]);
    render(<CalendarPanel currentUser={user} />);
    await waitFor(() => expect(getMealPlan).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /Add Breakfast for/i }));
    fireEvent.click(await screen.findByText('Saved Oats'));
    expect(savePlannedMeal).toHaveBeenCalledWith('user-token', todayKey, 'breakfast', 7);

    fireEvent.click(screen.getByRole('button', { name: /Remove Lunch on/i }));
    expect(saveDaySlots).toHaveBeenCalledWith(
      'user-token',
      todayKey,
      expect.not.arrayContaining([expect.objectContaining({ id: 'lunch' })]),
    );
  });

  it('tells the user when a change could not be saved', async () => {
    saveDaySlots.mockRejectedValue(new Error('Could not save your meal times.'));
    render(<CalendarPanel currentUser={user} />);
    await waitFor(() => expect(getMealPlan).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /Remove Lunch on/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save your meal times.');
  });

  it('clears the plan on log out and does not save guest changes', async () => {
    getMealPlan.mockResolvedValue({
      meals: [{ date: todayKey, slotId: 'dinner', recipe: { id: 5, name: 'Private Pasta' } }],
      daySlots: {},
    });
    const { rerender } = render(<CalendarPanel currentUser={user} />);
    expect(await screen.findByText('Private Pasta')).toBeInTheDocument();

    rerender(<CalendarPanel />);
    expect(screen.queryByText('Private Pasta')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Remove Lunch on/i }));
    expect(saveDaySlots).not.toHaveBeenCalled();
  });

  it('lets guests remove a planned recipe without saving anything', async () => {
    getAllRecipes.mockResolvedValueOnce([{ id: 8, name: 'Guest Granola' }]);
    render(<CalendarPanel />);

    fireEvent.click(screen.getByRole('button', { name: /Add Breakfast for/i }));
    fireEvent.click(await screen.findByText('Guest Granola'));
    fireEvent.click(screen.getByRole('button', { name: /Remove Guest Granola from Breakfast on/i }));

    expect(screen.queryByText('Guest Granola')).not.toBeInTheDocument();
    expect(screen.getByText('Breakfast (8 AM)')).toBeInTheDocument();
    expect(removePlannedMeal).not.toHaveBeenCalled();
  });
});
