import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import WeeklyRecap, { WeeklyNutritionGraph, NUTRIENT_COLORS } from './WeeklyRecap';
import { MealLogProvider, MealEatenControl } from '../context/MealLogContext';
import { MealLogContext } from '../context/useMealLogs';
import { getWeeklyRecap, mealRequest, localDate } from '../services/mealLogServices';

vi.mock('../services/mealLogServices', async (original) => ({
  ...(await original()),
  getWeeklyRecap: vi.fn(),
  mealRequest: vi.fn(),
}));

const user = { id: 1, token: 'token' };
const empty = {
  weekStart: '2026-10-26',
  weekEnd: '2026-11-01',
  complete: true,
  mealsLogged: 0,
  daysLogged: 0,
  days: [],
  goalDays: { calories: 0, protein: 0, carbs: 0, fat: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
  getWeeklyRecap.mockResolvedValue(empty);
});

afterEach(cleanup);

async function settleUpdates() {
  await act(async () => {});
}

describe('WeeklyNutritionGraph Component', () => {
  it('renders with default empty recap and displays legend, gridlines, and day labels', () => {
    const { container } = render(<WeeklyNutritionGraph />);

    expect(screen.getByLabelText('Weekly nutrition graph')).toBeInTheDocument();
    expect(screen.getByText('Weekly nutrition vs. ideal goals')).toBeInTheDocument();

    for (const key of ['calories', 'protein', 'carbs', 'fat']) {
      expect(screen.getByTestId(`actual-line-${key}`)).toBeInTheDocument();
      expect(screen.getByTestId(`goal-line-${key}`)).toBeInTheDocument();
    }

    const gridLines = container.querySelectorAll('.recap-graph-grid-line');
    expect(gridLines).toHaveLength(5);

    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
  });

  it('renders custom day goals and values with tooltips for data points', () => {
    const customRecap = {
      weekStart: '2026-10-26',
      weekEnd: '2026-11-01',
      complete: false,
      mealsLogged: 1,
      daysLogged: 1,
      days: [
        {
          date: '2026-10-26',
          meals: [{ id: 10, recipeName: 'Eggs', servings: 1, calories: 500 }],
          totals: { calories: 500, protein: 30, carbs: 40, fat: 20 },
          goalsHit: { calories: false, protein: false, carbs: false, fat: false },
          goals: { calories: 2200, protein: 60, carbs: 300, fat: 80 },
        },
        {
          date: '2026-10-27',
          meals: [],
          totals: { calories: null, protein: null, carbs: null, fat: null },
          goalsHit: {},
          goals: null,
        },
      ],
      goalDays: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    };

    const { container } = render(
      <WeeklyNutritionGraph
        recap={customRecap}
        goals={{ calories: 2500, protein: 70, carbs: 320, fat: 85 }}
      />
    );

    const actualCaloriesLine = screen.getByTestId('actual-line-calories');
    const goalCaloriesLine = screen.getByTestId('goal-line-calories');

    expect(actualCaloriesLine).toHaveAttribute('stroke', NUTRIENT_COLORS.calories);
    expect(goalCaloriesLine).toHaveAttribute('stroke-dasharray', '6 4');

    const points = container.querySelectorAll('.recap-graph-point');
    expect(points.length).toBeGreaterThanOrEqual(7 * 4);
  });
});

