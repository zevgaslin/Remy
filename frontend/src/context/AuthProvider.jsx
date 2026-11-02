import { useEffect, useState } from 'react';
import { readStoredUser, saveStoredUser, clearStoredUser } from '../services/authStorage';
import { plannedMealsSubject } from '../services/plannedMealsStore';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => readStoredUser());

  useEffect(() => {
    plannedMealsSubject.setOwner(currentUser?.id ?? 'guest');
    if (currentUser) {
      saveStoredUser(currentUser);
    } else {
      clearStoredUser();
    }
  }, [currentUser]);

  const value = {
    currentUser,
    login: user => { plannedMealsSubject.setOwner(user.id); setCurrentUser(user); },
    logout: () => { plannedMealsSubject.setOwner('guest'); setCurrentUser(null); },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
