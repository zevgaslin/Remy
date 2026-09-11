import { useState } from 'react';
import AuthModal from './AuthModal';

function TopBar({ currentUser, onLogin, onLogout }) {
  const [modalOpen, setModalOpen] = useState(false);

  function handleAuthSuccess(user) {
    onLogin(user);
    setModalOpen(false);
  }

  return (
    <header className="top-bar">
      <span className="brand">Remy</span>
      {currentUser ? (
        <div className="account-menu">
          <span className="account-greeting">Hi, {currentUser.username}</span>
          <button type="button" className="auth-button" onClick={onLogout}>
            Log Out
          </button>
        </div>
      ) : (
        <button type="button" className="auth-button" onClick={() => setModalOpen(true)}>
          Log In / Sign Up
        </button>
      )}
      {modalOpen && (
        <AuthModal onClose={() => setModalOpen(false)} onAuthSuccess={handleAuthSuccess} />
      )}
    </header>
  );
}

export default TopBar;
