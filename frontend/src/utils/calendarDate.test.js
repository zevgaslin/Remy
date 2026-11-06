import { describe, it, expect } from 'vitest';
import { parseCalendarDate } from './calendarDate';
describe('calendar date links', () => {
  it('keeps local dates and rejects invalid dates', () => {
    const date = parseCalendarDate('2026-11-09');
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026,10,9,12]);
    for (const value of ['2026-02-30','2026-13-01','nonsense',null,'2026-1-1']) expect(parseCalendarDate(value)).toBeNull();
  });
});
