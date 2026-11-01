import { API_BASE } from './apiBase';
export const timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function monday(date = new Date()) {
  const day = new Date(date);
  day.setDate(day.getDate() - (day.getDay()+6)%7);
  return localDate(day);
}
export async function mealRequest(token, path, options = {}) {
  const response = await fetch(`${API_BASE}/users/me${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);
  if (response.status === 401) throw new Error('Your session expired. Log out and log in again to view your food journal.');
  if (!response.ok) throw new Error(data?.error || 'Could not update your meal history. Please try again.');
  return data;
}
export function getWeeklyRecap(token, weekStart) {
  return mealRequest(token, `/recaps/weekly?${new URLSearchParams({ weekStart, timezone: timezone() })}`);
}
