import { beforeEach, describe, expect, it } from 'vitest';
import {
  SUPPLEMENT_TIMING_OPTIONS,
  clearSupplementsForOwner,
  collectSupplementEffects,
  deleteSupplement,
  getScheduledSupplementsForDate,
  getSupplementNutritionTotals,
  getSupplementTimeInfo,
  getSupplements,
  isSupplementScheduledForDate,
  resolveSupplementOwner,
  saveSupplement,
  toggleSupplementTakenOnDate,
} from './supplementServices';

describe('supplementServices', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('resolves owners across guest, token string, and user objects', () => {
    expect(resolveSupplementOwner(null)).toBe('guest');
    expect(resolveSupplementOwner('tok-1')).toBe('tok-1');
    expect(resolveSupplementOwner({ token: 'tok-2', username: 'jordan' })).toBe('tok-2');
    expect(resolveSupplementOwner({ username: 'jordan' })).toBe('jordan');
    expect(resolveSupplementOwner({ id: 42 })).toBe('42');
  });

  it('saves, updates, and deletes supplements with effect text boxes', () => {
    const saved = saveSupplement('tok', {
      name: 'Vitamin B12',
      dosage: '1000 mcg',
      frequency: 'daily',
      timeOfDay: 'breakfast',
      withFood: false,
      calories: 0,
      protein: 0,
      effects: [' + 490% B12 ', '', '  + Energy Support '],
    });

    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe('Vitamin B12');
    expect(saved[0].effects).toEqual(['+ 490% B12', '+ Energy Support']);

    const updated = saveSupplement('tok', {
      ...saved[0],
      dosage: '2000 mcg',
      effects: ['+ 980% B12'],
    });
    expect(updated).toHaveLength(1);
    expect(updated[0].dosage).toBe('2000 mcg');
    expect(updated[0].effects).toEqual(['+ 980% B12']);

    const afterDelete = deleteSupplement('tok', saved[0].id);
    expect(afterDelete).toEqual([]);
    expect(getSupplements('tok')).toEqual([]);
  });

  it('throws when saving a supplement without a name', () => {
    expect(() => saveSupplement('tok', { name: '   ' })).toThrow('Supplement name is required.');
  });

  it('toggles taken dates and evaluates real-life schedules (daily, weekdays, weekly, every-other-day, as-needed)', () => {
    const [daily, weekdays, weekly, everyOther, asNeeded] = [
      { id: 's1', name: 'Daily Multi', frequency: 'daily', addToCalendar: true },
      { id: 's2', name: 'Weekday Focus', frequency: 'weekdays', addToCalendar: true },
      { id: 's3', name: 'Weekly D3', frequency: 'weekly', addToCalendar: true },
      { id: 's4', name: 'Iron EOD', frequency: 'every-other-day', addToCalendar: true },
      { id: 's5', name: 'Electrolytes', frequency: 'as-needed', addToCalendar: true, takenDates: ['2026-10-26'] },
    ];

    const monday = new Date('2026-10-26T12:00:00'); // Monday
    const sunday = new Date('2026-11-01T12:00:00'); // Sunday

    expect(isSupplementScheduledForDate(daily, monday)).toBe(true);
    expect(isSupplementScheduledForDate(daily, sunday)).toBe(true);

    expect(isSupplementScheduledForDate(weekdays, monday)).toBe(true);
    expect(isSupplementScheduledForDate(weekdays, sunday)).toBe(false);

    expect(isSupplementScheduledForDate(weekly, monday)).toBe(true);
    expect(isSupplementScheduledForDate(weekly, sunday)).toBe(false);

    // Every other day alternates between consecutive days
    const tuesday = new Date('2026-10-27T12:00:00');
    expect(isSupplementScheduledForDate(everyOther, monday)).not.toBe(
      isSupplementScheduledForDate(everyOther, tuesday),
    );

    expect(isSupplementScheduledForDate(asNeeded, monday)).toBe(true);
    expect(isSupplementScheduledForDate(asNeeded, sunday)).toBe(false);

    // Toggling taken date
    saveSupplement('tok', asNeeded);
    const toggledOn = toggleSupplementTakenOnDate('tok', 's5', '2026-11-01');
    expect(toggledOn[0].takenDates).toContain('2026-11-01');
    const toggledOff = toggleSupplementTakenOnDate('tok', 's5', '2026-11-01');
    expect(toggledOff[0].takenDates).not.toContain('2026-11-01');
  });

  it('calculates macro totals and collects effect messages for nutrition goals and calendar dates', () => {
    clearSupplementsForOwner('tok');
    saveSupplement('tok', {
      id: 'whey',
      name: 'Whey Protein',
      frequency: 'daily',
      addToGoals: true,
      addToCalendar: true,
      calories: 120,
      protein: 25,
      carbs: 2,
      fat: 1,
      effects: ['+ 25g Protein'],
    });
    saveSupplement('tok', {
      id: 'b12',
      name: 'B12',
      frequency: 'daily',
      addToGoals: true,
      addToCalendar: true,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      effects: ['+ 490% B12'],
    });

    const list = getSupplements('tok');
    const scheduled = getScheduledSupplementsForDate(list, new Date('2026-10-26T12:00:00'));
    expect(scheduled).toHaveLength(2);

    const totals = getSupplementNutritionTotals(list, new Date('2026-10-26T12:00:00'));
    expect(totals).toEqual({ calories: 120, protein: 25, carbs: 2, fat: 1 });

    const effects = collectSupplementEffects(list, { onlyGoals: true });
    expect(effects.map((e) => e.text)).toEqual(['+ 25g Protein', '+ 490% B12']);
  });

  it('provides 24 hourly time options and normalizes clock and legacy times', () => {
    expect(SUPPLEMENT_TIMING_OPTIONS).toHaveLength(24);
    expect(SUPPLEMENT_TIMING_OPTIONS[0]).toEqual({ value: '00:00', hour: 0, label: '12:00 AM' });
    expect(SUPPLEMENT_TIMING_OPTIONS[17]).toEqual({ value: '17:00', hour: 17, label: '5:00 PM' });
    expect(SUPPLEMENT_TIMING_OPTIONS[23]).toEqual({ value: '23:00', hour: 23, label: '11:00 PM' });

    expect(getSupplementTimeInfo({ timeOfDay: '17:00' })).toEqual({ time: '17:00', hour: 17, label: '5:00 PM' });
    expect(getSupplementTimeInfo({ timeOfDay: 'dinner' })).toEqual({ time: '18:00', hour: 18, label: '6:00 PM' });
    expect(getSupplementTimeInfo(null)).toEqual({ time: '08:00', hour: 8, label: '8:00 AM' });
  });
});
