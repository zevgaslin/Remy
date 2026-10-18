import { useEffect, useMemo, useState } from 'react';
import { useRecipeHover } from '../hooks/useRecipeHover';
import RecipeHoverPopover from './RecipeHoverPopover';
import { useRecipes } from '../hooks/useRecipes';
import { DEFAULT_GOALS, NUTRIENTS } from '../utils/nutritionGoals';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEFAULT_MEAL_SLOTS = [
  { id: 'breakfast', label: 'Breakfast', time: '08:00', hour: 8 },
  { id: 'lunch', label: 'Lunch', time: '12:00', hour: 12 },
  { id: 'snack', label: 'Snack', time: '15:00', hour: 15 },
  { id: 'dinner', label: 'Dinner', time: '18:00', hour: 18 },
];

const SLOT_TO_HOUR = {
  breakfast: 8,
  lunch: 12,
  snack: 15,
  dinner: 18,
};

function formatHour(h, showMidnight = true) {
  const normalized = ((h % 24) + 24) % 24;
  if (normalized === 0) return showMidnight ? '12 AM' : '';
  if (normalized === 12) return '12 PM';
  return normalized < 12 ? `${normalized} AM` : `${normalized - 12} PM`;
}

function formatHourRange(startHour, endHour) {
  // endHour === 23 represents 11:00 PM - 12:00 AM (midnight at the end of the day)
  const displayEndHour = endHour === 23 ? 24 : endHour;
  return `${formatHour(startHour, true)} – ${formatHour(displayEndHour, true)}`;
}

function formatTimeString(timeStr) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return timeStr;
  const m = mStr || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === '00' ? `${hour12} ${period}` : `${hour12}:${m} ${period}`;
}

function parseHourFromTime(timeStr, fallback = 12) {
  if (!timeStr) return fallback;
  const h = parseInt(timeStr.split(':')[0], 10);
  return Number.isNaN(h) ? fallback : Math.min(Math.max(h, 0), 23);
}

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

function buildDay(anchor) {
  return [anchor];
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

export function getDailyNutritionTotal(date, meals, mealSlots = DEFAULT_MEAL_SLOTS) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const dKey = dateKey(date);
  mealSlots.forEach((slot) => {
    const recipe = meals[`${dKey}::${slot.id}`] ?? meals[`${dKey}-${slot.id}`];
    if (recipe && recipe.nutrition) {
      totals.calories += recipe.nutrition.calories || 0;
      totals.protein += recipe.nutrition.protein || 0;
      totals.carbs += recipe.nutrition.carbs || 0;
      totals.fat += recipe.nutrition.fat || 0;
    }
  });
  return totals;
}

