import { Fragment, useEffect, useMemo, useState } from 'react';
import { useRecipeHover } from '../hooks/useRecipeHover';
import RecipeHoverPopover from './RecipeHoverPopover';

const VIEWS = [
  { id: 'week', label: 'This Week' },
  { id: 'next7', label: 'Next 7 Days' },
  { id: 'month', label: 'Month' },
];

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEFAULT_MEAL_SLOTS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
];

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

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function MealCell({ recipe, slotLabel, day }) {
  const { visible, coords, triggerProps } = useRecipeHover();

  if (!recipe) {
    return (
      <div className="meal-cell">
        <button
          type="button"
          className="meal-add-button"
          aria-label={`Add ${slotLabel} for ${day.toDateString()}`}
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="meal-cell">
      <span className="meal-chip" {...triggerProps}>
        {recipe.name}
      </span>
      {visible && <RecipeHoverPopover recipe={recipe} coords={coords} />}
    </div>
  );
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
  const [mealSlots, setMealSlots] = useState(DEFAULT_MEAL_SLOTS);
  const today = useToday();

  const days = useMemo(() => {
    if (view === 'week') return buildWeekDays(today);
    if (view === 'next7') return buildNext7Days(today);
    return buildMonthDays(today);
  }, [view, today]);

  const mockMeals = useMemo(
    () => ({
      [`${dateKey(today)}-dinner`]: {
        name: 'Garlic Butter Pasta',
        instructions: 'Boil pasta. Saute garlic in butter. Toss together with parmesan and black pepper.',
      },
      [`${dateKey(addDays(today, 1))}-lunch`]: {
        name: 'Veggie Stir Fry',
        instructions: 'Chop leftover vegetables. Stir fry in oil with soy sauce and ginger over high heat for 5-7 minutes.',
      },
    }),
    [today],
  );

  const plannedDateKeys = useMemo(
    () => new Set(Object.keys(mockMeals).map((key) => key.slice(0, key.lastIndexOf('-')))),
    [mockMeals],
  );

  const monthLabel = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  function addMealSlot() {
    setMealSlots((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, label: `Meal ${prev.length + 1}` },
    ]);
  }

  function removeMealSlot(id) {
    setMealSlots((prev) => (prev.length > 1 ? prev.filter((slot) => slot.id !== id) : prev));
  }

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

      {view === 'month' ? (
        <div className="calendar-grid month">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="calendar-weekday">{label}</div>
          ))}
          {days.map((day) => (
            <div
              key={dateKey(day)}
              className={
                'calendar-day' +
                (isSameDay(day, today) ? ' today' : '') +
                (day.getMonth() !== today.getMonth() ? ' outside' : '')
              }
            >
              <span className="calendar-day-number">{day.getDate()}</span>
              {plannedDateKeys.has(dateKey(day)) && <span className="meal-dot" />}
            </div>
          ))}
        </div>
      ) : (
        <div className="meal-calendar-wrapper">
          <div className="meal-calendar">
            <div className="meal-calendar-corner">
              <button type="button" className="add-meal-slot" onClick={addMealSlot}>
                + Meal
              </button>
            </div>
            {days.map((day) => (
              <div
                key={dateKey(day)}
                className={`meal-day-header${isSameDay(day, today) ? ' today' : ''}`}
              >
                <span className="calendar-day-number">{day.getDate()}</span>
                <span className="calendar-day-name">
                  {day.toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
              </div>
            ))}

            {mealSlots.map((slot) => (
              <Fragment key={slot.id}>
                <div className="meal-slot-label">
                  <span>{slot.label}</span>
                  {mealSlots.length > 1 && (
                    <button
                      type="button"
                      className="remove-meal-slot"
                      aria-label={`Remove ${slot.label}`}
                      onClick={() => removeMealSlot(slot.id)}
                    >
                      ×
                    </button>
                  )}
                </div>
                {days.map((day) => (
                  <MealCell
                    key={`${slot.id}-${dateKey(day)}`}
                    recipe={mockMeals[`${dateKey(day)}-${slot.id}`]}
                    slotLabel={slot.label}
                    day={day}
                  />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default CalendarPanel;
