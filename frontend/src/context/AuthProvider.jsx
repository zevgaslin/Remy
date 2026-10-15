import { useEffect, useState } from 'react';
import { readStoredUser, saveStoredUser, clearStoredUser } from '../services/authStorage';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => readStoredUser());

  useEffect(() => {
    if (currentUser) {
      saveStoredUser(currentUser);
    } else {
      clearStoredUser();
    }
  }, [currentUser]);

  const value = {
    currentUser,
    login: setCurrentUser,
    logout: () => setCurrentUser(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
