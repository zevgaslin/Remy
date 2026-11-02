import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import IngredientsPanel from './IngredientsPanel';
import { getMyIngredients, updateIngredient, createIngredient, deleteIngredient } from '../services/ingredientServices';
vi.mock('../services/ingredientServices', () => ({ getMyIngredients: vi.fn(), updateIngredient: vi.fn(), createIngredient: vi.fn(), deleteIngredient: vi.fn() }));
const user = { id: 1, token: 'abc' };
const item = { id: 10, name: 'Milk', quantity: 1000, unit: 'ml', expirationDate: '2099-01-01', calories: 0.5, protein: 0.03, carbs: 0, fat: null };
beforeEach(() => { vi.clearAllMocks(); getMyIngredients.mockResolvedValue([item]); });
afterEach(cleanup);
async function edit() {
  render(<IngredientsPanel currentUser={user} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Edit Milk' }));
}
it('prefills every field and saves changes to the existing ingredient', async () => {
  await edit();
  expect(screen.getByLabelText('Name')).toHaveValue('Milk');
  expect(screen.getByLabelText('Quantity')).toHaveValue(1000);
  expect(screen.getByLabelText('Unit')).toHaveValue('ml');
  expect(screen.getByLabelText('Expiration Date')).toHaveValue('2099-01-01');
  expect(screen.getByLabelText('Calories')).toHaveValue(0.5);
  expect(screen.getByLabelText('Carbs (g)')).toHaveValue(0);
  expect(screen.getByLabelText('Fat (g)')).toHaveValue(null);
  const changed = { ...item, name: 'Oat milk', quantity: 250, unit: 'g', expirationDate: '2099-02-02', calories: 1, protein: 0.04, carbs: null, fat: 0.02 };
  updateIngredient.mockResolvedValue(changed);
  for (const [label, value] of Object.entries({ Name: 'Oat milk', Quantity: '250', Unit: 'g', 'Expiration Date': '2099-02-02', Calories: '1', 'Protein (g)': '0.04', 'Carbs (g)': '', 'Fat (g)': '0.02' })) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(updateIngredient).toHaveBeenCalledWith('abc', 10, { name: 'Oat milk', quantity: 250, unit: 'g', expirationDate: '2099-02-02', calories: 1, protein: 0.04, carbs: null, fat: 0.02 });
  expect(await screen.findByRole('button', { name: 'Edit Oat milk' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Edit Milk' })).not.toBeInTheDocument();
  expect(screen.getByLabelText('Pantry nutrition totals')).toHaveTextContent('250 kcal');
  expect(createIngredient).not.toHaveBeenCalled();
});
it('closing the editor discards unsaved changes', async () => {
  await edit();
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Changed' } });
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit Milk' }));
  expect(screen.getByLabelText('Name')).toHaveValue('Milk');
  expect(updateIngredient).not.toHaveBeenCalled();
});
it('keeps edits on failure and lets the user retry', async () => {
  updateIngredient.mockRejectedValueOnce(new Error('Save failed')).mockResolvedValueOnce({ ...item, quantity: 500 });
  await edit();
  fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '500' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Save failed');
  expect(screen.getByLabelText('Quantity')).toHaveValue(500);
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(updateIngredient).toHaveBeenCalledTimes(2);
});
it('does not delete ingredients when pressing Backspace on the edit button', async () => {
  render(<IngredientsPanel currentUser={user} />);
  const button = await screen.findByRole('button', { name: 'Edit Milk' });
  fireEvent.keyDown(button, { key: 'Backspace' });
  expect(screen.getByRole('button', { name: 'Edit Milk' })).toBeInTheDocument();
  expect(deleteIngredient).not.toHaveBeenCalled();
});
