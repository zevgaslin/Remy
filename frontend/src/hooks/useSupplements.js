import { useCallback, useEffect, useState } from 'react';
import {
  getSupplements,
  saveSupplement,
  deleteSupplement,
  toggleSupplementTakenOnDate,
  supplementsSubject,
} from '../services/supplementServices';

export function useSupplements(currentUser) {
  const [supplements, setSupplements] = useState(() => getSupplements(currentUser));

  useEffect(() => {
    setSupplements(getSupplements(currentUser));
    return supplementsSubject.subscribe(() => {
      setSupplements(getSupplements(currentUser));
    });
  }, [currentUser]);

  const addOrUpdateSupplement = useCallback(
    (supplementData) => {
      const updated = saveSupplement(currentUser, supplementData);
      setSupplements(updated);
      return updated;
    },
    [currentUser],
  );

  const removeSupplement = useCallback(
    (id) => {
      const updated = deleteSupplement(currentUser, id);
      setSupplements(updated);
      return updated;
    },
    [currentUser],
  );

  const toggleTaken = useCallback(
    (id, dateStr) => {
      const updated = toggleSupplementTakenOnDate(currentUser, id, dateStr);
      setSupplements(updated);
      return updated;
    },
    [currentUser],
  );

  return {
    supplements,
    addOrUpdateSupplement,
    removeSupplement,
    toggleTaken,
  };
}
