// Pantry items expiring within this many days count as "expiring soon" in recipe search.
export const EXPIRING_SOON_DAYS = 3;

export function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

// Already-expired items are left out: they should be thrown away, not cooked.
export function expiringSoonNames(ingredients, days = EXPIRING_SOON_DAYS) {
  return ingredients
    .filter((item) => item.name && item.expirationDate)
    .filter((item) => {
      const daysLeft = daysUntil(item.expirationDate);
      return daysLeft >= 0 && daysLeft <= days;
    })
    .map((item) => item.name);
}
