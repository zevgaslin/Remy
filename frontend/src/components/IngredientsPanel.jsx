import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { deleteIngredient } from '../services/ingredientServices';
import { useIngredients } from '../hooks/useIngredients';
import { useDragToTrash } from '../hooks/useDragToTrash';
import { playLidSound, playRestoreSound, playTrashSound } from '../utils/trashSounds';
import { daysUntil } from '../utils/expiration';
import AddIngredientModal from './AddIngredientModal';
import GroceryList from './GroceryList';
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
   Concrete observer: the GroceryList component, which registers itself and
                     reloads the list from the server whenever it is notified.
   ========================================================================== */

export { plannedMealsSubject, setSharedPlannedMeals } from '../services/plannedMealsStore';

/* ==========================================================================
   Formatting
   ========================================================================== */

function formatQuantity(value) {
  if (typeof value !== 'number') return String(value);
  return String(Math.round(value * 100) / 100);
}

function formatWithUnit(quantity, unit) {
  const u = String(unit ?? '').trim();
  return `${formatQuantity(quantity)}${u ? ` ${u}` : ''}`;
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
  const [editingIngredient, setEditingIngredient] = useState(null);
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
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      trashIngredient(item);
    }
  }

  function handleAdded(newIngredient) {
    setIngredients((prev) => [...prev, newIngredient]);
    setModalOpen(false);
  }

  function handleSaved(saved) {
    setIngredients(prev => prev.map(item => item.id === saved.id ? saved : item));
    setEditingIngredient(null);
    setToast({ message: `${saved.name} updated` });
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
                  <button type="button" className="ingredient-edit-button" aria-label={`Edit ${item.name}`}
                    onPointerDown={event => event.stopPropagation()}
                    onClick={event => { event.stopPropagation(); setEditingIngredient(item); }}>Edit</button>
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
        {editingIngredient && <AddIngredientModal key={editingIngredient.id} token={currentUser.token}
          ingredient={editingIngredient} onSaved={handleSaved} onClose={() => setEditingIngredient(null)} />}
        {modalOpen && (
          <AddIngredientModal
            token={currentUser.token}
            onClose={() => setModalOpen(false)}
            onAdded={handleAdded}
          />
        )}
      </section>

      {currentUser && !loading && !error && <GroceryList token={currentUser.token} ingredients={ingredients} />}
    </>
  );
}

export default IngredientsPanel;