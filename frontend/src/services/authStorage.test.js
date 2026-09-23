/** @vitest-environment jsdom */

import { describe, expect, it, beforeEach } from 'vitest';
import { readStoredUser, saveStoredUser, clearStoredUser } from './authStorage.js';

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
