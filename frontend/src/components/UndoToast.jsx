function UndoToast({ message, onUndo }) {
  return (
    <div className="undo-toast" role="status">
      <span>{message}</span>
      {onUndo && (
        <button type="button" className="undo-toast-button" onClick={onUndo}>
          Undo
        </button>
      )}
    </div>
  );
}

export default UndoToast;
