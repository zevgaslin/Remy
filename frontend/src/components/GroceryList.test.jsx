// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, act, cleanup, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import GroceryList from './GroceryList';
import * as groceryListServices from '../services/groceryListServices';

vi.mock('../services/groceryListServices', () => ({
  getGroceryList: vi.fn(),
  setGroceryItemChecked: vi.fn(),
  clearCheckedGroceryItems: vi.fn(),
}));

const list = {
  from: '2030-05-01',
  to: '2030-05-07',
  plannedMeals: 3,
  items: [
    { key: 'egg', name: 'Eggs', amount: '7', have: '', recipes: ['Omelet', 'Pancakes'], checked: true },
    { key: 'flour', name: 'Flour', amount: '4 cup', have: '', recipes: ['Pancakes'], checked: false },
    { key: 'salt', name: 'Salt', amount: '', have: '', recipes: ['Omelet'], checked: false },
  ],
};

async function renderList(props = {}) {
  render(<GroceryList token="abc" ingredients={[]} {...props} />);
  await act(async () => {});
}

function rowFor(name) {
  return screen.getByText(name).closest('li');
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  vi.clearAllMocks();
  groceryListServices.getGroceryList.mockResolvedValue(list);
  groceryListServices.setGroceryItemChecked.mockResolvedValue({});
  groceryListServices.clearCheckedGroceryItems.mockResolvedValue({});
});

describe('GroceryList', () => {
  it("asks for the next 7 days in the user's local time by default", async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2030, 4, 28, 23, 30)); // May 28, late evening local time
    await renderList();
    expect(groceryListServices.getGroceryList).toHaveBeenCalledWith('abc', '2030-05-28', '2030-06-03');
  });

  it('shows each item with its amount and recipes, unchecked items first', async () => {
    await renderList();
    const names = screen.getAllByRole('listitem').map((row) => within(row).getByRole('checkbox').closest('label').textContent);
    expect(names).toEqual(['Flour', 'Salt', 'Eggs']);
    expect(within(rowFor('Flour')).getByText('4 cup')).toBeInTheDocument();
    expect(within(rowFor('Eggs')).getByText('Omelet, Pancakes')).toBeInTheDocument();
    expect(within(rowFor('Salt')).getByText('Amount not listed')).toBeInTheDocument();
    expect(within(rowFor('Eggs')).getByRole('checkbox')).toBeChecked();
  });

  it('saves a check-off and rolls it back if saving fails', async () => {
    await renderList();
    fireEvent.click(within(rowFor('Flour')).getByRole('checkbox'));
    expect(groceryListServices.setGroceryItemChecked).toHaveBeenCalledWith('abc', 'flour', true);
    expect(within(rowFor('Flour')).getByRole('checkbox')).toBeChecked();

    groceryListServices.setGroceryItemChecked.mockRejectedValueOnce(new Error('Could not update that grocery item.'));
    await act(async () => {
      fireEvent.click(within(rowFor('Salt')).getByRole('checkbox'));
    });
    expect(within(rowFor('Salt')).getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not update that grocery item.');
  });

  it('clears every checked item', async () => {
    await renderList();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Clear 1 checked' }));
    });
    expect(groceryListServices.clearCheckedGroceryItems).toHaveBeenCalledWith('abc');
    expect(within(rowFor('Eggs')).getByRole('checkbox')).not.toBeChecked();
    expect(screen.queryByRole('button', { name: /checked/ })).not.toBeInTheDocument();
  });

  it('reloads for a longer range when one is chosen', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2030, 4, 1, 9, 0));
    await renderList();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Grocery list date range'), { target: { value: '14' } });
    });
    expect(groceryListServices.getGroceryList).toHaveBeenLastCalledWith('abc', '2030-05-01', '2030-05-14');
  });

  it('explains an empty list depending on whether anything is planned', async () => {
    groceryListServices.getGroceryList.mockResolvedValue({ ...list, plannedMeals: 0, items: [] });
    await renderList();
    expect(screen.getByText(/Add recipes to your calendar/)).toBeInTheDocument();
    cleanup();

    groceryListServices.getGroceryList.mockResolvedValue({ ...list, plannedMeals: 2, items: [] });
    await renderList();
    expect(screen.getByText(/Your pantry covers every planned meal/)).toBeInTheDocument();
  });

  it('shows a load error', async () => {
    groceryListServices.getGroceryList.mockRejectedValue(new Error('Could not load your grocery list.'));
    await renderList();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load your grocery list.');
  });
});
