import { Fragment, useEffect, useMemo, useState } from 'react';
import { useRecipeHover } from '../hooks/useRecipeHover';
import RecipeHoverPopover from './RecipeHoverPopover';
import { useRecipes } from '../hooks/useRecipes';
import { DEFAULT_GOALS, NUTRIENTS } from '../utils/nutritionGoals';


const VIEWS = [
 { id: 'day', label: 'Today' },
 { id: 'week', label: 'This Week' },
 { id: 'next7', label: 'Next 7 Days' },
 { id: 'month', label: 'Month' },
];


const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];


const DEFAULT_MEAL_SLOTS = [
 { id: 'breakfast', label: 'Breakfast' },
 { id: 'lunch', label: 'Lunch' },
 { id: 'snack', label: 'Snack' },
 { id: 'dinner', label: 'Dinner' },
];


const SLOT_TO_HOUR = {
 breakfast: 8,
 lunch: 12,
 snack: 15,
 dinner: 18,
};




function formatHour(h) {
 if (h === 0) return '';
 if (h === 12) return '12 PM';
 return h < 12 ? `${h} AM` : `${h - 12} PM`;
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


export function getDailyNutritionTotal(date, meals, mealSlots) {
 const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
 const dKey = dateKey(date);
  mealSlots.forEach(slot => {
   const recipe = meals[`${dKey}-${slot.id}`];
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
             <span>{short}: {value}{suffix}</span>
             <span className="nutrient-percent">{percent}%{over ? ' · over' : ''}</span>
           </div>
           <div
             className="nutrient-bar"
             role="progressbar"
             aria-label={`${label}: ${value} of ${goal} ${unit}`}
             aria-valuemin={0}
             aria-valuemax={100}
             aria-valuenow={Math.min(percent, 100)}
           >
             <div className="nutrient-bar-fill" style={{ width: `${Math.min(percent, 100)}%` }} />
           </div>
         </div>
       );
     })}
   </div>
 );
}


// NEW COMPONENT: Recipe Picker Popup
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
         boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
       }}
     >
       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 'bold' }}>
         <span>Select a Recipe</span>
         <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
       </div>
      
       {loading ? (
         <p style={{ fontSize: '0.9rem', color: 'gray' }}>Loading recipes...</p>
       ) : error ? (
         <div role="alert">
           <p>{error}</p>
           <button type="button" onClick={refresh}>Retry loading recipes</button>
         </div>
       ) : recipes.length === 0 ? (
         <p>No recipes are available yet.</p>
       ) : (
         <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
           {recipes.map(r => (
             <li
               key={r.id}
               style={{ padding: '8px', borderBottom: '1px solid #eee', cursor: 'pointer', fontSize: '0.9rem' }}
               onClick={() => onSelect(r)}
               onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
               onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
             >
               {r.name}
               {r.nutrition?.calories != null && (
                 <span className="recipe-picker-calories"> · {r.nutrition.calories} kcal</span>
               )}
             </li>
           ))}
         </ul>
       )}
     </div>
   </>
 );
}


