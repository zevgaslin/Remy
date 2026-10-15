import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NutritionGoalsCard from './NutritionGoalsCard';

const user = { id: 1, username: 'jordan', token: 'abc' };
const goals = { calories: 2000, protein: 50, carbs: 275, fat: 78 };

function renderCard(props = {}) {
  const onSave = props.onSave ?? vi.fn().mockResolvedValue({});
  render(<NutritionGoalsCard currentUser={user} goals={goals} onSave={onSave} {...props} />);
  return { onSave };
}

describe('NutritionGoalsCard', () => {
  it('shows the current goals', () => {
    renderCard();

    expect(screen.getByText('2000 kcal')).toBeInTheDocument();
    expect(screen.getByText('50g')).toBeInTheDocument();
    expect(screen.getByText('275g')).toBeInTheDocument();
    expect(screen.getByText('78g')).toBeInTheDocument();
  });

  it('asks guests to log in instead of offering to edit', () => {
    renderCard({ currentUser: null });

    expect(screen.getByText('Log in to set your own goals.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit goals' })).not.toBeInTheDocument();
  });

  it('saves edited goals as numbers', async () => {
    const { onSave } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Edit goals' }));
    fireEvent.change(screen.getByLabelText('Calories (kcal)'), { target: { value: '3200' } });
    fireEvent.change(screen.getByLabelText('Protein (g)'), { target: { value: '180' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save goals' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ calories: 3200, protein: 180, carbs: 275, fat: 78 }),
    );
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Save goals' })).not.toBeInTheDocument());
  });

  it.each([
    ['', 'Calories must be a whole number from 1 to 20000 kcal.'],
    ['0', 'Calories must be a whole number from 1 to 20000 kcal.'],
    ['1500.5', 'Calories must be a whole number from 1 to 20000 kcal.'],
  ])('rejects a calorie goal of "%s" before saving', (value, message) => {
    const { onSave } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Edit goals' }));
    fireEvent.change(screen.getByLabelText('Calories (kcal)'), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Save goals' }));

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows the server error and keeps the form open when saving fails', async () => {
    renderCard({ onSave: vi.fn().mockRejectedValue(new Error('Could not save your nutrition goals.')) });

    fireEvent.click(screen.getByRole('button', { name: 'Edit goals' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save goals' }));

    expect(await screen.findByText('Could not save your nutrition goals.')).toBeInTheDocument();
    expect(screen.getByLabelText('Calories (kcal)')).toHaveValue(2000);
  });

  it('discards changes on cancel', () => {
    const { onSave } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Edit goals' }));
    fireEvent.change(screen.getByLabelText('Calories (kcal)'), { target: { value: '9999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText('2000 kcal')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('fills the goals from a preset based on weight and activity, then saves them', async () => {
    const { onSave } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Edit goals' }));
    fireEvent.change(screen.getByLabelText('Body weight'), { target: { value: '180' } });
    fireEvent.click(screen.getByRole('button', { name: /Cut/ }));

    expect(screen.getByLabelText('Calories (kcal)')).toHaveValue(2150);
    expect(screen.getByLabelText('Protein (g)')).toHaveValue(180);
    expect(screen.getByLabelText('Carbs (g)')).toHaveValue(223);
    expect(screen.getByLabelText('Fat (g)')).toHaveValue(60);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Filled in from the Cut preset for 180 lb, moderately active.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save goals' }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ calories: 2150, protein: 180, carbs: 223, fat: 60 }),
    );
  });

  it('lets a preset be tweaked before saving', async () => {
    const { onSave } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Edit goals' }));
    fireEvent.change(screen.getByLabelText('Body weight'), { target: { value: '82' } });
    fireEvent.change(screen.getByLabelText('Weight unit'), { target: { value: 'kg' } });
    fireEvent.change(screen.getByLabelText('Activity level'), { target: { value: 'very' } });
    fireEvent.click(screen.getByRole('button', { name: /Bulk Gain size faster/ }));
    fireEvent.change(screen.getByLabelText('Protein (g)'), { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save goals' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const saved = onSave.mock.calls[0][0];
    expect(saved.protein).toBe(200);
    expect(saved.calories).toBe(3700);
  });

  it('asks for a weight before applying a preset', () => {
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Edit goals' }));
    fireEvent.click(screen.getByRole('button', { name: /Maintain/ }));

    expect(screen.getByText('Enter your weight (70–700 lb) to use a preset.')).toBeInTheDocument();
    expect(screen.getByLabelText('Calories (kcal)')).toHaveValue(2000);
  });
});
