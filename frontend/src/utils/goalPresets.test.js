import { describe, it, expect } from 'vitest';
import { calculatePresetGoals, isValidWeight } from './goalPresets';

const moderate180 = { weight: 180, unit: 'lb', activityId: 'moderate' };

describe('calculatePresetGoals', () => {
  it('sets maintenance from weight and activity', () => {
    expect(calculatePresetGoals({ ...moderate180, presetId: 'maintain' }))
      .toEqual({ calories: 2700, protein: 144, carbs: 362, fat: 75 });
  });

  it('cuts calories by 20% and raises protein', () => {
    expect(calculatePresetGoals({ ...moderate180, presetId: 'cut' }))
      .toEqual({ calories: 2150, protein: 180, carbs: 223, fat: 60 });
  });

  it('adds calories for a lean bulk and a bulk', () => {
    const leanBulk = calculatePresetGoals({ ...moderate180, presetId: 'lean-bulk' });
    const bulk = calculatePresetGoals({ ...moderate180, presetId: 'bulk' });

    expect(leanBulk.calories).toBe(2950);
    expect(bulk).toEqual({ calories: 3250, protein: 162, carbs: 448, fat: 90 });
  });

  it('uses more calories for more active people', () => {
    const sedentary = calculatePresetGoals({ ...moderate180, activityId: 'sedentary', presetId: 'maintain' });
    const veryActive = calculatePresetGoals({ ...moderate180, activityId: 'very', presetId: 'maintain' });

    expect(sedentary.calories).toBe(2350);
    expect(veryActive.calories).toBe(3050);
  });

  it('converts kilograms to pounds', () => {
    const inKg = calculatePresetGoals({ weight: 81.65, unit: 'kg', activityId: 'moderate', presetId: 'maintain' });

    expect(inKg).toEqual(calculatePresetGoals({ ...moderate180, presetId: 'maintain' }));
  });

  it('always balances: macros add up to about the calorie goal', () => {
    for (const presetId of ['cut', 'maintain', 'lean-bulk', 'bulk']) {
      const goals = calculatePresetGoals({ ...moderate180, presetId });
      const fromMacros = goals.protein * 4 + goals.carbs * 4 + goals.fat * 9;
      expect(Math.abs(fromMacros - goals.calories)).toBeLessThanOrEqual(10);
    }
  });

  it('rejects weights outside a realistic range', () => {
    expect(isValidWeight(50, 'lb')).toBe(false);
    expect(isValidWeight(25, 'kg')).toBe(false);
    expect(isValidWeight(180, 'lb')).toBe(true);
    expect(() => calculatePresetGoals({ weight: 5, unit: 'lb', activityId: 'moderate', presetId: 'cut' })).toThrow();
  });
});
