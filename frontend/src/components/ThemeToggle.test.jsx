// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ThemeToggle from './ThemeToggle';

afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('ThemeToggle', () => {
  it('cycles the theme, applies it to the page, and remembers it', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /Theme: System/ });

    fireEvent.click(button);
    expect(screen.getByRole('button', { name: 'Theme: Light. Switch to Dark.' })).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('remy-theme')).toBe('light');

    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe('dark');

    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem('remy-theme')).toBeNull();
  });

  it('starts from the saved choice', () => {
    localStorage.setItem('remy-theme', 'dark');
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: /Theme: Dark/ })).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
