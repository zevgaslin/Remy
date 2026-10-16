import { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead } from '../services/notificationServices';

function NotificationsPanel({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState('');

  useEffect(() => {
    getNotifications(currentUser.token)
      .then((data) => {
        setNotifications(data);
        setNotificationError('');
      })
      .catch(() => {
        setNotificationError('Could not load notifications.');
      });
  }, [currentUser]);

  const unreadNotifications = notifications.filter((item) => !item.read);

  async function handleMarkRead(notificationId) {
    try {
      await markNotificationRead(currentUser.token, notificationId);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, read: true } : item,
        ),
      );
    } catch {
      setNotificationError('Could not update this notification.');
    }
  }

  return (
    <section className="notification-panel">
      <div className="notification-header">
        <h2>Notifications</h2>
        {unreadNotifications.length > 0 && (
          <span className="notification-badge">{unreadNotifications.length}</span>
        )}
      </div>

      {notificationError && <p className="error-text">{notificationError}</p>}

      {!notificationError && unreadNotifications.length === 0 && (
        <p className="notification-empty">You’re all caught up.</p>
      )}

      {unreadNotifications.length > 0 && (
        <ul className="notification-list">
          {unreadNotifications.map((notification) => (
            <li key={notification.id} className="notification-item">
              <div>
                <strong>{notification.type === 'EXPIRED' ? 'Expired food' : 'Expiring soon'}</strong>
                <p>{notification.message}</p>
              </div>
              <button
                type="button"
                className="notification-dismiss"
                onClick={() => handleMarkRead(notification.id)}
              >
                Mark read
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default NotificationsPanel;
