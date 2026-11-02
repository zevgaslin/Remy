import { API_BASE } from './apiBase';
async function request(token, options) {
  const response = await fetch(`${API_BASE}/users/me/calendar`, {
    ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = response.status === 401 ? 'Your session expired. Log out and log in again to load your calendar.' :
      response.status === 409 ? 'Your calendar changed in another tab. Reload the saved calendar before editing.' :
      data.error || 'Could not save your calendar. Please try again.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}
export const getCalendar = token => request(token);
export const saveCalendar = (token, plan) => request(token, { method: 'PUT', body: JSON.stringify(plan) });
