import { useCallback, useEffect, useState } from 'react';
import { getNutritionGoals, saveNutritionGoals } from '../services/goalServices';
import { DEFAULT_GOALS } from '../utils/nutritionGoals';

// Guests and users who haven't loaded yet see the default goals.
export function useNutritionGoals(currentUser) {
  const token = currentUser?.token;
  const [loaded, setLoaded] = useState(null); // { token, goals }
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    getNutritionGoals(token)
      .then((goals) => {
        setLoaded({ token, goals });
        setError('');
      })
      .catch((err) => setError(err.message));
  }, [token]);

  const saveGoals = useCallback(
    async (goals) => {
      const saved = await saveNutritionGoals(token, goals);
      setLoaded({ token, goals: saved });
      setError('');
      return saved;
    },
    [token],
  );

  const goals = token && loaded?.token === token ? loaded.goals : DEFAULT_GOALS;

  return { goals, error: token ? error : '', saveGoals };
}
