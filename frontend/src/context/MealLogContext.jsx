import { useEffect, useState } from 'react';
import { MealLogContext, useMealLogs } from './useMealLogs';
import { getWeeklyRecap, localDate, monday, mealRequest, timezone } from '../services/mealLogServices';


export function MealLogProvider({ currentUser, children }) {
  const token = currentUser?.token;
  const [today, setToday] = useState(localDate);
  const [revision, setRevision] = useState(0);
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const timer = setInterval(() => setToday(localDate()), 30000);
    return () => clearInterval(timer);
  }, []);
  const week = monday(new Date(`${today}T12:00:00`));
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getWeeklyRecap(token, week).then(recap => {
      if (!cancelled) { setLoaded({ token, week, recap }); setError(''); }
    }).catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [token, week, revision]);
  const ready = !!token && loaded?.token === token && loaded?.week === week;
  const entries = ready ? loaded.recap.days.flatMap(day => day.meals) : [];
  async function log(recipe, day, slot, servings) {
    const entry = await mealRequest(token, '/meal-logs', {
      method: 'POST', body: JSON.stringify({ recipeId: recipe.id, eatenOn: day, slot, servings, timezone: timezone() }),
    });
    // Update immediately so a second click cannot log the same slot twice.
    setLoaded(prev => prev?.token !== token ? prev : { ...prev, recap: {
      ...prev.recap, days: prev.recap.days.map(d => d.date !== day ? d : {
        ...d, meals: [...d.meals.filter(m => m.slot !== slot), entry],
      }),
    }});
    setRevision(value => value + 1);
  }
  async function undo(id) {
    await mealRequest(token, `/meal-logs/${id}`, { method: 'DELETE' });
    setLoaded(prev => prev?.token !== token ? prev : { ...prev, recap: {
      ...prev.recap, days: prev.recap.days.map(d => ({ ...d, meals: d.meals.filter(m => m.id !== id) })),
    }});
    setRevision(value => value + 1);
  }
  return <MealLogContext.Provider value={{ token, today, entries, ready, error, log, undo, revision,
    retry: () => setRevision(value => value + 1) }}>{children}</MealLogContext.Provider>;
}

export function MealEatenControl({ recipe, day, slot, onChangeServings }) {
  const context = useMealLogs();
  const initialServings = recipe?.plannedServings != null && Number.isFinite(Number(recipe.plannedServings)) && Number(recipe.plannedServings) > 0
    ? String(recipe.plannedServings)
    : '1';
  const [servings, setServings] = useState(initialServings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (recipe?.plannedServings != null && Number.isFinite(Number(recipe.plannedServings)) && Number(recipe.plannedServings) > 0) {
      setServings(String(recipe.plannedServings));
    }
  }, [recipe?.plannedServings]);

  const hasToken = !!context?.token;
  if (!hasToken && !onChangeServings) return null;

  const date = localDate(day);
  const entry = hasToken ? context.entries.find(m => m.eatenOn === date && m.slot === slot) : null;
  const future = hasToken ? date > context.today : false;

  function handleServingsInput(e) {
    const nextValue = e.target.value;
    setServings(nextValue);
    const parsed = Number(nextValue);
    if (Number.isFinite(parsed) && parsed > 0 && parsed <= 100) {
      onChangeServings?.(day, slot, parsed);
    }
  }

  async function save() {
    setBusy(true); setError('');
    try {
      if (entry) await context.undo(entry.id);
      else await context.log(recipe, date, slot, Number(servings));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <div className="meal-eaten-control">
    {entry ? <span className="meal-eaten-badge">✓ Eaten · {entry.servings} serving{entry.servings === 1 ? '' : 's'}</span> :
      <label>Servings<input aria-label={`Servings of ${recipe.name}`} type="number" min="0.25" max="100" step="0.25"
        value={servings} disabled={busy} onChange={handleServingsInput} /></label>}
    {hasToken && (
      <button type="button" disabled={busy || future || !context.ready || (!entry && (!Number.isFinite(Number(servings)) || Number(servings) <= 0 || Number(servings) > 100))}
        onClick={save}>{busy ? 'Saving…' : entry ? 'Undo eaten' : future ? 'Planned' : 'Mark as eaten'}</button>
    )}
    {error && <p role="alert">{error}</p>}
  </div>;
}
