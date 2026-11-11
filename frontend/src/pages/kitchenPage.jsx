import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/useAuth';
import { getCalendar } from '../services/calendarServices';
import { plannedMealsSubject } from '../services/plannedMealsStore';
import RecipeDetails from '../components/RecipeDetails';
import RecipeIllustration from '../components/RecipeIllustration';
import './kitchenPage.css';

const DEFAULT_SLOTS = [
  { id: 'breakfast', label: 'Breakfast', time: '08:00' },
  { id: 'lunch', label: 'Lunch', time: '12:00' },
  { id: 'snack', label: 'Snack', time: '15:00' },
  { id: 'dinner', label: 'Dinner', time: '18:00' },
];
const EMPTY_DAY_QUIPS = [
  '"For example, nothing" - Kylian Mbappé',
  "Guess it’s a DoorDash type of night.",
  'Not enough cooks in the kitchen.',
  'The chef has left the building.',
  'Tonight’s special: absolutely no plans.',
  'This kitchen is on a well-deserved break.',
  'Your apron called. It’s taking the day off.',
];
const keyFor = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function KitchenDay({ currentUser }) {
  const [day, setDay] = useState(() => new Date());
  const [reload, setReload] = useState(0);
  const [calendar, setCalendar] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    const request = currentUser?.token ? getCalendar(currentUser.token) : Promise.resolve(
      plannedMealsSubject.owner === 'guest'
        ? { plannedMeals: plannedMealsSubject.getPlannedMeals(), dailyMealSlots: plannedMealsSubject.getDailyMealSlots() }
        : { plannedMeals: {}, dailyMealSlots: {} });
    request.then(saved => { if (!cancelled) setCalendar(saved); })
      .catch(failure => { if (!cancelled) setError(failure.message); });
    return () => { cancelled = true; };
  }, [currentUser?.token, reload]);
  function refresh() {
    setCalendar(null);
    setError('');
    setReload(value => value + 1);
  }
  function moveDay(amount) {
    setDay(previous => {
      const next = new Date(previous);
      next.setHours(12, 0, 0, 0);
      next.setDate(next.getDate() + amount);
      return next;
    });
  }
  const dateKey = keyFor(day);
  const quip = EMPTY_DAY_QUIPS[Number(dateKey.replaceAll('-', '')) % EMPTY_DAY_QUIPS.length];
  const meals = calendar?.plannedMeals || {};
  const slots = calendar?.dailyMealSlots?.[dateKey] ?? DEFAULT_SLOTS;
  const scheduled = slots.map(slot => ({ slot, recipe: meals[`${dateKey}::${slot.id}`] ?? meals[`${dateKey}-${slot.id}`] }))
    .filter(item => item.recipe).sort((a, b) => (a.slot.time || '').localeCompare(b.slot.time || ''));
  return (
    <section className="kitchen-page" aria-label="Kitchen">
      <header className="kitchen-header">
        <div><h1>Kitchen</h1><p>Your recipes for the day, ready to cook.</p></div>
        <div className="kitchen-day-nav">
          <button type="button" aria-label="Previous day" onClick={() => moveDay(-1)}>←</button>
          <h2 aria-live="polite">{day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2>
          <button type="button" aria-label="Next day" onClick={() => moveDay(1)}>→</button>
        </div>
        <div className="kitchen-actions">
          <button type="button" onClick={() => setDay(new Date())}>Today</button>
          <button type="button" onClick={refresh}>Refresh schedule</button>
        </div>
      </header>
      {error ? <div role="alert"><p>{error}</p><button type="button" onClick={refresh}>Retry</button></div>
        : !calendar ? <p role="status">Loading your kitchen…</p>
          : scheduled.length === 0 ? <div className="kitchen-empty"><h3>{quip}</h3>
            <p>No meals planned for this day.</p>
            <Link className="kitchen-add-meals" to={`/?date=${dateKey}`}>Add meals</Link></div>
            : <div className="kitchen-meals" key={dateKey}>{scheduled.map(({ slot, recipe }) => (
              <details className="kitchen-meal" key={slot.id} open>
                <summary><span className="kitchen-chevron" aria-hidden="true">›</span>
                  <RecipeIllustration name={recipe.name || recipe.document?.name} size={56} /><span>
                  <span className="kitchen-meal-label">{slot.label}{slot.time ? ` · ${slot.time}` : ''}</span>
                  <span className="kitchen-recipe-name">{recipe.name || recipe.document?.name}</span>
                </span></summary>
                <div className="kitchen-meal-body">
                  {(recipe.document?.description || recipe.description) && <p>{recipe.document?.description || recipe.description}</p>}
                  <RecipeDetails recipe={recipe} />
                </div>
              </details>
            ))}</div>}
    </section>
  );
}
export default function KitchenPage() {
  const { currentUser } = useAuth();
  return <KitchenDay key={currentUser?.token ?? 'guest'} currentUser={currentUser} />;
}