// MODIFIED COMPONENT: Added slotId and onAddClick props
function MealCell({ recipe, slotLabel, day, slotId, onAddClick }) {
 const { visible, coords, triggerProps } = useRecipeHover();


 if (!recipe) {
   return (
     <div className="meal-cell empty">
       <button
         type="button"
         className="meal-add-button"
         aria-label={`Add ${slotLabel} for ${day.toDateString()}`}
         onClick={(e) => onAddClick(e, day, slotId)}
       >
         <span className="event-label">{slotLabel}</span>
         <span className="add-icon">+</span>
       </button>
     </div>
   );
 }


 return (
   <div className="meal-cell filled">
     <div className="meal-chip" {...triggerProps}>
       <div className="event-label">{slotLabel}</div>
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


function CalendarPanel({ goals = DEFAULT_GOALS }) {
 const [view, setView] = useState('day');
 const [mealSlots, setMealSlots] = useState(DEFAULT_MEAL_SLOTS);
 const today = useToday();
 const timeProgress = useCurrentTimeProgress();


 // MODIFIED: State replaces useMemo mockMeals
 const [plannedMeals, setPlannedMeals] = useState({});


 // NEW: Popup State
 const [activePopup, setActivePopup] = useState(null);


 const days = useMemo(() => {
   if (view === 'day') return [today];
   if (view === 'week') return buildWeekDays(today);
   if (view === 'next7') return buildNext7Days(today);
   return buildMonthDays(today);
 }, [view, today]);


 const plannedDateKeys = useMemo(
   () => new Set(Object.keys(plannedMeals).map((key) => key.slice(0, key.lastIndexOf('-')))),
   [plannedMeals],
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


 // NEW: Popup Handlers
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
  
   const key = `${dateKey(activePopup.day)}-${activePopup.slotId}`;
   setPlannedMeals((prev) => ({
     ...prev,
     [key]: recipe,
   }));
  
   setActivePopup(null);
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
     ) : view === 'day' ? (
       <div className="calendar-grid day-timeline-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
         <div className="day-timeline-header">
           <div className="time-spacer" />
           <div className="day-header-content today">
             <span className="calendar-day-name">
               {today.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
             </span>
             <span className="calendar-day-number">{today.getDate()}</span>
           </div>
         </div>
        
         <div className="day-timeline-scroll-area" style={{ flex: 1, overflowY: 'auto' }}>
           {isSameDay(today, new Date()) && (
             <div
               className="current-time-indicator"
               style={{ top: `${timeProgress}%` }}
             >
               <div className="current-time-dot" />
               <div className="current-time-line" />
             </div>
           )}
          
           <div className="day-timeline-grid">
             {Array.from({ length: 24 }).map((_, hour) => {
               const mealsThisHour = mealSlots.filter(
                 (slot, index) =>
                   SLOT_TO_HOUR[slot.id] === hour ||
                   (!SLOT_TO_HOUR[slot.id] && hour === Math.min(20 + index, 23))
               );


               return (
                 <div key={hour} className="timeline-hour-row">
                   <div className="timeline-axis-label">
                     <span>{formatHour(hour)}</span>
                   </div>
                   <div className="timeline-grid-cell">
                     {mealsThisHour.map((slot) => (
                       <div key={slot.id} className="calendar-event-block">
                         <MealCell
                           recipe={plannedMeals[`${dateKey(today)}-${slot.id}`]}
                           slotLabel={slot.label}
                           day={today}
                           slotId={slot.id}
                           onAddClick={handleOpenPopup}
                         />
                       </div>
                     ))}
                   </div>
                 </div>
               );
             })}
           </div>
         </div>


         <div className="day-nutrition-footer" style={{ borderTop: '1px solid #eee', padding: '12px' }}>
           <DailyNutritionSummary totals={getDailyNutritionTotal(today, plannedMeals, mealSlots)} goals={goals} />
         </div>
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
                   recipe={plannedMeals[`${dateKey(day)}-${slot.id}`]}
                   slotLabel={slot.label}
                   day={day}
                   slotId={slot.id}
                   onAddClick={handleOpenPopup}
                 />
               ))}
             </Fragment>
           ))}


           <div className="meal-slot-label nutrition-row-label" style={{ borderTop: '2px solid #ddd' }}>
             <span>Nutrition Total</span>
           </div>
           {days.map((day) => (
             <div key={`nutrition-${dateKey(day)}`} className="meal-cell nutrition-cell" style={{ borderTop: '2px solid #ddd', padding: '4px' }}>
               <DailyNutritionSummary totals={getDailyNutritionTotal(day, plannedMeals, mealSlots)} goals={goals} />
             </div>
           ))}
          
         </div>
       </div>
     )}


     {/* NEW: Render Popup globally within panel */}
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


export default CalendarPanel;


