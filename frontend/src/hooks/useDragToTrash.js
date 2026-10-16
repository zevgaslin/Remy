import { useCallback, useEffect, useRef, useState } from 'react';

const MOUSE_DRAG_THRESHOLD = 5;
const TOUCH_HOLD_MS = 250;
const TOUCH_SCROLL_TOLERANCE = 8;
const TRASH_HIT_PADDING = 16;

// Drag an item onto a trash target with pointer events, so it works with a mouse and with touch.
// Mouse: press and move. Touch: press and hold briefly, then move (a quick swipe still scrolls).
export function useDragToTrash({ onDrop, onEnterTrash }) {
  const trashRef = useRef(null);
  const sessionRef = useRef(null);
  const callbacksRef = useRef({ onDrop, onEnterTrash });
  const [drag, setDrag] = useState(null);
  const [overTrash, setOverTrash] = useState(false);

  useEffect(() => {
    callbacksRef.current = { onDrop, onEnterTrash };
  }, [onDrop, onEnterTrash]);

  const isOverTrash = useCallback((x, y) => {
    const trash = trashRef.current;
    if (!trash) return false;
    const rect = trash.getBoundingClientRect();
    return (
      x >= rect.left - TRASH_HIT_PADDING &&
      x <= rect.right + TRASH_HIT_PADDING &&
      y >= rect.top - TRASH_HIT_PADDING &&
      y <= rect.bottom + TRASH_HIT_PADDING
    );
  }, []);

  const endSession = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    clearTimeout(session.holdTimer);
    window.removeEventListener('pointermove', session.handleMove);
    window.removeEventListener('pointerup', session.handleUp);
    window.removeEventListener('pointercancel', session.handleCancel);
    window.removeEventListener('keydown', session.handleKey);
    document.removeEventListener('touchmove', session.blockScroll);
    document.body.classList.remove('is-dragging-ingredient');
    sessionRef.current = null;
    setDrag(null);
    setOverTrash(false);
  }, []);

  useEffect(() => endSession, [endSession]);

  const startDrag = useCallback((session, x, y) => {
    session.dragging = true;
    document.addEventListener('touchmove', session.blockScroll, { passive: false });
    document.body.classList.add('is-dragging-ingredient');
    setDrag({ item: session.item, x, y, offsetX: session.offsetX, offsetY: session.offsetY, width: session.width });
  }, []);

  const getItemProps = useCallback(
    (item) => ({
      onPointerDown(event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        endSession();

        const rect = event.currentTarget.getBoundingClientRect();
        const session = {
          item,
          dragging: false,
          over: false,
          pointerType: event.pointerType,
          startX: event.clientX,
          startY: event.clientY,
          lastX: event.clientX,
          lastY: event.clientY,
          offsetX: event.clientX - rect.left,
          offsetY: event.clientY - rect.top,
          width: rect.width,
          holdTimer: null,
        };

        session.handleMove = (moveEvent) => {
          session.lastX = moveEvent.clientX;
          session.lastY = moveEvent.clientY;
          const distance = Math.hypot(moveEvent.clientX - session.startX, moveEvent.clientY - session.startY);

          if (!session.dragging) {
            if (session.pointerType === 'mouse') {
              if (distance > MOUSE_DRAG_THRESHOLD) startDrag(session, moveEvent.clientX, moveEvent.clientY);
            } else if (distance > TOUCH_SCROLL_TOLERANCE) {
              endSession();
            }
            return;
          }

          setDrag((prev) => (prev ? { ...prev, x: moveEvent.clientX, y: moveEvent.clientY } : prev));
          const over = isOverTrash(moveEvent.clientX, moveEvent.clientY);
          if (over !== session.over) {
            session.over = over;
            setOverTrash(over);
            if (over) callbacksRef.current.onEnterTrash?.();
          }
        };

        session.handleUp = (upEvent) => {
          const dropped = session.dragging && isOverTrash(upEvent.clientX, upEvent.clientY);
          endSession();
          if (dropped) callbacksRef.current.onDrop?.(item);
        };

        session.handleCancel = () => endSession();
        session.handleKey = (keyEvent) => {
          if (keyEvent.key === 'Escape') endSession();
        };
        session.blockScroll = (touchEvent) => touchEvent.preventDefault();

        if (session.pointerType !== 'mouse') {
          session.holdTimer = setTimeout(() => startDrag(session, session.lastX, session.lastY), TOUCH_HOLD_MS);
        }

        sessionRef.current = session;
        window.addEventListener('pointermove', session.handleMove);
        window.addEventListener('pointerup', session.handleUp);
        window.addEventListener('pointercancel', session.handleCancel);
        window.addEventListener('keydown', session.handleKey);
      },
    }),
    [endSession, isOverTrash, startDrag],
  );

  return { trashRef, drag, overTrash, getItemProps };
}
