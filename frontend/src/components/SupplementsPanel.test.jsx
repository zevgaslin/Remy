// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SupplementsPanel from './SupplementsPanel';
import CalendarPanel from './CalendarPanel';
import WeeklyRecap from './WeeklyRecap';
import { MealLogProvider } from '../context/MealLogContext';
import * as mealLogServices from '../services/mealLogServices';
import * as trashSounds from '../utils/trashSounds';

vi.mock('../services/recipeServices', () => ({
  getAllRecipes: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/calendarServices', async (original) => ({
  ...(await original()),
  getCalendar: vi.fn().mockResolvedValue({ plannedMeals: {}, dailyMealSlots: {}, revision: 0 }),
  saveCalendar: vi.fn().mockResolvedValue({ plannedMeals: {}, dailyMealSlots: {}, revision: 1 }),
}));

vi.mock('../services/mealLogServices', async (original) => ({
  ...(await original()),
  getWeeklyRecap: vi.fn(),
  mealRequest: vi.fn(),
}));

vi.mock('../utils/trashSounds', () => ({
  playLidSound: vi.fn(),
  playTrashSound: vi.fn(),
  playRestoreSound: vi.fn(),
}));

const user = { id: 1, username: 'jordan', token: 'supp-token' };

function dragTo(row, x, y, { release = true } = {}) {
  fireEvent.pointerDown(row, { pointerType: 'mouse', button: 0, clientX: 10, clientY: 10 });
  fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: 40, clientY: 40 });
  fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: x, clientY: y });
  if (release) fireEvent.pointerUp(window, { pointerType: 'mouse', clientX: x, clientY: y });
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(cleanup);

