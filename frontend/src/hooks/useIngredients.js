import { useEffect, useState } from 'react';
import { getMyIngredients } from '../services/ingredientServices';

/** Both pantry and recipe search use the same cached pantry-loading lifecycle. */
export function useIngredients(token) {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setIngredients([]);
    setError(null);
    setLoading(Boolean(token));
    if (token) {
      getMyIngredients(token)
        .then(data => { if (active) setIngredients(data); })
        .catch(error => {
          if (active) setError(error.message || 'Could not load ingredients. Is the backend running?');
        })
        .finally(() => { if (active) setLoading(false); });
    }
    return () => { active = false; };
  }, [token]);

  return { ingredients, setIngredients, loading, error, setError };
}
