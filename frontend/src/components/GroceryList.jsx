import { useCallback, useEffect, useState } from 'react';
import { plannedMealsSubject } from '../services/plannedMealsStore';
import {
  clearCheckedGroceryItems,
  getGroceryList,
  setGroceryItemChecked,
} from '../services/groceryListServices';

const RANGE_OPTIONS = [
  { days: 7, label: 'Next 7 days' },
  { days: 14, label: 'Next 14 days' },
  { days: 30, label: 'Next 30 days' },
];

// The user's local date, so "today" matches their calendar rather than the server's.
function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function rangeFor(days) {
  const start = new Date();
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + days - 1);
  return { from: localDateKey(start), to: localDateKey(end) };
}

/*
  Observer: registers with plannedMealsSubject and reloads the list from the
  server whenever the calendar changes. The pantry is passed in, so a pantry
  change reloads it too.
*/
function GroceryList({ token, ingredients }) {
  const [days, setDays] = useState(RANGE_OPTIONS[0].days);
  const [calendarVersion, setCalendarVersion] = useState(0);
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const observer = { update: () => setCalendarVersion((version) => version + 1) };
    plannedMealsSubject.addObserver(observer);
    return () => plannedMealsSubject.removeObserver(observer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const { from, to } = rangeFor(days);
    getGroceryList(token, from, to)
      .then((data) => {
        if (!cancelled) {
          setList(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token, days, calendarVersion, ingredients]);

  const updateItems = useCallback((change) => {
    setList((current) => current && { ...current, items: current.items.map(change) });
  }, []);

  function toggle(item) {
    const checked = !item.checked;
    updateItems((other) => (other.key === item.key ? { ...other, checked } : other));
    setGroceryItemChecked(token, item.key, checked).catch((err) => {
      updateItems((other) => (other.key === item.key ? { ...other, checked: item.checked } : other));
      setError(err.message);
    });
  }

  function clearChecked() {
    const previous = list;
    updateItems((item) => ({ ...item, checked: false }));
    clearCheckedGroceryItems(token).catch((err) => {
      setList(previous);
      setError(err.message);
    });
  }

  const items = list?.items ?? [];
  // Unchecked first, so what is left to buy stays at the top.
  const sorted = [...items].sort((a, b) => Number(a.checked) - Number(b.checked));
  const checkedCount = items.filter((item) => item.checked).length;

  return (
    <section className="ingredients-panel grocery-list-panel" aria-labelledby="grocery-list-heading">
      <div className="grocery-list-header">
        <h2 id="grocery-list-heading">Grocery List</h2>
        <select
          aria-label="Grocery list date range"
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
        >
          {RANGE_OPTIONS.map((option) => (
            <option key={option.days} value={option.days}>{option.label}</option>
          ))}
        </select>
      </div>

      {error && <p role="alert" className="grocery-list-error">{error}</p>}

      {!list && !error && <p>Loading your grocery list…</p>}

      {list && items.length === 0 && (
        <p>
          {list.plannedMeals === 0
            ? 'Nothing to buy. Add recipes to your calendar to build a grocery list.'
            : 'Nothing to buy. Your pantry covers every planned meal.'}
        </p>
      )}

      {items.length > 0 && (
        <>
          <ul className="ingredients-list">
            {sorted.map((item) => (
              <li
                key={item.key}
                className={`ingredient-row grocery-item${item.checked ? ' grocery-item--checked' : ''}`}
                title={`Needed for: ${item.recipes.join(', ')}${item.have ? ` · You already have ${item.have}` : ''}`}
              >
                <label className="grocery-item-label">
                  <input type="checkbox" checked={item.checked} onChange={() => toggle(item)} />
                  <span>{item.name}</span>
                </label>
                <span className="ingredient-calories">{item.recipes.join(', ')}</span>
                <span className="ingredient-status">{item.amount || 'Amount not listed'}</span>
              </li>
            ))}
          </ul>
          {checkedCount > 0 && (
            <button type="button" className="grocery-list-clear" onClick={clearChecked}>
              Clear {checkedCount} checked
            </button>
          )}
        </>
      )}
    </section>
  );
}

export default GroceryList;
