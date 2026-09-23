const STORAGE_KEY = 'remy-current-user';

export function readStoredUser() {
  try {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

export function saveStoredUser(user) {
  if (!user) {
    clearStoredUser();
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY);
}

export { STORAGE_KEY };
