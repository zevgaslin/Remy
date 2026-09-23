import { API_BASE } from './apiBase.js';

export async function getNotifications(token) {
  const response = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(data.error || 'Could not load notifications.');
  }
  return data;
}

export async function markNotificationRead(token, id) {
  const response = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Could not mark notification as read.');
  }
  return data;
}
