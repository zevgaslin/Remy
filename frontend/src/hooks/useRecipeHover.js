import { useEffect, useRef, useState } from 'react';

const HOVER_DELAY = 200;
const POPOVER_WIDTH = 300;
const POPOVER_MARGIN = 12;

export function useRecipeHover() {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const timerRef = useRef(null);

  function computeCoords() {
    const rect = ref.current.getBoundingClientRect();
    const left = Math.min(
      Math.max(rect.left, POPOVER_MARGIN),
      window.innerWidth - POPOVER_WIDTH - POPOVER_MARGIN,
    );
    return { top: rect.bottom + 8, left };
  }

  function show() {
    setCoords(computeCoords());
    setVisible(true);
  }

  function scheduleShow() {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(show, HOVER_DELAY);
  }

  function hide() {
    clearTimeout(timerRef.current);
    setVisible(false);
  }

  function handleClick(event) {
    if (!window.matchMedia('(hover: none)').matches) return;
    event.stopPropagation();
    if (visible) {
      hide();
    } else {
      show();
    }
  }

  useEffect(() => {
    if (!visible) return undefined;
    function onOutsideClick(event) {
      if (ref.current && !ref.current.contains(event.target)) hide();
    }
    document.addEventListener('click', onOutsideClick);
    return () => document.removeEventListener('click', onOutsideClick);
  }, [visible]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return {
    visible,
    coords,
    triggerProps: {
      ref,
      onMouseEnter: scheduleShow,
      onMouseLeave: hide,
      onClick: handleClick,
    },
  };
}
