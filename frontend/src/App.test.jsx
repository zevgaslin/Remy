import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from './App';
import { AuthProvider } from './context/AuthProvider';
import * as notificationServices from './services/notificationServices';

// Stub the panels so these tests only cover routing and layout
vi.mock('./components/IngredientsPanel', () => ({
  default: ({ currentUser }) => (
    <div data-testid="ingredients-panel">{currentUser ? currentUser.username : 'guest'}</div>
  ),
}));
vi.mock('./components/RecipesPanel', () => ({
  default: () => <div data-testid="recipes-panel" />,
}));
vi.mock('./components/CalendarPanel', () => ({
  default: () => <div data-testid="calendar-panel" />,
}));
vi.mock('./services/notificationServices', () => ({
  getNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
}));

function renderAt(path) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('App routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    notificationServices.getNotifications.mockResolvedValue([]);
  });

  it('shows the meal planner on the home page', () => {
    renderAt('/');

    expect(screen.getByTestId('calendar-panel')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Notifications' })).not.toBeInTheDocument();
  });

  it.each([
    ['/', 'calendar-panel', 'Meal Planner'],
    ['/pantry', 'ingredients-panel', 'Pantry'],
    ['/recipes', 'recipes-panel', 'Recipes'],
  ])('renders %s with its panel and marks the nav link active', (path, testId, linkName) => {
    renderAt(path);

    expect(screen.getByTestId(testId)).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav.querySelector('.nav-link.active')).toHaveTextContent(linkName);
  });

  it('navigates between pages from the top bar', () => {
    renderAt('/');

    fireEvent.click(screen.getByRole('link', { name: 'Recipes' }));

    expect(screen.getByTestId('recipes-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-panel')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Meal Planner' }));

    expect(screen.getByTestId('calendar-panel')).toBeInTheDocument();
  });

  it('shows a not found page for unknown paths', () => {
    renderAt('/does-not-exist');

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('shows notifications above the planner and keeps the user across pages', async () => {
    localStorage.setItem(
      'remy-current-user',
      JSON.stringify({ id: 3, username: 'jordan', token: 'abc' }),
    );
    renderAt('/');

    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    await waitFor(() => expect(notificationServices.getNotifications).toHaveBeenCalledWith('abc'));

    fireEvent.click(screen.getByRole('link', { name: 'Pantry' }));

    expect(screen.getByTestId('ingredients-panel')).toHaveTextContent('jordan');
  });

  it('clears the user on log out', () => {
    localStorage.setItem(
      'remy-current-user',
      JSON.stringify({ id: 3, username: 'jordan', token: 'abc' }),
    );
    renderAt('/pantry');

    fireEvent.click(screen.getByRole('button', { name: 'Log Out' }));

    expect(screen.getByTestId('ingredients-panel')).toHaveTextContent('guest');
    expect(screen.getByRole('button', { name: 'Log In / Sign Up' })).toBeInTheDocument();
    expect(localStorage.getItem('remy-current-user')).toBeNull();
  });
});
