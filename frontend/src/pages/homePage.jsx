import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import CalendarPanel from '../components/CalendarPanel';
import IngredientsPanel from '../components/IngredientsPanel';
import RecipesPanel from '../components/RecipesPanel';
import { readStoredUser, saveStoredUser, clearStoredUser } from '../services/authStorage';
import { getNotifications, markNotificationRead } from '../services/notificationServices';
import '../dashboard.css';

function HomePage() {
  const [currentUser, setCurrentUser] = useState(() => readStoredUser());
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState('');

  useEffect(() => {
    if (currentUser) {
      saveStoredUser(currentUser);
    } else {
      clearStoredUser();
      setNotifications([]);
      setNotificationError('');
      return;
    }

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
    if (!currentUser) return;

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
    <div className="dashboard">
      <TopBar
        currentUser={currentUser}
        onLogin={setCurrentUser}
        onLogout={() => setCurrentUser(null)}
      />
      <CalendarPanel />
      {currentUser && (
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
      )}
      <div className="dashboard-bottom">
        <IngredientsPanel key={currentUser?.id ?? 'guest'} currentUser={currentUser} />
        <RecipesPanel currentUser={currentUser} />
      </div>
    </div>
  );
}

export default HomePage;
