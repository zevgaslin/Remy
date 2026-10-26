import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { deleteIngredient } from '../services/ingredientServices';
import { useIngredients } from '../hooks/useIngredients';
import { useDragToTrash } from '../hooks/useDragToTrash';
import { playLidSound, playRestoreSound, playTrashSound } from '../utils/trashSounds';
import { daysUntil } from '../utils/expiration';
import AddIngredientModal from './AddIngredientModal';
import TrashCan from './TrashCan';
import UndoToast from './UndoToast';

const UNDO_MS = 5000;
const GULP_MS = 450;

/* ==========================================================================
   Observer pattern
   --------------------------------------------------------------------------
   Subject:          base class that keeps a list of observers and notifies
                     them when its state changes.
   Observer:         any object with an update(subject) method.
   Concrete subject: PlannedMealsSubject, which holds the recipes planned in
                     the calendar. CalendarPanel writes to it and never knows
                     who is listening.
   Concrete observer: the ShoppingCart component, which registers itself and
                     recomputes whenever it is notified.
   ========================================================================== */

class Subject {
  constructor() {
    this.observers = [];
  }

  addObserver(observer) {
    if (!this.observers.includes(observer)) this.observers.push(observer);
  }

  removeObserver(observer) {
    this.observers = this.observers.filter((other) => other !== observer);
  }

  notifyObservers() {
    // Copy first so an observer can unsubscribe while being notified.
    [...this.observers].forEach((observer) => observer.update(this));
  }
}

class PlannedMealsSubject extends Subject {
  constructor() {
    super();
    this.plannedMeals = {};
    this.dailyMealSlots = {};
  }

  getPlannedMeals() {
    return this.plannedMeals;
  }

  setPlannedMeals(plannedMeals) {
    this.plannedMeals = plannedMeals;
    this.notifyObservers();
  }

  // Custom meal slots are remembered here too, but the cart doesn't need to be notified.
  getDailyMealSlots() {
    return this.dailyMealSlots;
  }

  setDailyMealSlots(dailyMealSlots) {
    this.dailyMealSlots = dailyMealSlots;
  }
}

// One shared subject for the whole app, since there is only one meal plan.
export const plannedMealsSubject = new PlannedMealsSubject();

// CalendarPanel keeps calling this, so it needs no changes.
export function setSharedPlannedMeals(next) {
  plannedMealsSubject.setPlannedMeals(next);
}

/* ==========================================================================
   Units
   ========================================================================== */

// Each unit converts to a base unit within its family (volume: tsp, weight: g),
// so 0.25 cup in the pantry can be subtracted from 4 tbsp in a recipe.
const UNIT_TABLE = {
  tsp: { family: 'volume', factor: 1 },
  tbsp: { family: 'volume', factor: 3 },
  fl_oz: { family: 'volume', factor: 6 },
  cup: { family: 'volume', factor: 48 },
  ml: { family: 'volume', factor: 0.2029 },
  l: { family: 'volume', factor: 202.9 },
  g: { family: 'weight', factor: 1 },
  oz: { family: 'weight', factor: 28.3495 },
  lb: { family: 'weight', factor: 453.592 },
  kg: { family: 'weight', factor: 1000 },
};

const UNIT_ALIASES = {
  tablespoon: 'tbsp',
  teaspoon: 'tsp',
  ounce: 'oz',
  pound: 'lb',
  gram: 'g',
  kilogram: 'kg',
  liter: 'l',
  litre: 'l',
  milliliter: 'ml',
  millilitre: 'ml',
  'fl oz': 'fl_oz',
  floz: 'fl_oz',
};

function normalizeUnit(unit) {
  let u = String(unit ?? '').trim().toLowerCase().replace(/\./g, '');
  if (u.length > 2 && u.endsWith('s') && !u.endsWith('ss')) u = u.slice(0, -1);
  return UNIT_ALIASES[u] ?? u;
}

function unitInfo(unit) {
  const norm = normalizeUnit(unit);
  return UNIT_TABLE[norm] ?? { family: `unit:${norm}`, factor: 1 };
}

function formatQuantity(value) {
  if (typeof value !== 'number') return String(value);
  return String(Math.round(value * 100) / 100);
}

