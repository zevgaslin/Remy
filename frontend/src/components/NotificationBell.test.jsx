import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationBell from './NotificationBell';
import * as notificationServices from '../services/notificationServices';
import * as bellSound from '../utils/bellSound';

vi.mock('../services/notificationServices', () => ({
  getNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
}));

vi.mock('../utils/bellSound', () => ({
  playBellSound: vi.fn(),
}));

const user = { id: 1, username: 'jordan', token: 'abc' };
const notifications = [
  { id: 1, type: 'EXPIRED', message: 'Your Milk expired.', read: false },
  { id: 2, type: 'EXPIRING_SOON', message: 'Your Eggs expire in 2 day(s).', read: false },
  { id: 3, type: 'EXPIRED', message: 'Old one.', read: true },
];

async function renderBell() {
  render(<NotificationBell currentUser={user} />);
  return screen.findByRole('button', { name: 'Notifications, 2 unread' });
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationServices.getNotifications.mockResolvedValue(notifications);
    notificationServices.markNotificationRead.mockResolvedValue({ read: true });
  });

  it('shows the unread count on the bell without opening the sidebar', async () => {
    const bell = await renderBell();

    expect(bell).toHaveTextContent('2');
    expect(bell).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('rings, opens the sidebar and refreshes the list when clicked', async () => {
    const bell = await renderBell();

    fireEvent.click(bell);

    expect(bellSound.playBellSound).toHaveBeenCalledTimes(1);
    expect(bell).toHaveAttribute('aria-expanded', 'true');
    const sidebar = screen.getByRole('dialog', { name: 'Notifications' });
    expect(sidebar).toHaveTextContent('Your Milk expired.');
    expect(sidebar).toHaveTextContent('Your Eggs expire in 2 day(s).');
    expect(sidebar).not.toHaveTextContent('Old one.');
    expect(notificationServices.getNotifications).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Close notifications' })).toHaveFocus();
  });

  it('marks a notification read and lowers the count', async () => {
    fireEvent.click(await renderBell());

    fireEvent.click(screen.getAllByRole('button', { name: 'Mark read' })[0]);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Notifications, 1 unread' })).toBeInTheDocument(),
    );
    expect(notificationServices.markNotificationRead).toHaveBeenCalledWith('abc', 1);
    expect(screen.getByRole('dialog')).not.toHaveTextContent('Your Milk expired.');
  });

  it('marks everything read at once', async () => {
    fireEvent.click(await renderBell());

    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));

    expect(await screen.findByText('You’re all caught up.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(notificationServices.markNotificationRead).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['Escape', () => fireEvent.keyDown(window, { key: 'Escape' })],
    ['the backdrop', () => fireEvent.click(screen.getByTestId('sidebar-backdrop'))],
    ['the close button', () => fireEvent.click(screen.getByRole('button', { name: 'Close notifications' }))],
  ])('closes with %s and returns focus to the bell', async (_, closeAction) => {
    const bell = await renderBell();
    fireEvent.click(bell);

    closeAction();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(bell).toHaveFocus();
    expect(bellSound.playBellSound).toHaveBeenCalledTimes(1);
  });

  it('shows an empty state when there is nothing new', async () => {
    notificationServices.getNotifications.mockResolvedValue([]);
    render(<NotificationBell currentUser={user} />);

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(await screen.findByText('You’re all caught up.')).toBeInTheDocument();
  });
});
