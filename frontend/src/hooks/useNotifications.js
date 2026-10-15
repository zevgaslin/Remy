import { useCallback, useEffect, useState } from 'react';
import { getNotifications, markNotificationRead } from '../services/notificationServices';

export function useNotifications(currentUser) {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const token = currentUser.token;

  const refresh = useCallback(
    () =>
      getNotifications(token)
        .then((data) => {
          setNotifications(data);
          setError('');
        })
        .catch(() => {
          setError('Could not load notifications.');
        }),
    [token],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markRead = useCallback(
    async (notificationId) => {
      try {
        await markNotificationRead(token, notificationId);
        setNotifications((prev) =>
          prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item)),
        );
      } catch {
        setError('Could not update this notification.');
      }
    },
    [token],
  );

  const unread = notifications.filter((item) => !item.read);

  const markAllRead = useCallback(
    () => Promise.all(unread.map((item) => markRead(item.id))),
    [unread, markRead],
  );

  return { unread, error, refresh, markRead, markAllRead };
}
