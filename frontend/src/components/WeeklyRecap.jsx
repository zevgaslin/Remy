import { useEffect, useState } from 'react';
import { useMealLogs } from '../context/useMealLogs';
import { getWeeklyRecap, monday } from '../services/mealLogServices';
import { NUTRIENTS } from '../utils/nutritionGoals';
import './WeeklyRecap.css';

export default function WeeklyRecap() {
  const context = useMealLogs();
  const [offset, setOffset] = useState(-1);
  const [loaded, setLoaded] = useState(null);
  const [failure, setFailure] = useState(null);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const anchor = new Date(`${context.today}T12:00:00`);
  anchor.setDate(anchor.getDate() + offset * 7);
  const week = monday(anchor);
  const token = context.token;
  const error = failure?.week === week && failure?.token === token ? failure.message : '';
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getWeeklyRecap(token, week).then(recap => {
      if (!cancelled) { setLoaded({ token, week, revision: context.revision, recap }); setFailure(null); }
    }).catch(err => { if (!cancelled) setFailure({ token, week, message: err.message }); });
    return () => { cancelled = true; };
  }, [token, week, context.revision, retry]);
  if (!token) return null;
  const recap = loaded?.token === token && loaded?.week === week && loaded?.revision === context.revision ? loaded.recap : null;
  const formatDate = date => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  async function undo(id) {
    setBusy(true);
    try { await context.undo(id); } catch (err) { setFailure({ token, week, message: err.message }); }
    finally { setBusy(false); }
  }
  return <section className="weekly-recap" aria-labelledby="recap-title">
    <div className="recap-heading"><div><span className="recap-eyebrow">Your food journal</span>
      <h2 id="recap-title">Weekly recap</h2></div>
      <nav aria-label="Recap week"><button onClick={() => setOffset(v => v-1)}>← Previous week</button>
        <button onClick={() => setOffset(-1)} disabled={offset === -1}>Last completed week</button>
        <button onClick={() => setOffset(v => v+1)} disabled={offset >= 0}>Next week →</button></nav>
    </div>
    <p>Completed recaps are ready each Monday for the previous Monday–Sunday, in your local timezone.</p>
    {context.error && <p role="alert">{context.error} <button onClick={context.retry}>Retry meal history</button></p>}
    {error ? <p role="alert">{error} <button onClick={() => setRetry(v => v+1)}>Retry recap</button></p> : !recap ?
      <p role="status">Loading recap…</p> : <>
      <h3>{formatDate(recap.weekStart)} – {formatDate(recap.weekEnd)} <span className="recap-status">{recap.complete ? 'Complete' : 'Week in progress'}</span></h3>
      <p><strong>{recap.mealsLogged} meals eaten</strong> · {recap.daysLogged} of 7 days logged</p>
      {!recap.mealsLogged && <p>No meals logged for this week. Choose a recipe in your calendar and mark it as eaten to start your journal.</p>}
      <div className="recap-stats">{NUTRIENTS.map(({key,label,unit}) => {
        const known = recap.days.filter(d => d.totals[key] != null);
        const average = known.length ? Math.round(known.reduce((sum,d) => sum+d.totals[key],0)/known.length) : null;
        return <article key={key}><h4>{label}</h4><strong>{average == null ? '—' : `${average} ${unit}`}</strong>
          <p>Average across {known.length} days with nutrition</p>
          <p>{recap.goalDays[key]} of {known.length} days hit goal</p></article>;
      })}</div>
      <p className="recap-note">Goals use the targets saved with your first eaten meal that day. Protein meets goal at or above target; calories, carbs, and fat use a ±10% range. Missing days and missing nutrition are unknown, not zero. Totals reflect only food you logged.</p>
      <div className="recap-days">{recap.days.map(day => <details key={day.date}>
        <summary>{formatDate(day.date)} · {day.meals.length ? `${day.meals.length} meals` : 'No food logged'}</summary>
        {day.meals.length > 0 && <>
          <ul>{day.meals.map(meal => <li key={meal.id}><span>{meal.recipeName} · {meal.servings} serving{meal.servings === 1 ? '' : 's'} · {meal.calories == null ? 'Calories unknown' : `${Math.round(meal.calories)} kcal`}</span>
            <button disabled={busy} onClick={() => undo(meal.id)} aria-label={`Undo eaten ${meal.recipeName} on ${day.date}`}>Undo eaten</button></li>)}</ul>
          <dl>{NUTRIENTS.map(({key,label,unit}) => <div key={key}><dt>{label}</dt>
            <dd>{day.totals[key] == null ? 'Unknown nutrition' : `${Math.round(day.totals[key])} / ${day.goals[key]} ${unit}`} · {day.goalsHit[key] == null ? 'Unknown' : day.goalsHit[key] ? 'Goal hit' : 'Outside goal'}</dd></div>)}</dl>
        </>}
      </details>)}</div>
    </>}
  </section>;
}
