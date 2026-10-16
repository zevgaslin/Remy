import { useCallback, useRef, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { playBellSound } from '../utils/bellSound';
import NotificationsSidebar from './NotificationsSidebar';

function NotificationBell({ currentUser }) {
  const { unread, error, refresh, markRead, markAllRead } = useNotifications(currentUser);
  const [open, setOpen] = useState(false);
  const [ringing, setRinging] = useState(false);
  const bellRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    bellRef.current?.focus();
  }, []);

  function handleClick() {
    if (open) {
      close();
      return;
    }
    playBellSound();
    setRinging(true);
    setOpen(true);
    refresh();
  }

  const count = unread.length;

  return (
    <>
      <button
        ref={bellRef}
        type="button"
        className={`bell-button${ringing ? ' ringing' : ''}`}
        aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
        aria-expanded={open}
        aria-controls="notifications-sidebar"
        onClick={handleClick}
        onAnimationEnd={() => setRinging(false)}
      >
        <svg className="bell-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M12 3a6 6 0 0 0-6 6v3.6l-1.7 2.9A1 1 0 0 0 5.2 17h13.6a1 1 0 0 0 .9-1.5L18 12.6V9a6 6 0 0 0-6-6z" />
          <path className="bell-clapper" d="M9.5 19a2.5 2.5 0 0 0 5 0z" />
        </svg>
        {count > 0 && (
          <span className="bell-badge" aria-hidden="true">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && (
        <NotificationsSidebar
          unread={unread}
          error={error}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          onClose={close}
        />
      )}
    </>
  );
}

export default NotificationBell;