function formatWithUnit(quantity, unit) {
  const u = String(unit ?? '').trim();
  return `${formatQuantity(quantity)}${u ? ` ${u}` : ''}`;
}

/* ==========================================================================
   Shopping list logic
   ========================================================================== */

function normalizeName(name) {
  return String(name ?? '').trim().toLowerCase();
}

// Recipe ingredients may be strings or objects like { name, quantity, unit }.
function recipeIngredientName(entry) {
  if (typeof entry === 'string') return entry;
  return entry?.name ?? entry?.ingredient ?? entry?.ingredientName ?? '';
}

function recipeIngredientAmount(entry) {
  if (!entry || typeof entry === 'string') return { quantity: null, unit: '' };
  const raw = entry.quantity ?? entry.amount ?? entry.qty ?? null;
  const unit = String(entry.unit ?? entry.units ?? '').trim();
  if (raw == null || raw === '') return { quantity: null, unit };
  const asNumber = Number(raw);
  return { quantity: Number.isNaN(asNumber) ? String(raw) : asNumber, unit };
}

function namesMatch(name, ownedName) {
  return (
    ownedName === name ||
    (name.length >= 3 &&
      ownedName.length >= 3 &&
      (ownedName.includes(name) || name.includes(ownedName)))
  );
}

// How much of a recipe's need is still missing after what the pantry holds.
// Returns null when the pantry already covers it.
function remainingAmount(amounts, ownedItems) {
  if (ownedItems.length === 0) {
    const parts = amounts
      .filter((a) => a.quantity != null)
      .map((a) => formatWithUnit(a.quantity, a.unit));
    return { amount: parts.join(' + '), have: '' };
  }

  const numericNeeds = amounts.filter((a) => typeof a.quantity === 'number');
  // Recipe gives no comparable amount, so owning any of it counts as covered.
  if (numericNeeds.length === 0) return null;

  const needByFamily = new Map();
  numericNeeds.forEach(({ quantity, unit }) => {
    const { family, factor } = unitInfo(unit);
    const entry = needByFamily.get(family) ?? { base: 0, displayUnit: unit, factor };
    entry.base += quantity * factor;
    needByFamily.set(family, entry);
  });

  const haveByFamily = new Map();
  const haveParts = [];
  ownedItems.forEach((item) => {
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    const { family, factor } = unitInfo(item.unit);
    haveByFamily.set(family, (haveByFamily.get(family) ?? 0) + quantity * factor);
    haveParts.push(formatWithUnit(quantity, item.unit));
  });

  const parts = [];
  needByFamily.forEach((entry, family) => {
    const left = entry.base - (haveByFamily.get(family) ?? 0);
    if (left > 1e-6) parts.push(formatWithUnit(left / entry.factor, entry.displayUnit));
  });

  if (parts.length === 0) return null;
  return { amount: parts.join(' + '), have: haveParts.join(' + ') };
}

