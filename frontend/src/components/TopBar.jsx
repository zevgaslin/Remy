import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import AuthModal from './AuthModal';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/useAuth';

const NAV_LINKS = [
  { to: '/', label: 'Meal Planner', end: true },
  { to: '/kitchen', label: 'Kitchen' },
  { to: '/pantry', label: 'Pantry' },
  { to: '/recipes', label: 'Recipes' },
];

function TopBar() {
  const { currentUser, login, logout } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  function handleAuthSuccess(user) {
    login(user);
    setModalOpen(false);
  }

  return (
    <header className="top-bar">
      <Link to="/" className="brand" aria-label="Remy">
        <span className="brand-wordmark">Remy</span>
        <img className="brand-dark-logo" src="/branding/remy-dark-logo.png" alt="" width="58" height="64" />
      </Link>
      <nav className="main-nav" aria-label="Main">
        {NAV_LINKS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="account-menu">
        <ThemeToggle />
        {currentUser ? (
          <>
            <NotificationBell key={currentUser.id} currentUser={currentUser} />
            <span className="account-greeting">Hi, {currentUser.username}</span>
            <button type="button" className="auth-button" onClick={logout}>
              Log Out
            </button>
          </>
        ) : (
          <button type="button" className="auth-button" onClick={() => setModalOpen(true)}>
            Log In / Sign Up
          </button>
        )}
      </div>
      {modalOpen && (
        <AuthModal onClose={() => setModalOpen(false)} onAuthSuccess={handleAuthSuccess} />
      )}
    </header>
  );
}

export default TopBar;