describe('WeeklyRecap Component', () => {
  it('returns null and renders nothing when user has no authentication token', () => {
    const { container } = render(
      <MealLogProvider currentUser={null}>
        <WeeklyRecap />
      </MealLogProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows loading status while the weekly recap request is pending', async () => {
    const resolvers = [];
    getWeeklyRecap.mockImplementation(() => new Promise((resolve) => { resolvers.push(resolve); }));

    render(
      <MealLogProvider currentUser={user}>
        <WeeklyRecap />
      </MealLogProvider>
    );

    expect(screen.getByText('Loading recap…')).toBeInTheDocument();

    await act(async () => {
      resolvers.forEach((res) => res(empty));
    });

    expect(await screen.findByText('Complete')).toBeInTheDocument();
  });

  it('navigates between previous week, last completed week, and current week', async () => {
    render(
      <MealLogProvider currentUser={user}>
        <WeeklyRecap />
      </MealLogProvider>
    );

    expect(await screen.findByText('Complete')).toBeInTheDocument();

    const prevButton = screen.getByRole('button', { name: '← Previous week' });
    const lastCompletedButton = screen.getByRole('button', { name: 'Last completed week' });
    const nextButton = screen.getByRole('button', { name: 'Next week →' });

    expect(lastCompletedButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    // Click previous week (offset becomes -2)
    fireEvent.click(prevButton);
    expect(lastCompletedButton).toBeEnabled();

    // Click last completed week (offset returns to -1)
    fireEvent.click(lastCompletedButton);
    expect(lastCompletedButton).toBeDisabled();

    // Click next week (offset becomes 0, current week)
    fireEvent.click(nextButton);
    expect(nextButton).toBeDisabled();

    await settleUpdates();
  });

  it('displays detailed meals, serving quantities, calorie stats, and handles undo', async () => {
    const fullWeekRecap = {
      weekStart: '2026-10-26',
      weekEnd: '2026-11-01',
      complete: false,
      mealsLogged: 3,
      daysLogged: 2,
      days: [
        {
          date: '2026-10-26',
          meals: [
            { id: 101, recipeName: 'Avocado Toast', servings: 1, calories: 350 },
            { id: 102, recipeName: 'Mystery Snack', servings: 2, calories: null },
          ],
          totals: { calories: 350, protein: 12, carbs: 35, fat: 18 },
          goalsHit: { calories: false, protein: false, carbs: false, fat: true },
          goals: { calories: 2000, protein: 50, carbs: 275, fat: 78 },
        },
        {
          date: '2026-10-27',
          meals: [
            { id: 103, recipeName: 'Chicken Salad', servings: 1, calories: 450 },
          ],
          totals: { calories: null, protein: null, carbs: null, fat: null },
          goalsHit: { calories: null, protein: null, carbs: null, fat: null },
          goals: { calories: 2000, protein: 50, carbs: 275, fat: 78 },
        },
        {
          date: '2026-10-28',
          meals: [],
          totals: { calories: null, protein: null, carbs: null, fat: null },
          goalsHit: {},
          goals: null,
        },
      ],
      goalDays: { calories: 0, protein: 0, carbs: 0, fat: 1 },
    };

    getWeeklyRecap.mockResolvedValue(fullWeekRecap);
    mealRequest.mockResolvedValueOnce(null);

    render(
      <MealLogProvider currentUser={user}>
        <WeeklyRecap />
      </MealLogProvider>
    );

    expect(await screen.findByText('Week in progress')).toBeInTheDocument();
    expect(screen.getByText(/3 meals eaten/)).toBeInTheDocument();
    expect(screen.getByText(/2 of 7 days logged/)).toBeInTheDocument();

    // Check serving text variations
    expect(screen.getByText(/Avocado Toast · 1 serving · 350 kcal/)).toBeInTheDocument();
    expect(screen.getByText(/Mystery Snack · 2 servings · Calories unknown/)).toBeInTheDocument();

    // Check day summary with empty meals
    expect(screen.getByText(/No food logged/)).toBeInTheDocument();

    // Check goal hit / outside goal / unknown nutrition states
    expect(screen.getAllByText(/Outside goal/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Goal hit/)).toBeInTheDocument();
    expect(screen.getAllByText(/Unknown nutrition · Unknown/).length).toBeGreaterThan(0);

    // Test undoing a meal
    const undoButton = screen.getByRole('button', {
      name: 'Undo eaten Avocado Toast on 2026-10-26',
    });
    fireEvent.click(undoButton);
    await waitFor(() => {
      expect(mealRequest).toHaveBeenCalledWith('token', '/meal-logs/101', { method: 'DELETE' });
    });
  });

  it('displays an error message when undoing a meal fails', async () => {
    const recapWithMeal = {
      weekStart: '2026-10-26',
      weekEnd: '2026-11-01',
      complete: true,
      mealsLogged: 1,
      daysLogged: 1,
      days: [
        {
          date: '2026-10-26',
          meals: [{ id: 999, recipeName: 'Failed Soup', servings: 1, calories: 200 }],
          totals: { calories: 200, protein: 10, carbs: 20, fat: 5 },
          goalsHit: { calories: false, protein: false, carbs: false, fat: false },
          goals: { calories: 2000, protein: 50, carbs: 275, fat: 78 },
        },
      ],
      goalDays: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    };

    getWeeklyRecap.mockResolvedValue(recapWithMeal);
    mealRequest.mockRejectedValueOnce(new Error('Failed to delete meal'));

    render(
      <MealLogProvider currentUser={user}>
        <WeeklyRecap />
      </MealLogProvider>
    );

    expect(await screen.findByText(/Failed Soup/)).toBeInTheDocument();

    const undoButton = screen.getByRole('button', {
      name: 'Undo eaten Failed Soup on 2026-10-26',
    });
    fireEvent.click(undoButton);

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to delete meal');
  });

  it('renders context error and allows retrying meal history', async () => {
    const mockContext = {
      token: 'token',
      today: '2026-11-01',
      revision: 0,
      error: 'Meal history sync failure',
      ready: true,
      entries: [],
      undo: vi.fn(),
      retry: vi.fn(),
    };

    render(
      <MealLogContext.Provider value={mockContext}>
        <WeeklyRecap />
      </MealLogContext.Provider>
    );

    expect(screen.getByText(/Meal history sync failure/)).toBeInTheDocument();
    const retryHistoryButton = screen.getByRole('button', { name: 'Retry meal history' });
    fireEvent.click(retryHistoryButton);
    expect(mockContext.retry).toHaveBeenCalledTimes(1);
  });

  it('retries loading recap when clicking Retry recap after an error', async () => {
    getWeeklyRecap
      .mockRejectedValueOnce(new Error('Recap fetch failed'))
      .mockResolvedValueOnce(empty);

    render(
      <MealLogProvider currentUser={user}>
        <WeeklyRecap />
      </MealLogProvider>
    );

    const retryButton = await screen.findByRole('button', { name: 'Retry recap' });
    expect(screen.getByRole('alert')).toHaveTextContent('Recap fetch failed');

    fireEvent.click(retryButton);

    expect(await screen.findByText('Complete')).toBeInTheDocument();
    expect(screen.queryByText('Recap fetch failed')).not.toBeInTheDocument();
  });
});

describe('MealEatenControl Component', () => {
  it('saves servings and supports undo after a meal is marked eaten', async () => {
    const today = localDate();
    getWeeklyRecap.mockResolvedValue({ ...empty, days: [{ date: today, meals: [] }] });
    mealRequest.mockImplementation(async (token, path, options) => {
      if (options.method === 'DELETE') {
        getWeeklyRecap.mockResolvedValue({ ...empty, days: [{ date: today, meals: [] }] });
        return null;
      }
      const entry = { id: 4, eatenOn: today, slot: 'lunch', servings: 2 };
      getWeeklyRecap.mockResolvedValue({ ...empty, days: [{ date: today, meals: [entry] }] });
      return entry;
    });

    render(
      <MealLogProvider currentUser={user}>
        <MealEatenControl recipe={{ id: 7, name: 'Soup' }} day={new Date()} slot="lunch" />
      </MealLogProvider>
    );

    await waitFor(() => expect(screen.getByRole('button', { name: 'Mark as eaten' })).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Servings of Soup'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mark as eaten' }));

    expect(await screen.findByText(/Eaten · 2 servings/)).toBeInTheDocument();
    expect(JSON.parse(mealRequest.mock.calls[0][2].body)).toMatchObject({
      recipeId: 7,
      servings: 2,
      eatenOn: today,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Undo eaten' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Mark as eaten' })).toBeEnabled());
    expect(mealRequest).toHaveBeenCalledWith('token', '/meal-logs/4', { method: 'DELETE' });
  });

  it('does not allow future meals to be marked eaten', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    render(
      <MealLogProvider currentUser={user}>
        <MealEatenControl recipe={{ id: 7, name: 'Soup' }} day={tomorrow} slot="lunch" />
      </MealLogProvider>
    );

    await settleUpdates();
    expect(screen.getByRole('button', { name: 'Planned' })).toBeDisabled();
  });
});
