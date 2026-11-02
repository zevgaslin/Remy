import { useEffect, useRef, useState } from 'react';
import { plannedMealsSubject, setSharedPlannedMeals } from '../services/plannedMealsStore';
import { getCalendar, saveCalendar } from '../services/calendarServices';

// CalendarPanel is keyed by session: stale requests cannot populate a different account.
export function useCalendarPlan(currentUser) {
  const token = currentUser?.token;
  const owner = currentUser?.id ?? 'guest';
  const [plan, setPlan] = useState(() => ({ revision: 0,
    plannedMeals: !token && plannedMealsSubject.owner === owner ? plannedMealsSubject.getPlannedMeals() : {},
    dailyMealSlots: !token && plannedMealsSubject.owner === owner ? plannedMealsSubject.getDailyMealSlots() : {},
  }));
  const [loading, setLoading] = useState(!!token);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState(null);
  const [reload, setReload] = useState(0);
  const active = useRef(false);
  const busy = useRef(false);
  const pending = useRef(null);
  useEffect(() => {
    active.current = true;
    plannedMealsSubject.setOwner(owner);
    if (!token) return () => { active.current = false; };
    let cancelled = false;
    getCalendar(token).then(saved => {
      if (!cancelled) { setPlan(saved); setLoading(false); setFailure(null); }
    }).catch(error => {
      if (!cancelled) { setLoading(false); setFailure({ message: error.message, load: true }); }
    });
    return () => { active.current = false; cancelled = true; };
  }, [token, owner, reload]);
  useEffect(() => {
    setSharedPlannedMeals(plan.plannedMeals);
    plannedMealsSubject.setDailyMealSlots(plan.dailyMealSlots);
  }, [plan]);
  async function commit(next, retry = false) {
    if (busy.current || loading || (failure && !retry)) return false;
    busy.current = true;
    setSaving(true);
    setFailure(null);
    pending.current = next;
    try {
      const saved = token ? await saveCalendar(token, next) : next;
      if (active.current) { setPlan(saved); pending.current = null; }
      return true;
    } catch (error) {
      if (active.current) setFailure({ message: `Change not saved. ${error.message}`, conflict: error.status === 409 });
      return false;
    } finally {
      busy.current = false;
      if (active.current) setSaving(false);
    }
  }
  function loadSaved() {
    pending.current = null;
    setLoading(!!token);
    setFailure(null);
    setReload(value => value+1);
  }
  return { ...plan, loading, saving, failure, commit, loadSaved,
    retrySave: () => pending.current && commit(pending.current, true) };
}