describe('SupplementsPanel & Real-Life Supplement Integration', () => {
  it('adds supplements in pantry without presets or nutrition goals option, edits fields, and trashes via TrashCan or Delete key', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<SupplementsPanel currentUser={user} />);
    const trash = screen.getByTestId('trash-can');
    trash.getBoundingClientRect = () => ({ left: 500, right: 560, top: 500, bottom: 560, width: 60, height: 60 });

    // Open Add Supplement modal and close with X button
    fireEvent.click(screen.getByRole('button', { name: '+ Add Supplement' }));
    expect(screen.queryByText('Quick presets:')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Add to Nutrition Goals')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Add to Calendar Menu')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close supplement modal' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Reopen and manually add Whey Protein Isolate
    fireEvent.click(screen.getByRole('button', { name: '+ Add Supplement' }));
    fireEvent.change(screen.getByLabelText('Supplement Name'), { target: { value: 'Whey Protein Isolate' } });
    fireEvent.change(screen.getByLabelText('Dosage / Serving'), { target: { value: '2 scoops (60g)' } });
    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'scoop' } });
    fireEvent.change(screen.getByLabelText('Supplement effect 1'), { target: { value: '+ 25g Fast-Absorbing Protein' } });
    fireEvent.change(screen.getByLabelText('Calories'), { target: { value: '240' } });
    fireEvent.change(screen.getByLabelText('Protein (g)'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Carbs (g)'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Fat (g)'), { target: { value: '2' } });

    fireEvent.click(screen.getByRole('button', { name: 'Add Supplement' }));

    expect(screen.getByText('Whey Protein Isolate')).toBeInTheDocument();
    expect(screen.getByText('240 kcal')).toBeInTheDocument();
    expect(screen.getByText('50g protein')).toBeInTheDocument();
    expect(screen.getByText('4g carbs')).toBeInTheDocument();
    expect(screen.getByText('2g fat')).toBeInTheDocument();
    expect(screen.getByText('+ 25g Fast-Absorbing Protein')).toBeInTheDocument();
    expect(screen.queryByText('In Nutrition Goals')).not.toBeInTheDocument();

    // Drag to trash can and test Undo
    const row = screen.getByText('Whey Protein Isolate').closest('li');
    dragTo(row, 520, 520);
    expect(screen.queryByText('Whey Protein Isolate')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Whey Protein Isolate deleted');
    expect(trashSounds.playTrashSound).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByText('Whey Protein Isolate')).toBeInTheDocument();
    expect(trashSounds.playRestoreSound).toHaveBeenCalledTimes(1);

    // Delete with keyboard Delete key and let timer expire
    fireEvent.keyDown(screen.getByText('Whey Protein Isolate').closest('li'), { key: 'Delete' });
    expect(screen.queryByText('Whey Protein Isolate')).not.toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('validates supplement name and closes modal on backdrop click', () => {
    const { container } = render(<SupplementsPanel currentUser={user} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Add Supplement' }));

    const nameInput = screen.getByLabelText('Supplement Name');
    fireEvent.change(nameInput, { target: { value: '   ' } });
    fireEvent.submit(nameInput.closest('form'));
    expect(screen.getByRole('alert')).toHaveTextContent('Supplement name is required.');

    fireEvent.click(container.querySelector('.auth-modal-backdrop'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('tells the user to add supplements in the Pantry first if none exist when opening Calendar Add Supplement', () => {
    render(<CalendarPanel currentUser={null} />);

    fireEvent.click(screen.getByRole('button', { name: '+ Add Supplement' }));
    expect(screen.getByText(/No supplements in your pantry yet/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('picks a supplement from the pantry on Calendar, sets time and frequency, displays on meal slot, and marks taken', async () => {
    // First add a supplement in Pantry
    render(<SupplementsPanel currentUser={user} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Add Supplement' }));
    fireEvent.change(screen.getByLabelText('Supplement Name'), { target: { value: 'Vitamin B12 Complex' } });
    fireEvent.change(screen.getByLabelText('Dosage / Serving'), { target: { value: '1000 mcg' } });
    fireEvent.change(screen.getByLabelText('Supplement effect 1'), { target: { value: '+ 490% B12' } });
    fireEvent.change(screen.getByLabelText('Calories'), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText('Protein (g)'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Supplement' }));
    cleanup();

    // Now schedule it on the Calendar
    render(<CalendarPanel currentUser={user} />);
    await act(async () => {});

    fireEvent.click(screen.getByRole('button', { name: '+ Add Supplement' }));
    expect(screen.getByRole('dialog', { name: 'Add Supplement to Calendar' })).toBeInTheDocument();

    const pantrySelect = screen.getByLabelText('Pantry Supplement');
    expect(pantrySelect).toHaveTextContent('Vitamin B12 Complex (1000 mcg)');

    const timeSelect = screen.getByLabelText('Supplement Time');
    expect(timeSelect.querySelectorAll('option')).toHaveLength(24);
    expect(timeSelect).toHaveTextContent('5:00 PM');

    fireEvent.change(screen.getByLabelText('Supplement Frequency'), { target: { value: 'daily' } });
    fireEvent.change(timeSelect, { target: { value: '17:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Supplement' }));

    expect(screen.queryByRole('dialog', { name: 'Add Supplement to Calendar' })).not.toBeInTheDocument();
    expect(screen.getByText(/5 PM · Vitamin B12 Complex \(1000 mcg\)/)).toBeInTheDocument();
    expect(screen.getByLabelText('Daily supplement effects')).toHaveTextContent('+ 490% B12');
    expect(screen.getByText('Cal: 15')).toBeInTheDocument();
    expect(screen.getByText('Pro: 3g')).toBeInTheDocument();

    // Mark taken and undo taken on the calendar slot
    const takeButton = screen.getByRole('button', { name: /Mark Vitamin B12 Complex taken on/i });
    fireEvent.click(takeButton);
    const undoTakeButton = screen.getByRole('button', { name: /Undo taken Vitamin B12 Complex on/i });
    expect(undoTakeButton).toHaveTextContent('✓ Taken');
    fireEvent.click(undoTakeButton);
    expect(screen.getByRole('button', { name: /Mark Vitamin B12 Complex taken on/i })).toHaveTextContent('Take');
  });

  it('shows supplement benefits and daily scheduled supplements on WeeklyRecap once scheduled on Calendar', async () => {
    render(<SupplementsPanel currentUser={user} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Add Supplement' }));
    fireEvent.change(screen.getByLabelText('Supplement Name'), { target: { value: 'Vitamin B12 Complex' } });
    fireEvent.change(screen.getByLabelText('Supplement effect 1'), { target: { value: '+ 490% B12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Supplement' }));
    cleanup();

    render(<CalendarPanel currentUser={user} />);
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: '+ Add Supplement' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Supplement' }));
    cleanup();

    mealLogServices.getWeeklyRecap.mockResolvedValue({
      weekStart: '2026-10-26',
      weekEnd: '2026-11-01',
      complete: true,
      mealsLogged: 1,
      daysLogged: 1,
      days: [
        {
          date: '2026-10-26',
          meals: [{ id: 1, recipeName: 'Oatmeal', servings: 1, calories: 300 }],
          totals: { calories: 300, protein: 10, carbs: 50, fat: 5 },
          goalsHit: { calories: false, protein: false, carbs: false, fat: false },
          goals: { calories: 2000, protein: 50, carbs: 275, fat: 78 },
        },
      ],
      goalDays: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    });

    render(
      <MealLogProvider currentUser={user}>
        <WeeklyRecap />
      </MealLogProvider>,
    );

    expect(await screen.findByLabelText('Weekly supplement effects')).toHaveTextContent('+ 490% B12');
    expect(screen.getByText(/1 supplement/)).toBeInTheDocument();
  });
});
