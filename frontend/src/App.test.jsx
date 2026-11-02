import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from './App';
import { AuthProvider } from './context/AuthProvider';
import * as authServices from './services/authServices';
import * as notificationServices from './services/notificationServices';
import * as goalServices from './services/goalServices';

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
  default: ({ goals }) => <div data-testid="calendar-panel">{goals.calories} kcal goal</div>,
}));
vi.mock('./services/goalServices', () => ({
  getNutritionGoals: vi.fn(),
  saveNutritionGoals: vi.fn(),
}));
vi.mock('./services/authServices', async (importOriginal) => ({
  ...(await importOriginal()),
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
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
    authServices.getCurrentUser.mockImplementation(() => new Promise(() => {}));
    authServices.logout.mockResolvedValue({ loggedOut: true });
    goalServices.getNutritionGoals.mockResolvedValue({ calories: 3200, protein: 180, carbs: 350, fat: 90 });
  });

  it('plans against the default goals for guests', () => {
    renderAt('/');

    expect(screen.getByTestId('calendar-panel')).toHaveTextContent('2000 kcal goal');
    expect(screen.getByText('Log in to set your own goals.')).toBeInTheDocument();
    expect(goalServices.getNutritionGoals).not.toHaveBeenCalled();
  });

  it('loads a logged-in user\'s saved goals into the planner', async () => {
    localStorage.setItem(
      'remy-current-user',
      JSON.stringify({ id: 3, username: 'jordan', token: 'abc' }),
    );
    renderAt('/');

    expect(await screen.findByText('3200 kcal goal')).toBeInTheDocument();
    expect(goalServices.getNutritionGoals).toHaveBeenCalledWith('abc');
    expect(screen.getByRole('button', { name: 'Edit goals' })).toBeInTheDocument();
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

  it('shows the notification bell for a logged-in user and keeps the user across pages', async () => {
    localStorage.setItem(
      'remy-current-user',
      JSON.stringify({ id: 3, username: 'jordan', token: 'abc' }),
    );
    renderAt('/');

    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
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

    expect(authServices.logout).toHaveBeenCalledWith('abc');
    expect(screen.getByTestId('ingredients-panel')).toHaveTextContent('guest');
    expect(screen.getByRole('button', { name: 'Log In / Sign Up' })).toBeInTheDocument();
    expect(localStorage.getItem('remy-current-user')).toBeNull();
  });

  it('stays logged in after a refresh when the saved session is still valid', async () => {
    localStorage.setItem('remy-current-user', JSON.stringify({ id: 3, username: 'jordan', token: 'abc' }));
    authServices.getCurrentUser.mockResolvedValue({ id: 3, username: 'jordan', email: 'j@example.com' });
    renderAt('/pantry');

    await waitFor(() => expect(authServices.getCurrentUser).toHaveBeenCalledWith('abc'));
    expect(screen.getByTestId('ingredients-panel')).toHaveTextContent('jordan');
    await waitFor(() => expect(JSON.parse(localStorage.getItem('remy-current-user')))
      .toEqual({ id: 3, username: 'jordan', email: 'j@example.com', token: 'abc' }));
  });

  it('logs out on refresh when the server says the saved session has ended', async () => {
    localStorage.setItem('remy-current-user', JSON.stringify({ id: 3, username: 'jordan', token: 'old' }));
    authServices.getCurrentUser.mockRejectedValue(new authServices.SessionExpiredError('ended'));
    renderAt('/pantry');

    await waitFor(() => expect(screen.getByTestId('ingredients-panel')).toHaveTextContent('guest'));
    expect(localStorage.getItem('remy-current-user')).toBeNull();
  });

  it('keeps the user logged in when the session check cannot reach the server', async () => {
    localStorage.setItem('remy-current-user', JSON.stringify({ id: 3, username: 'jordan', token: 'abc' }));
    authServices.getCurrentUser.mockRejectedValue(new TypeError('Failed to fetch'));
    renderAt('/pantry');

    await waitFor(() => expect(authServices.getCurrentUser).toHaveBeenCalled());
    // Let the rejected check settle before asserting nothing changed.
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(screen.getByTestId('ingredients-panel')).toHaveTextContent('jordan');
  });
});
