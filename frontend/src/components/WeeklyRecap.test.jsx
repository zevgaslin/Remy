import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, it, expect, vi } from 'vitest';
import WeeklyRecap from './WeeklyRecap';
import { MealLogProvider, MealEatenControl } from '../context/MealLogContext';
import { getWeeklyRecap, mealRequest, localDate } from '../services/mealLogServices';
vi.mock('../services/mealLogServices', async original => ({ ...await original(), getWeeklyRecap: vi.fn(), mealRequest: vi.fn() }));
const user = { id: 1, token: 'token' };
const empty = { weekStart: '2026-10-26', weekEnd: '2026-11-01', complete: true, mealsLogged: 0, daysLogged: 0, days: [], goalDays: { calories: 0, protein: 0, carbs: 0, fat: 0 } };
beforeEach(() => { vi.clearAllMocks(); getWeeklyRecap.mockResolvedValue(empty); });
afterEach(cleanup);

async function settleUpdates() {
  await act(async () => {});
}
it('shows a completed recap and explains missing logging', async () => {
  render(<MealLogProvider currentUser={user}><WeeklyRecap /></MealLogProvider>);
  expect(await screen.findByText('Complete')).toBeInTheDocument();
  expect(screen.getByText(/0 of 7 days logged/)).toBeInTheDocument();
  expect(screen.getByText(/No meals logged for this week/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next week →' }));
  expect(screen.getByRole('button', { name: 'Next week →' })).toBeDisabled();
  await settleUpdates();
});
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
  render(<MealLogProvider currentUser={user}><MealEatenControl recipe={{ id: 7, name: 'Soup' }} day={new Date()} slot="lunch" /></MealLogProvider>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Mark as eaten' })).toBeEnabled());
  fireEvent.change(screen.getByLabelText('Servings of Soup'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Mark as eaten' }));
  expect(await screen.findByText(/Eaten · 2 servings/)).toBeInTheDocument();
  expect(JSON.parse(mealRequest.mock.calls[0][2].body)).toMatchObject({ recipeId: 7, servings: 2, eatenOn: today });
  fireEvent.click(screen.getByRole('button', { name: 'Undo eaten' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Mark as eaten' })).toBeEnabled());
  expect(mealRequest).toHaveBeenCalledWith('token', '/meal-logs/4', { method: 'DELETE' });
});
it('does not allow future meals to be marked eaten', async () => {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  render(<MealLogProvider currentUser={user}><MealEatenControl recipe={{ id: 7, name: 'Soup' }} day={tomorrow} slot="lunch" /></MealLogProvider>);
  await settleUpdates();
  expect(screen.getByRole('button', { name: 'Planned' })).toBeDisabled();
});
it('shows a retry action when recap loading fails', async () => {
  getWeeklyRecap.mockRejectedValue(new Error('Connection lost'));
  render(<MealLogProvider currentUser={user}><WeeklyRecap /></MealLogProvider>);
  expect(await screen.findByRole('button', { name: 'Retry recap' })).toBeInTheDocument();
});
