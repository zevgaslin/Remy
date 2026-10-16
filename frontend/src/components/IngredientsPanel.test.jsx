import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import IngredientsPanel from './IngredientsPanel';
import * as ingredientServices from '../services/ingredientServices';
import * as trashSounds from '../utils/trashSounds';

vi.mock('../services/ingredientServices', () => ({
  getMyIngredients: vi.fn(),
  deleteIngredient: vi.fn(),
}));

vi.mock('../utils/trashSounds', () => ({
  playLidSound: vi.fn(),
  playTrashSound: vi.fn(),
  playRestoreSound: vi.fn(),
}));

const user = { id: 1, username: 'jordan', token: 'abc' };
const ingredients = [
  { id: 10, name: 'Milk', quantity: 1, unit: 'bottle', expirationDate: '2099-01-01' },
  { id: 11, name: 'Eggs', quantity: 12, unit: 'pieces', expirationDate: '2099-01-02' },
];

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
