import { useEffect, useState } from 'react';
import { useMealLogs } from '../context/useMealLogs';
import { getWeeklyRecap, localDate, monday } from '../services/mealLogServices';
import { DEFAULT_GOALS, NUTRIENTS } from '../utils/nutritionGoals';
import './WeeklyRecap.css';

export const NUTRIENT_COLORS = {
  calories: 'var(--nutrition-calories)',
  protein: 'var(--nutrition-protein)',
  carbs: 'var(--nutrition-carbs)',
  fat: 'var(--nutrition-fat)',
};

const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function buildWeekDays(recap) {
  if (recap?.days?.length === 7) return recap.days;
  const startStr = recap?.weekStart || '2026-10-26';
  const startDate = new Date(`${startStr}T12:00:00`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = localDate(d);
    const existing = recap?.days?.find((item) => item.date === dateStr) || recap?.days?.[i];
    return (
      existing || {
        date: dateStr,
        meals: [],
        totals: { calories: null, protein: null, carbs: null, fat: null },
        goalsHit: {},
        goals: null,
      }
    );
  });
}

export function WeeklyNutritionGraph({ recap, goals = DEFAULT_GOALS }) {
  const days = buildWeekDays(recap);
  const width = 640;
  const height = 240;
  const padLeft = 44;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 34;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const fallbackGoals =
    days.find((d) => d.goals)?.goals || goals || DEFAULT_GOALS;

  const allValues = [];
  NUTRIENTS.forEach(({ key }) => {
    days.forEach((day) => {
      const actual = day.totals?.[key] ?? 0;
      const target = day.goals?.[key] ?? fallbackGoals?.[key] ?? DEFAULT_GOALS[key];
      allValues.push(actual, target);
    });
  });

  const maxValue = Math.max(...allValues, 100);
  const maxSqrt = Math.sqrt(maxValue * 1.1);

  const toX = (index) =>
    padLeft + (days.length > 1 ? (index / (days.length - 1)) * plotWidth : plotWidth / 2);

  const toY = (value) => {
    const clamped = Math.max(0, Number(value) || 0);
    const ratio = maxSqrt > 0 ? Math.sqrt(clamped) / maxSqrt : 0;
    return Number((padTop + plotHeight - ratio * plotHeight).toFixed(2));
  };

  return (
    <div className="recap-graph-card" aria-label="Weekly nutrition graph">
      <div className="recap-graph-header">
        <h4>Weekly nutrition vs. ideal goals</h4>
        <div className="recap-graph-legend">
          {NUTRIENTS.map(({ key, label }) => {
            const color = NUTRIENT_COLORS[key];
            return (
              <div key={key} className="recap-graph-legend-item">
                <span
                  className="recap-legend-swatch recap-legend-swatch--actual"
                  style={{ backgroundColor: color }}
                />
                <span>{label}</span>
                <span
                  className="recap-legend-swatch recap-legend-swatch--goal"
                  style={{ backgroundColor: color, opacity: 0.4 }}
                />
                <span className="recap-legend-goal-label">{label} goal</span>
              </div>
            );
          })}
        </div>
      </div>

      <svg
        className="recap-nutrition-graph"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Weekly nutrition trends and ideal goals for calories, protein, carbs, and fat"
      >
        {/* Horizontal guide lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((step) => {
          const y = Number((padTop + plotHeight * (1 - step)).toFixed(2));
          return (
            <line
              key={step}
              x1={padLeft}
              y1={y}
              x2={width - padRight}
              y2={y}
              className="recap-graph-grid-line"
            />
          );
        })}

        {/* 4 Ideal Goal Lines (same color as stat, more transparent) */}
        {NUTRIENTS.map(({ key, label }) => {
          const color = NUTRIENT_COLORS[key];
          const goalPoints = days
            .map((day, idx) => {
              const target =
                day.goals?.[key] ?? fallbackGoals?.[key] ?? DEFAULT_GOALS[key];
              return `${toX(idx)},${toY(target)}`;
            })
            .join(' ');

          return (
            <polyline
              key={`goal-${key}`}
              data-testid={`goal-line-${key}`}
              data-nutrient={key}
              aria-label={`${label} ideal goal line`}
              className={`recap-graph-line recap-graph-line--goal recap-graph-line--goal-${key}`}
              fill="none"
              stroke={color}
              strokeOpacity="0.4"
              strokeWidth="2.25"
              strokeDasharray="6 4"
              points={goalPoints}
            />
          );
        })}

        {/* 4 Actual Nutrition Lines (solid color) + Data Points */}
        {NUTRIENTS.map(({ key, label, unit }) => {
          const color = NUTRIENT_COLORS[key];
          const actualPoints = days
            .map((day, idx) => {
              const value = day.totals?.[key] ?? 0;
              return `${toX(idx)},${toY(value)}`;
            })
            .join(' ');

          return (
            <g key={`actual-group-${key}`}>
              <polyline
                data-testid={`actual-line-${key}`}
                data-nutrient={key}
                aria-label={`${label} actual line`}
                className={`recap-graph-line recap-graph-line--actual recap-graph-line--actual-${key}`}
                fill="none"
                stroke={color}
                strokeOpacity="1"
                strokeWidth="2.75"
                points={actualPoints}
              />
              {days.map((day, idx) => {
                const rawVal = day.totals?.[key];
                const value = rawVal ?? 0;
                const target =
                  day.goals?.[key] ?? fallbackGoals?.[key] ?? DEFAULT_GOALS[key];
                return (
                  <circle
                    key={`${key}-${day.date || idx}`}
                    cx={toX(idx)}
                    cy={toY(value)}
                    r="3.5"
                    fill={color}
                    className={`recap-graph-point recap-graph-point--${key}`}
                  >
                    <title>
                      {`${WEEKDAY_SHORT[idx]}: ${label} ${
                        rawVal == null ? 0 : Math.round(rawVal)
                      } / ${target} ${unit}`}
                    </title>
                  </circle>
                );
              })}
            </g>
          );
        })}

        {/* X-Axis Day Labels */}
        {days.map((day, idx) => (
          <text
            key={day.date || idx}
            x={toX(idx)}
            y={height - 10}
            textAnchor="middle"
            className="recap-graph-day-label"
          >
            {WEEKDAY_SHORT[idx]}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function WeeklyRecap({ goals = DEFAULT_GOALS }) {
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
      <WeeklyNutritionGraph recap={recap} goals={goals} />
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
