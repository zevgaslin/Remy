import { useEffect, useMemo, useState } from 'react';

const VIEWS = [
  { id: 'week', label: 'This Week' },
  { id: 'next7', label: 'Next 7 Days' },
  { id: 'month', label: 'Month' },
];

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function buildWeekDays(anchor) {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function buildNext7Days(anchor) {
  return Array.from({ length: 7 }, (_, i) => addDays(anchor, i));
}

function buildMonthDays(anchor) {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(firstOfMonth);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

function isSameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

function useToday() {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const msUntilMidnight = new Date().setHours(24, 0, 0, 0) - Date.now();
    let dailyInterval;
    const midnightTimeout = setTimeout(() => {
      setToday(new Date());
      dailyInterval = setInterval(() => setToday(new Date()), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => {
      clearTimeout(midnightTimeout);
      clearInterval(dailyInterval);
    };
  }, []);

  return today;
}

function CalendarPanel() {
  const [view, setView] = useState('week');
  const today = useToday();

  const days = useMemo(() => {
    if (view === 'week') return buildWeekDays(today);
    if (view === 'next7') return buildNext7Days(today);
    return buildMonthDays(today);
  }, [view, today]);

  const monthLabel = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <section className="calendar-panel">
      <div className="calendar-header">
        <h2>{monthLabel}</h2>
        <div className="calendar-view-toggle">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={v.id === view ? 'active' : ''}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div className={`calendar-grid${view === 'month' ? ' month' : ''}`}>
        {view === 'month' &&
          WEEKDAY_LABELS.map((label) => (
            <div key={label} className="calendar-weekday">{label}</div>
          ))}
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={
              'calendar-day' +
              (isSameDay(day, today) ? ' today' : '') +
              (view === 'month' && day.getMonth() !== today.getMonth() ? ' outside' : '')
            }
          >
            <span className="calendar-day-number">{day.getDate()}</span>
            {view !== 'month' && (
              <span className="calendar-day-name">
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default CalendarPanel;
