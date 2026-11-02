import { useEffect, useRef, useState } from 'react';
import { readStoredUser, saveStoredUser, clearStoredUser } from '../services/authStorage';
<<<<<<< HEAD
import { plannedMealsSubject } from '../services/plannedMealsStore';
=======
import { getCurrentUser, logout as endServerSession, SessionExpiredError } from '../services/authServices';
>>>>>>> 5c9c23b9f6d25d5b46830c48608be2d1178d6413
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => readStoredUser());
  const startupToken = useRef(currentUser?.token);

  useEffect(() => {
    plannedMealsSubject.setOwner(currentUser?.id ?? 'guest');
    if (currentUser) {
      saveStoredUser(currentUser);
    } else {
      clearStoredUser();
    }
  }, [currentUser]);

  // After a refresh, make sure the saved session still exists on the server. A network
  // failure keeps the user logged in; only a rejected session logs them out.
  useEffect(() => {
    const token = startupToken.current;
    if (!token) return undefined;
    let active = true;
    getCurrentUser(token)
      .then(profile => {
        if (active) setCurrentUser(user => (user?.token === token ? { ...user, ...profile, token } : user));
      })
      .catch(error => {
        if (active && error instanceof SessionExpiredError) {
          setCurrentUser(user => (user?.token === token ? null : user));
        }
      });
    return () => { active = false; };
  }, []);

  function logout() {
    if (currentUser?.token) {
      endServerSession(currentUser.token).catch(() => {});
    }
    setCurrentUser(null);
  }

  const value = {
    currentUser,
<<<<<<< HEAD
    login: user => { plannedMealsSubject.setOwner(user.id); setCurrentUser(user); },
    logout: () => { plannedMealsSubject.setOwner('guest'); setCurrentUser(null); },
=======
    login: setCurrentUser,
    logout,
>>>>>>> 5c9c23b9f6d25d5b46830c48608be2d1178d6413
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
