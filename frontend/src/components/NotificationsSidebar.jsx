import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function NotificationsSidebar({ unread, error, onMarkRead, onMarkAllRead, onClose }) {
  const sidebarRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Escape closes; Tab stays inside the sidebar while it is open.
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !sidebarRef.current) return;
      const focusable = [...sidebarRef.current.querySelectorAll(FOCUSABLE)];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <>
      <div className="sidebar-backdrop" data-testid="sidebar-backdrop" onClick={onClose} />
      <aside
        ref={sidebarRef}
        id="notifications-sidebar"
        className="notifications-sidebar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-title"
      >
        <div className="notifications-sidebar-header">
          <h2 id="notifications-title">Notifications</h2>
          {unread.length > 0 && <span className="notification-badge">{unread.length}</span>}
          <button
            ref={closeButtonRef}
            type="button"
            className="sidebar-close"
            aria-label="Close notifications"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        {!error && unread.length === 0 && (
          <p className="notification-empty">You’re all caught up.</p>
        )}

        {unread.length > 0 && (
          <ul className="notification-list">
            {unread.map((notification) => (
              <li key={notification.id} className="notification-item">
                <div>
                  <strong>{notification.type === 'EXPIRED' ? 'Expired food' : 'Expiring soon'}</strong>
                  <p>{notification.message}</p>
                </div>
                <button
                  type="button"
                  className="notification-dismiss"
                  onClick={() => onMarkRead(notification.id)}
                >
                  Mark read
                </button>
              </li>
            ))}
          </ul>
        )}

        {unread.length > 1 && (
          <button type="button" className="mark-all-read" onClick={onMarkAllRead}>
            Mark all as read
          </button>
        )}
      </aside>
    </>,
    document.body,
  );
}

export default NotificationsSidebar;
