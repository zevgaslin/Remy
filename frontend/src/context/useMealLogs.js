import { createContext, useContext } from 'react';
export const MealLogContext = createContext(null);
export const useMealLogs = () => useContext(MealLogContext);
