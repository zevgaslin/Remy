import { describe, expect, it, beforeEach } from 'vitest';
import { readStoredUser, saveStoredUser, clearStoredUser } from '../src/services/authStorage.js';

const storedValues = new Map();

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    clear: () => storedValues.clear(),
    getItem: (key) => storedValues.get(key) ?? null,
    removeItem: (key) => storedValues.delete(key),
    setItem: (key, value) => storedValues.set(key, String(value)),
  },
});

beforeEach(() => {
  localStorage.clear();
});

describe('auth storage', () => {
  it('restores a saved user across browser restarts', () => {
    const user = { id: 7, username: 'remy', email: 'remy@example.com', token: 'abc123' };

    saveStoredUser(user);

    expect(readStoredUser()).toEqual(user);
  });

  it('removes the stored session when the user logs out', () => {
    saveStoredUser({ id: 1, username: 'guest', token: 'token' });

    clearStoredUser();

    expect(readStoredUser()).toBeNull();
  });
});
