import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSupplements } from '../hooks/useSupplements';
import { useDragToTrash } from '../hooks/useDragToTrash';
import { playLidSound, playRestoreSound, playTrashSound } from '../utils/trashSounds';
import TrashCan from './TrashCan';
import UndoToast from './UndoToast';

const UNDO_MS = 5000;
const GULP_MS = 450;

const INITIAL_FORM = {
  name: '',
  dosage: '1 tablet',
  unit: 'tablet',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  effects: [''],
};

function SupplementsPanel({ currentUser }) {
  const { supplements, addOrUpdateSupplement, removeSupplement } = useSupplements(currentUser);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupp, setEditingSupp] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [gulping, setGulping] = useState(false);
  const pendingRef = useRef(null);

  const trashSupplement = useCallback(
    (item) => {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current.timer);
        pendingRef.current = null;
      }
      removeSupplement(item.id);
      playTrashSound();
      setGulping(true);
      setTimeout(() => setGulping(false), GULP_MS);
      setToast({ message: `${item.name} deleted`, item });

      const timer = setTimeout(() => {
        pendingRef.current = null;
        setToast((current) => (current?.item?.id === item.id ? null : current));
      }, UNDO_MS);
      pendingRef.current = { item, timer };
    },
    [removeSupplement],
  );

  useEffect(() => {
    return () => {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current.timer);
        pendingRef.current = null;
      }
    };
  }, []);

  function undoDelete() {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingRef.current = null;
    addOrUpdateSupplement(pending.item);
    playRestoreSound();
    setToast(null);
  }

  const { trashRef, drag, overTrash, getItemProps } = useDragToTrash({
    onDrop: trashSupplement,
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
      trashSupplement(item);
    }
  }

  function openAddModal() {
    setEditingSupp(null);
    setForm(INITIAL_FORM);
    setError('');
    setModalOpen(true);
  }

  function openEditModal(supp) {
    setEditingSupp(supp);
    setForm({
      name: supp.name || '',
      dosage: supp.dosage || '1 serving',
      unit: supp.unit || 'serving',
      calories: supp.calories ? String(supp.calories) : '',
      protein: supp.protein ? String(supp.protein) : '',
      carbs: supp.carbs ? String(supp.carbs) : '',
      fat: supp.fat ? String(supp.fat) : '',
      effects: supp.effects?.length ? [...supp.effects] : [''],
    });
    setError('');
    setModalOpen(true);
  }

  function handleEffectChange(index, value) {
    setForm((prev) => {
      const next = [...prev.effects];
      next[index] = value;
      return { ...prev, effects: next };
    });
  }

  function addEffectBox() {
    setForm((prev) => ({ ...prev, effects: [...prev.effects, ''] }));
  }

  function removeEffectBox(index) {
    setForm((prev) => ({
      ...prev,
      effects: prev.effects.filter((_, idx) => idx !== index),
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Supplement name is required.');
      return;
    }
    try {
      addOrUpdateSupplement({
        ...(editingSupp ? editingSupp : {}),
        name: form.name,
        dosage: form.dosage,
        unit: form.unit,
        addToGoals: editingSupp ? Boolean(editingSupp.addToGoals) : false,
        addToCalendar: editingSupp ? Boolean(editingSupp.addToCalendar) : false,
        calories: form.calories === '' ? 0 : Number(form.calories),
        protein: form.protein === '' ? 0 : Number(form.protein),
        carbs: form.carbs === '' ? 0 : Number(form.carbs),
        fat: form.fat === '' ? 0 : Number(form.fat),
        effects: form.effects,
      });
      setModalOpen(false);
      setEditingSupp(null);
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="supplements-panel" data-testid="supplements-panel">
      <ul className="ingredients-list supplements-list" aria-label="Supplements list">
        {supplements.map((supp) => (
          <li
            key={supp.id}
            className={['ingredient-row', 'supplement-row', drag?.item.id === supp.id && 'being-dragged']
              .filter(Boolean)
              .join(' ')}
            tabIndex={0}
            aria-describedby="supplement-trash-hint"
            onKeyDown={(event) => handleRowKeyDown(event, supp)}
            {...getItemProps(supp)}
          >
            <div className="supplement-row-main">
              <div className="supplement-title-line">
                <span>
                  {supp.name}
                  {supp.dosage && (
                    <span className="ingredient-quantity" style={{ opacity: 0.7 }}>
                      {' · '}
                      {supp.dosage}
                    </span>
                  )}
                </span>
              </div>
              {(supp.calories > 0 || supp.protein > 0 || supp.carbs > 0 || supp.fat > 0) && (
                <div className="supplement-macros">
                  {supp.calories > 0 && <span>{supp.calories} kcal</span>}
                  {supp.protein > 0 && <span>{supp.protein}g protein</span>}
                  {supp.carbs > 0 && <span>{supp.carbs}g carbs</span>}
                  {supp.fat > 0 && <span>{supp.fat}g fat</span>}
                </div>
              )}
              {supp.effects?.length > 0 && (
                <ul className="supplement-effects-list" aria-label={`${supp.name} effects`}>
                  {supp.effects.map((effect, idx) => (
                    <li key={idx} className="supplement-effect-box">
                      {effect}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="supplement-row-actions">
              <button
                type="button"
                className="ingredient-edit-button"
                aria-label={`Edit ${supp.name}`}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  openEditModal(supp);
                }}
              >
                Edit
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="ingredients-footer">
        <button
          type="button"
          className="add-ingredient-button"
          disabled={!currentUser}
          onClick={openAddModal}
        >
          + Add Supplement
        </button>
        {currentUser && <TrashCan ref={trashRef} state={trashState} />}
      </div>
      <p id="supplement-trash-hint" className="visually-hidden">
        Drag a supplement onto the trash can to delete it, or select it and press Delete.
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
        <div className="auth-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="auth-modal supplement-modal"
            role="dialog"
            aria-modal="true"
            aria-label={editingSupp ? 'Edit Supplement' : 'Add Supplement'}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auth-modal-header">
              <h2>{editingSupp ? 'Edit Supplement' : 'Add Supplement'}</h2>
              <button
                type="button"
                className="auth-modal-close"
                aria-label="Close supplement modal"
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <label>
                Supplement Name
                <input
                  type="text"
                  placeholder="e.g. Vitamin B12, Whey Protein, Omega-3"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </label>

              <div className="supplement-form-row">
                <label>
                  Dosage / Serving
                  <input
                    type="text"
                    placeholder="e.g. 1000 mcg, 1 scoop"
                    value={form.dosage}
                    onChange={(e) => setForm((prev) => ({ ...prev, dosage: e.target.value }))}
                  />
                </label>
                <label>
                  Unit
                  <input
                    type="text"
                    placeholder="e.g. tablet, scoop, softgel"
                    value={form.unit}
                    onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                  />
                </label>
              </div>

              <fieldset className="supplement-effects-fieldset">
                <legend>Supplement Effects (optional)</legend>
                {form.effects.map((effect, index) => (
                  <div key={index} className="supplement-effect-input-row">
                    <input
                      type="text"
                      aria-label={`Supplement effect ${index + 1}`}
                      placeholder="e.g. + 490% B12"
                      value={effect}
                      onChange={(e) => handleEffectChange(index, e.target.value)}
                    />
                    {form.effects.length > 1 && (
                      <button
                        type="button"
                        className="supplement-effect-remove"
                        aria-label={`Remove effect ${index + 1}`}
                        onClick={() => removeEffectBox(index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="supplement-effect-add"
                  onClick={addEffectBox}
                >
                  + Add Effect Message
                </button>
              </fieldset>

              <fieldset className="nutrition-fields">
                <legend>Macros per serving (optional)</legend>
                <label>
                  Calories
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.calories}
                    onChange={(e) => setForm((prev) => ({ ...prev, calories: e.target.value }))}
                  />
                </label>
                <label>
                  Protein (g)
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.protein}
                    onChange={(e) => setForm((prev) => ({ ...prev, protein: e.target.value }))}
                  />
                </label>
                <label>
                  Carbs (g)
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.carbs}
                    onChange={(e) => setForm((prev) => ({ ...prev, carbs: e.target.value }))}
                  />
                </label>
                <label>
                  Fat (g)
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.fat}
                    onChange={(e) => setForm((prev) => ({ ...prev, fat: e.target.value }))}
                  />
                </label>
              </fieldset>

              {error && <p className="auth-error" role="alert">{error}</p>}
              <button type="submit" className="auth-submit">
                {editingSupp ? 'Save Supplement' : 'Add Supplement'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupplementsPanel;
