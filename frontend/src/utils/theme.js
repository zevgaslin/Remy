// "system" follows the OS setting; "light" and "dark" override it.
// index.html applies the saved choice before React loads so the page never
// flashes the wrong theme; keep its inline script in sync with this file.
export const THEME_STORAGE_KEY = 'remy-theme';
export const THEMES = ['system', 'light', 'dark'];

export function readTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.includes(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
}

export function saveTheme(theme) {
  try {
    if (theme === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode or blocked storage: the choice just won't survive a reload.
  }
}

export function applyTheme(theme, root = document.documentElement) {
  if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
  else delete root.dataset.theme;
}

export function nextTheme(theme) {
  return THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
}