function buildShoppingList(plannedMeals, pantry) {
  const needed = new Map();

  Object.values(plannedMeals).forEach((recipe) => {
    (recipe?.ingredients ?? []).forEach((entry) => {
      const display = recipeIngredientName(entry).trim();
      const key = normalizeName(display);
      if (!key) return;
      if (!needed.has(key)) needed.set(key, { name: display, recipes: new Set(), amounts: [] });
      const item = needed.get(key);
      item.recipes.add(recipe.name);
      item.amounts.push(recipeIngredientAmount(entry));
    });
  });

  const rows = [];
  needed.forEach((item, key) => {
    const owned = pantry.filter((p) => namesMatch(key, normalizeName(p.name)));
    const result = remainingAmount(item.amounts, owned);
    if (!result) return;
    rows.push({
      name: item.name,
      recipes: [...item.recipes],
      amount: result.amount,
      have: result.have,
    });
  });

  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

// Concrete observer: registers with the subject on mount, unregisters on unmount.
function ShoppingCart({ ingredients }) {
  const [plannedMeals, setPlannedMeals] = useState(() => plannedMealsSubject.getPlannedMeals());

  useEffect(() => {
    const observer = {
      update(subject) {
        setPlannedMeals(subject.getPlannedMeals());
      },
    };
    plannedMealsSubject.addObserver(observer);
    // Catch any change that happened between the first render and subscribing.
    setPlannedMeals(plannedMealsSubject.getPlannedMeals());
    return () => plannedMealsSubject.removeObserver(observer);
  }, []);

  const list = useMemo(
    () => buildShoppingList(plannedMeals, ingredients),
    [plannedMeals, ingredients],
  );

  return (
    <section className="ingredients-panel shopping-cart-panel">
      <h2>Shopping Cart</h2>
      {list.length === 0 ? (
        <p>Nothing to buy. Add recipes to your calendar to see what you need.</p>
      ) : (
        <ul className="ingredients-list">
          {list.map((item) => (
            <li
              key={item.name.toLowerCase()}
              className="ingredient-row"
              title={
                `Needed for: ${item.recipes.join(', ')}` +
                (item.have ? ` · You already have ${item.have}` : '')
              }
            >
              <span>{item.name}</span>
              <span className="ingredient-calories">{item.recipes.join(', ')}</span>
              <span className="ingredient-status">{item.amount || 'Amount not listed'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ==========================================================================
   Pantry helpers
   ========================================================================== */

function statusLabel(daysLeft) {
  if (daysLeft < 0) return 'Expired';
  if (daysLeft === 0) return 'Expires today';
  return `Expires in ${daysLeft}d`;
}

function urgencyClass(daysLeft) {
  if (daysLeft <= 0) return 'urgent';
  if (daysLeft <= 3) return 'soon';
  return '';
}

const MACROS = ['protein', 'carbs', 'fat'];

// Nutrition is stored per unit, so an item's totals scale with its quantity.
function itemTotal(item, key) {
  return item[key] == null ? null : item[key] * item.quantity;
}

function hasNutrition(item) {
  return item.calories != null || MACROS.some((key) => item[key] != null);
}

function formatAmount(value) {
  return Math.round(value).toLocaleString();
}

function macroTooltip(item) {
  return MACROS.filter((key) => item[key] != null)
    .map((key) => `${key[0].toUpperCase()}${key.slice(1)}: ${formatAmount(itemTotal(item, key))}g`)
    .join(' · ');
}

function pantryTotals(ingredients) {
  const tracked = ingredients.filter(hasNutrition);
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  tracked.forEach((item) => {
    Object.keys(totals).forEach((key) => {
      totals[key] += itemTotal(item, key) ?? 0;
    });
  });
  return { totals, trackedCount: tracked.length };
}

function pantryQuantityLabel(item) {
  const quantity = Number(item.quantity);
  if (item.quantity == null || !Number.isFinite(quantity)) return '';
  return formatWithUnit(quantity, item.unit);
}

/* ==========================================================================
   IngredientsPanel
   ========================================================================== */

function IngredientsPanel({ currentUser }) {
  const { ingredients, setIngredients, loading, error } = useIngredients(currentUser?.token);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [gulping, setGulping] = useState(false);
  // The ingredient waiting out its undo window: { item, timer }.
  const pendingRef = useRef(null);
  const tokenRef = useRef(currentUser?.token);

  useEffect(() => {
    tokenRef.current = currentUser?.token;
  }, [currentUser]);

  const commitDelete = useCallback((item) => {
    deleteIngredient(tokenRef.current, item.id).catch(() => {
      setIngredients((prev) => [...prev, item]);
      setToast({ message: `Could not delete ${item.name}. It’s back in your pantry.` });
    });
  }, [setIngredients]);

  // Send a pending delete now instead of waiting for its undo window to close.
  const flushPending = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingRef.current = null;
    commitDelete(pending.item);
  }, [commitDelete]);

  // Leaving the page keeps the delete rather than dropping it.
  useEffect(() => flushPending, [flushPending]);

  const trashIngredient = useCallback(
    (item) => {
      flushPending();
      setIngredients((prev) => prev.filter((other) => other.id !== item.id));
      playTrashSound();
      setGulping(true);
      setTimeout(() => setGulping(false), GULP_MS);
      setToast({ message: `${item.name} deleted`, item });

      const timer = setTimeout(() => {
        pendingRef.current = null;
        setToast((current) => (current?.item?.id === item.id ? null : current));
        commitDelete(item);
      }, UNDO_MS);
      pendingRef.current = { item, timer };
    },
    [flushPending, commitDelete, setIngredients],
  );

  function undoDelete() {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingRef.current = null;
    setIngredients((prev) => [...prev, pending.item]);
    playRestoreSound();
    setToast(null);
  }

  // Error messages have no undo, so they clear themselves.
  useEffect(() => {
    if (!toast || toast.item) return undefined;
    const timer = setTimeout(() => setToast(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const { trashRef, drag, overTrash, getItemProps } = useDragToTrash({
    onDrop: trashIngredient,
    onEnterTrash: playLidSound,
  });

  let trashState = 'idle';
  if (gulping) trashState = 'gulp';
  else if (overTrash) trashState = 'open';
  else if (drag) trashState = 'ready';

  function handleRowKeyDown(event, item) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      trashIngredient(item);
    }
  }

  function handleAdded(newIngredient) {
    setIngredients((prev) => [...prev, newIngredient]);
    setModalOpen(false);
  }

  const sortedIngredients = [...ingredients].sort(
    (a, b) => daysUntil(a.expirationDate) - daysUntil(b.expirationDate),
  );

  const { totals, trackedCount } = pantryTotals(ingredients);

  return (
    <>
      <section className="ingredients-panel">
        <h2>Ingredients</h2>
        {currentUser && !loading && !error && trackedCount > 0 && (
          <div className="pantry-macros" aria-label="Pantry nutrition totals">
            <span><strong>{formatAmount(totals.calories)}</strong> kcal</span>
            <span><strong>{formatAmount(totals.protein)}g</strong> protein</span>
            <span><strong>{formatAmount(totals.carbs)}g</strong> carbs</span>
            <span><strong>{formatAmount(totals.fat)}g</strong> fat</span>
          </div>
        )}
        {!currentUser && <p>Log in to track your ingredients.</p>}
        {currentUser && loading && <p>Loading ingredients...</p>}
        {currentUser && error && <p className="error-text">{error}</p>}
        {currentUser && !loading && !error && (
          <ul className="ingredients-list">
            {sortedIngredients.map((item) => {
              const daysLeft = daysUntil(item.expirationDate);
              const quantityLabel = pantryQuantityLabel(item);
              return (
                <li
                  key={item.id}
                  className={['ingredient-row', urgencyClass(daysLeft), drag?.item.id === item.id && 'being-dragged']
                    .filter(Boolean)
                    .join(' ')}
                  tabIndex={0}
                  aria-describedby="trash-hint"
                  onKeyDown={(event) => handleRowKeyDown(event, item)}
                  {...getItemProps(item)}
                >
                  <span>
                    {item.name}
                    {quantityLabel && (
                      <span className="ingredient-quantity" style={{ opacity: 0.7 }}>
                        {' · '}
                        {quantityLabel}
                      </span>
                    )}
                  </span>
                  {hasNutrition(item) && (
                    <span className="ingredient-calories" title={macroTooltip(item)}>
                      {item.calories != null ? `${formatAmount(itemTotal(item, 'calories'))} kcal` : 'Macros'}
                    </span>
                  )}
                  <span className="ingredient-status">{statusLabel(daysLeft)}</span>
                </li>
              );
            })}
          </ul>
        )}
        <div className="ingredients-footer">
          <button
            type="button"
            className="add-ingredient-button"
            disabled={!currentUser}
            onClick={() => setModalOpen(true)}
          >
            + Add Ingredient
          </button>
          {currentUser && <TrashCan ref={trashRef} state={trashState} />}
        </div>
        <p id="trash-hint" className="visually-hidden">
          Drag an ingredient onto the trash can to delete it, or select it and press Delete.
        </p>
        {toast && <UndoToast message={toast.message} onUndo={toast.item ? undoDelete : undefined} />}
        {drag &&
          createPortal(
            <div
              className={`drag-ghost${overTrash ? ' drag-ghost--over-trash' : ''}`}
              style={{ left: drag.x - drag.offsetX, top: drag.y - drag.offsetY, width: drag.width }}
              aria-hidden="true"
            >
              {drag.item.name}
            </div>,
            document.body,
          )}
        {modalOpen && (
          <AddIngredientModal
            token={currentUser.token}
            onClose={() => setModalOpen(false)}
            onAdded={handleAdded}
          />
        )}
      </section>

      {currentUser && !loading && !error && <ShoppingCart ingredients={ingredients} />}
    </>
  );
}

export default IngredientsPanel;