// state: 'idle' | 'ready' (something is being dragged) | 'open' (hovering over it) | 'gulp' (just swallowed an item)
const HINTS = {
  idle: 'Drag here to delete',
  ready: 'Drop here to delete',
  open: 'Let go to delete',
  gulp: 'Deleted',
};

function TrashCan({ ref, state = 'idle' }) {
  return (
    <div ref={ref} className={`trash-can trash-can--${state}`} data-testid="trash-can">
      <svg className="trash-can-icon" viewBox="0 0 64 72" width="56" height="63" aria-hidden="true">
        <g className="trash-can-lid">
          <rect x="22" y="4" width="20" height="6" rx="3" />
          <rect x="6" y="10" width="52" height="7" rx="3.5" />
        </g>
        <path className="trash-can-body" d="M11 21h42l-4 45a4 4 0 0 1-4 4H19a4 4 0 0 1-4-4z" />
        <path className="trash-can-ribs" d="M24 30v30M32 30v30M40 30v30" />
      </svg>
      <span className="trash-can-hint">{HINTS[state]}</span>
    </div>
  );
}

export default TrashCan;