export function DailyNutritionSummary({ totals, goals = DEFAULT_GOALS }) {
  return (
    <div className="daily-nutrition-summary">
      <div className="daily-nutrition-title">Planned vs goal</div>
      {NUTRIENTS.map(({ key, label, short, unit, suffix }) => {
        const value = totals[key];
        const goal = goals[key];
        const percent = goal > 0 ? Math.round((value / goal) * 100) : 0;
        const over = value > goal;
        return (
          <div
            key={key}
            className={`nutrient-row${over ? ' nutrient-row--over' : ''}`}
            title={`${value} of ${goal} ${unit} ${label.toLowerCase()} goal`}
          >
            <div className="nutrient-row-text">
              <span>
                {short}: {value}
                {suffix}
              </span>
              <span className="nutrient-percent">
                {percent}%{over ? ' · over' : ''}
              </span>
            </div>
            <div
              className="nutrient-bar"
              role="progressbar"
              aria-label={`${label}: ${value} of ${goal} ${unit}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(percent, 100)}
            >
              <div
                className="nutrient-bar-fill"
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecipePickerPopup({ x, y, onClose, onSelect }) {
  const { recipes, loading, error, refresh } = useRecipes(undefined, { mode: 'catalog' });

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 999 }}
        onClick={onClose}
      />
      <div
        className="recipe-picker-popup"
        style={{
          position: 'fixed',
          top: Math.min(y, window.innerHeight - 300),
          left: Math.min(x, window.innerWidth - 250),
          background: 'white',
          border: '1px solid #ccc',
          zIndex: 1000,
          padding: '12px',
          borderRadius: '8px',
          width: '250px',
          maxHeight: '300px',
          overflowY: 'auto',
          boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontWeight: 'bold',
          }}
        >
          <span>Select a Recipe</span>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        {!error && (
          <button type="button" onClick={refresh} disabled={loading}>
            Refresh recipes
          </button>
        )}

        {loading ? (
          <p style={{ fontSize: '0.9rem', color: 'gray' }}>Loading recipes...</p>
        ) : error ? (
          <div role="alert">
            <p>{error}</p>
            <button type="button" onClick={refresh}>
              Retry loading recipes
            </button>
          </div>
        ) : recipes.length === 0 ? (
          <p>No recipes are available yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recipes.map((r) => (
              <li
                key={r.id}
                style={{
                  padding: '8px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
                onClick={() => onSelect(r)}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {r.name}
                {r.nutrition?.calories != null && (
                  <span className="recipe-picker-calories">
                    {' '}
                    · {r.nutrition.calories} kcal
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function AddMealModal({ day, showApplyAllOption, onClose, onAdd }) {
  const [label, setLabel] = useState('');
  const [time, setTime] = useState('12:00');
  const [applyToAll, setApplyToAll] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmedLabel = label.trim() || 'Custom Meal';
    onAdd({
      label: trimmedLabel,
      time: time || '12:00',
      applyToAll,
    });
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: 999,
        }}
        onClick={onClose}
      />
      <div
        className="add-meal-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Add Meal for ${day.toDateString()}`}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '16px',
          width: '300px',
          zIndex: 1000,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            fontWeight: 'bold',
          }}
        >
          <span>
            Add Meal ({day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })})
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem' }}>
            <span>Meal Name</span>
            <input
              type="text"
              placeholder="e.g., Pre-Workout, Late Snack"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
              required
              style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem' }}>
            <span>Time</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </label>

          {showApplyAllOption && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
              />
              <span>Add this meal to all 7 days of the week</span>
            </label>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                background: '#f5f5f5',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                background: '#2563eb',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Add Meal
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function MealCell({
  recipe,
  slotLabel,
  slotTime,
  day,
  slotId,
  onAddClick,
  onRemoveSlot,
}) {
  const { visible, coords, triggerProps } = useRecipeHover();
  const formattedTime = formatTimeString(slotTime);
  const displayLabel = formattedTime ? `${slotLabel} (${formattedTime})` : slotLabel;

  const deleteSlotButton = onRemoveSlot && (
    <button
      type="button"
      className="remove-meal-cell-btn"
      aria-label={`Remove ${slotLabel} on ${day.toDateString()}`}
      title={`Remove ${slotLabel} for this day`}
      onClick={(e) => {
        e.stopPropagation();
        onRemoveSlot(day, slotId);
      }}
      style={{
        position: 'absolute',
        top: '2px',
        right: '4px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '0.85rem',
        lineHeight: 1,
        padding: '2px 4px',
        color: '#888',
        zIndex: 2,
      }}
    >
      ×
    </button>
  );

  if (!recipe) {
    return (
      <div className="meal-cell empty" style={{ position: 'relative' }}>
        {deleteSlotButton}
        <button
          type="button"
          className="meal-add-button"
          aria-label={`Add ${slotLabel} for ${day.toDateString()}`}
          onClick={(e) => onAddClick(e, day, slotId)}
        >
          <span className="event-label">{displayLabel}</span>
          <span className="add-icon">+</span>
        </button>
      </div>
    );
  }

  return (
    <div className="meal-cell filled" style={{ position: 'relative' }}>
      {deleteSlotButton}
      <div className="meal-chip" {...triggerProps}>
        <div className="event-label">{displayLabel}</div>
        <div className="event-title">{recipe.name}</div>
      </div>
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

function useCurrentTimeProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const now = new Date();
      const percent = ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;
      setProgress(percent);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 60000);
    return () => clearInterval(interval);
  }, []);

  return progress;
}

/* ==========================================================================
   Concrete View Render Strategies
   ========================================================================== */

function MonthViewStrategy({ days, today, plannedDateKeys }) {
  return (
    <div className="calendar-grid month">
      {WEEKDAY_LABELS.map((label) => (
        <div key={label} className="calendar-weekday">
          {label}
        </div>
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
  );
}

function DayViewStrategy({
  today,
  timeProgress,
  getDaySlots,
  plannedMeals,
  goals,
  onOpenPopup,
  onOpenAddMealModal,
  onRemoveMealSlotForDay,
}) {
  const mealSlots = getDaySlots(today);
  const dKey = dateKey(today);

  // Build compressed timeline rows starting at 12 AM (hour 0) and ending at 12 AM (hour 24)
  const timelineRows = useMemo(() => {
    const hoursWithMeals = Array.from({ length: 24 }, (_, hour) => {
      const mealsThisHour = mealSlots.filter((slot, index) => {
        const slotHour =
          slot.hour !== undefined
            ? slot.hour
            : SLOT_TO_HOUR[slot.id] !== undefined
            ? SLOT_TO_HOUR[slot.id]
            : parseHourFromTime(slot.time, Math.min(20 + index, 23));
        return slotHour === hour;
      });
      return { hour, meals: mealsThisHour };
    });

    const rows = [];
    let i = 0;

    while (i < 24) {
      if (hoursWithMeals[i].meals.length > 0) {
        rows.push({
          type: 'single',
          startHour: i,
          endHour: i,
          label: formatHour(i, true),
          meals: hoursWithMeals[i].meals,
        });
        i += 1;
      } else {
        let end = i;
        while (end + 1 < 24 && hoursWithMeals[end + 1].meals.length === 0) {
          end += 1;
        }

        const unusedCount = end - i + 1;

        if (unusedCount > 2) {
          // Minimum gap > 2 hours (3+ unused hours) -> combine into a single range row
          rows.push({
            type: 'range',
            startHour: i,
            endHour: end,
            label: formatHourRange(i, end),
            meals: [],
          });
        } else {
          // 1 or 2 unused hours -> keep as individual single-hour rows
          for (let h = i; h <= end; h += 1) {
            rows.push({
              type: 'single',
              startHour: h,
              endHour: h,
              label:
                h === 23
                  ? `${formatHour(23, true)} – ${formatHour(24, true)}`
                  : formatHour(h, true),
              meals: [],
            });
          }
        }
        i = end + 1;
      }
    }

    return rows;
  }, [mealSlots]);

  // Calculate current hour & minute from timeProgress so the indicator aligns with compressed rows
  const totalMinutesToday = (timeProgress / 100) * (24 * 60);
  const currentHour = Math.min(Math.floor(totalMinutesToday / 60), 23);
  const currentMinute = totalMinutesToday % 60;
  const isTodayView = isSameDay(today, new Date());

  return (
    <div
      className="calendar-grid day-timeline-wrapper"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: 'calc(100% - 16px)',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <div className="day-timeline-header">
        <div
          className="time-spacer"
          style={{ width: '115px', minWidth: '115px', flexShrink: 0 }}
        />
        <div
          className="day-header-content today"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
          }}
        >
          <span className="calendar-day-name">
            {today.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
          </span>
          <span className="calendar-day-number">{today.getDate()}</span>
          <button
            type="button"
            className="add-meal-slot"
            onClick={() => onOpenAddMealModal(today)}
            style={{
              marginLeft: 'auto',
              fontSize: '0.85rem',
              fontWeight: 600,
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            + Add Meals
          </button>
        </div>
      </div>

      <div className="day-timeline-scroll-area" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="day-timeline-grid">
          {timelineRows.map((row) => {
            const hasCurrentTime =
              isTodayView &&
              currentHour >= row.startHour &&
              currentHour <= row.endHour;

            const spanHours = row.endHour - row.startHour + 1;
            const rowProgress = hasCurrentTime
              ? (((currentHour - row.startHour) * 60 + currentMinute) /
                  (spanHours * 60)) *
                100
              : 0;

            return (
              <div
                key={`${row.startHour}-${row.endHour}`}
                className={`timeline-hour-row${row.type === 'range' ? ' timeline-hour-range' : ''}`}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {hasCurrentTime && (
                  <div
                    className="current-time-indicator"
                    style={{ top: `${rowProgress}%` }}
                  >
                    <div className="current-time-dot" />
                    <div className="current-time-line" />
                  </div>
                )}

                <div
                  className="timeline-axis-label"
                  style={{
                    width: '115px',
                    minWidth: '115px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                  }}
                >
                  <span
                    style={{
                      position: 'static',
                      transform: 'none',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.2,
                    }}
                  >
                    {row.label}
                  </span>
                </div>
                <div className="timeline-grid-cell" style={{ flex: 1 }}>
                  {row.meals.map((slot) => (
                    <div key={slot.id} className="calendar-event-block">
                      <MealCell
                        recipe={
                          plannedMeals[`${dKey}::${slot.id}`] ??
                          plannedMeals[`${dKey}-${slot.id}`]
                        }
                        slotLabel={slot.label}
                        slotTime={slot.time}
                        day={today}
                        slotId={slot.id}
                        onAddClick={onOpenPopup}
                        onRemoveSlot={onRemoveMealSlotForDay}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="day-nutrition-footer"
        style={{ borderTop: '1px solid #eee', padding: '12px' }}
      >
        <DailyNutritionSummary
          totals={getDailyNutritionTotal(today, plannedMeals, mealSlots)}
          goals={goals}
        />
      </div>
    </div>
  );
}

function MultiDayMealGridStrategy({
  days,
  today,
  getDaySlots,
  plannedMeals,
  goals,
  onOpenAddMealModal,
  onRemoveMealSlotForDay,
  onOpenPopup,
}) {
  return (
    <div className="meal-calendar-wrapper">
      <div
        className="meal-calendar"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
          alignItems: 'stretch',
        }}
      >
        {/* Row 1: Day Headers with top-right "+ Add Meals" button */}
        {days.map((day) => (
          <div
            key={`header-${dateKey(day)}`}
            className={`meal-day-header${isSameDay(day, today) ? ' today' : ''}`}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: '28px',
              paddingBottom: '6px',
              paddingLeft: '4px',
              paddingRight: '4px',
              gap: '2px',
            }}
          >
            <button
              type="button"
              className="add-meal-slot"
              aria-label={`Add meals for ${day.toDateString()}`}
              onClick={() => onOpenAddMealModal(day)}
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              + Add Meals
            </button>
            <span className="calendar-day-number">{day.getDate()}</span>
            <span className="calendar-day-name">
              {day.toLocaleDateString(undefined, { weekday: 'short' })}
            </span>
          </div>
        ))}

        {/* Row 2: Independent Meal Columns for each day (shifts up/down dynamically) */}
        {days.map((day) => {
          const dKey = dateKey(day);
          const daySlots = getDaySlots(day);

          return (
            <div
              key={`column-${dKey}`}
              className="meal-day-column"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '4px',
              }}
            >
              {daySlots.map((slot) => (
                <MealCell
                  key={`${slot.id}-${dKey}`}
                  recipe={
                    plannedMeals[`${dKey}::${slot.id}`] ??
                    plannedMeals[`${dKey}-${slot.id}`]
                  }
                  slotLabel={slot.label}
                  slotTime={slot.time}
                  day={day}
                  slotId={slot.id}
                  onAddClick={onOpenPopup}
                  onRemoveSlot={onRemoveMealSlotForDay}
                />
              ))}
            </div>
          );
        })}

        {/* Row 3: Daily Nutrition Summary Row */}
        {days.map((day) => (
          <div
            key={`nutrition-${dateKey(day)}`}
            className="meal-cell nutrition-cell"
            style={{ borderTop: '2px solid #ddd', padding: '4px' }}
          >
            <DailyNutritionSummary
              totals={getDailyNutritionTotal(day, plannedMeals, getDaySlots(day))}
              goals={goals}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==========================================================================
   Strategy Registry
   ========================================================================== */

export const VIEW_STRATEGIES = {
  day: {
    id: 'day',
    label: 'Today',
    getDays: buildDay,
    Component: DayViewStrategy,
  },
  week: {
    id: 'week',
    label: 'This Week',
    getDays: buildWeekDays,
    Component: MultiDayMealGridStrategy,
  },
  next7: {
    id: 'next7',
    label: 'Next 7 Days',
    getDays: buildNext7Days,
    Component: MultiDayMealGridStrategy,
  },
  month: {
    id: 'month',
    label: 'Month',
    getDays: buildMonthDays,
    Component: MonthViewStrategy,
  },
};

const VIEWS = Object.values(VIEW_STRATEGIES);

/* ==========================================================================
   Context Component (CalendarPanel)
   ========================================================================== */

function CalendarPanel({ goals = DEFAULT_GOALS }) {
  const [view, setView] = useState('day');
  // Stores customized meal slot arrays keyed by YYYY-MM-DD
  const [dailyMealSlots, setDailyMealSlots] = useState({});
  const today = useToday();
  const timeProgress = useCurrentTimeProgress();

  const [plannedMeals, setPlannedMeals] = useState({});
  const [activePopup, setActivePopup] = useState(null);
  const [addMealModalDay, setAddMealModalDay] = useState(null);

  // Resolve the active strategy (falls back to 'day' if an unknown key is passed)
  const activeStrategy = VIEW_STRATEGIES[view] || VIEW_STRATEGIES.day;
  const ActiveViewComponent = activeStrategy.Component;

  // Delegate date calculation to the active strategy
  const days = useMemo(
    () => activeStrategy.getDays(today),
    [activeStrategy, today]
  );

  // Returns the meal slots for a given date (defaults to Breakfast, Lunch, Snack, Dinner)
  const getDaySlots = useMemo(
    () => (day) => {
      const dKey = dateKey(day);
      return dailyMealSlots[dKey] || DEFAULT_MEAL_SLOTS;
    },
    [dailyMealSlots]
  );

  const plannedDateKeys = useMemo(
    () =>
      new Set(
        Object.keys(plannedMeals).map((key) =>
          key.includes('::') ? key.split('::')[0] : key.slice(0, 10)
        )
      ),
    [plannedMeals]
  );

  const monthLabel = today.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  function handleAddMealForDay({ label, time, applyToAll }) {
    if (!addMealModalDay) return;

    const hour = parseHourFromTime(time, 12);
    const normalizedSlug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newSlot = {
      id: `custom-${normalizedSlug}-${time}-${Date.now()}`,
      label,
      time,
      hour,
    };

    const targetDays = applyToAll && days.length === 7 ? days : [addMealModalDay];

    setDailyMealSlots((prev) => {
      const next = { ...prev };
      targetDays.forEach((d) => {
        const dKey = dateKey(d);
        const currentSlots = next[dKey] ? [...next[dKey]] : [...DEFAULT_MEAL_SLOTS];
        const updatedSlots = [...currentSlots, newSlot].sort((a, b) =>
          (a.time || '23:59').localeCompare(b.time || '23:59')
        );
        next[dKey] = updatedSlots;
      });
      return next;
    });

    setAddMealModalDay(null);
  }

  function removeMealSlotForDay(day, slotId) {
    const dKey = dateKey(day);

    setDailyMealSlots((prev) => {
      const currentSlots = prev[dKey] ? [...prev[dKey]] : [...DEFAULT_MEAL_SLOTS];
      return {
        ...prev,
        [dKey]: currentSlots.filter((slot) => slot.id !== slotId),
      };
    });

    // Also remove any planned recipe assigned to that deleted slot on that day
    setPlannedMeals((prev) => {
      const next = { ...prev };
      delete next[`${dKey}::${slotId}`];
      delete next[`${dKey}-${slotId}`];
      return next;
    });
  }

  function handleOpenPopup(e, day, slotId) {
    setActivePopup({
      x: e.clientX,
      y: e.clientY,
      day,
      slotId,
    });
  }

  function handleSelectRecipe(recipe) {
    if (!activePopup) return;

    const dKey = dateKey(activePopup.day);
    const key = `${dKey}-${activePopup.slotId}`;
    setPlannedMeals((prev) => ({
      ...prev,
      [key]: recipe,
    }));

    setActivePopup(null);
  }

  return (
    <section
      className="calendar-panel"
      style={{
        width: 'calc(100% - 24px)',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
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

      {/* Delegate rendering to the active strategy's component */}
      <ActiveViewComponent
        days={days}
        today={today}
        timeProgress={timeProgress}
        getDaySlots={getDaySlots}
        plannedMeals={plannedMeals}
        plannedDateKeys={plannedDateKeys}
        goals={goals}
        onOpenAddMealModal={(day) => setAddMealModalDay(day)}
        onRemoveMealSlotForDay={removeMealSlotForDay}
        onOpenPopup={handleOpenPopup}
      />

      {addMealModalDay && (
        <AddMealModal
          day={addMealModalDay}
          showApplyAllOption={days.length === 7}
          onClose={() => setAddMealModalDay(null)}
          onAdd={handleAddMealForDay}
        />
      )}

      {activePopup && (
        <RecipePickerPopup
          x={activePopup.x}
          y={activePopup.y}
          onClose={() => setActivePopup(null)}
          onSelect={handleSelectRecipe}
        />
      )}
    </section>
  );
}
//insert comment here
export default CalendarPanel;