// Real-world supplement routines, timing windows, macros, and micronutrient effect messages.

const STORAGE_PREFIX = 'remy-supplements:';

export const SUPPLEMENT_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays (Mon–Fri)' },
  { value: 'every-other-day', label: 'Every other day' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'as-needed', label: 'As needed' },
];

export const SUPPLEMENT_TIMING_OPTIONS = Array.from({ length: 24 }, (_, hour) => {
  const value = `${String(hour).padStart(2, '0')}:00`;
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return {
    value,
    hour,
    label: `${hour12}:00 ${period}`,
  };
});

const LEGACY_TIMING_MAP = {
  breakfast: '08:00',
  lunch: '12:00',
  snack: '15:00',
  dinner: '18:00',
  bedtime: '21:00',
};

export function getSupplementTimeInfo(supplementOrTime) {
  const raw = typeof supplementOrTime === 'string'
    ? supplementOrTime
    : supplementOrTime?.timeOfDay;
  const normalized = LEGACY_TIMING_MAP[raw] || raw || '08:00';
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(normalized).trim());
  if (!match) {
    return { time: '08:00', hour: 8, label: '8:00 AM' };
  }
  const hour = Math.min(Math.max(parseInt(match[1], 10), 0), 23);
  const minute = match[2];
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return {
    time: `${String(hour).padStart(2, '0')}:${minute}`,
    hour,
    label: `${hour12}:${minute} ${period}`,
  };
}

export const SUPPLEMENT_PRESETS = [
  {
    name: 'Vitamin B12 Complex',
    dosage: '1000 mcg',
    unit: 'tablet',
    frequency: 'daily',
    timeOfDay: 'breakfast',
    withFood: false,
    addToGoals: true,
    addToCalendar: true,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    effects: ['+ 490% B12', '+ 100% B6'],
  },
  {
    name: 'Whey Protein Isolate',
    dosage: '1 scoop (30g)',
    unit: 'scoop',
    frequency: 'daily',
    timeOfDay: 'snack',
    withFood: false,
    addToGoals: true,
    addToCalendar: true,
    calories: 120,
    protein: 25,
    carbs: 2,
    fat: 1,
    effects: ['+ 25g Fast-Absorbing Protein', '+ 5.5g BCAAs'],
  },
  {
    name: 'Vitamin D3 + K2',
    dosage: '5000 IU',
    unit: 'softgel',
    frequency: 'daily',
    timeOfDay: 'breakfast',
    withFood: true,
    addToGoals: true,
    addToCalendar: true,
    calories: 5,
    protein: 0,
    carbs: 0,
    fat: 0.5,
    effects: ['+ 625% Vitamin D3', '+ 83% Vitamin K2'],
  },
  {
    name: 'Omega-3 Fish Oil',
    dosage: '1200 mg',
    unit: 'softgel',
    frequency: 'daily',
    timeOfDay: 'dinner',
    withFood: true,
    addToGoals: true,
    addToCalendar: true,
    calories: 15,
    protein: 0,
    carbs: 0,
    fat: 1.5,
    effects: ['+ 680mg Omega-3 EPA/DHA', '+ Heart & Brain Support'],
  },
  {
    name: 'Magnesium Glycinate',
    dosage: '400 mg',
    unit: 'capsule',
    frequency: 'daily',
    timeOfDay: 'bedtime',
    withFood: false,
    addToGoals: true,
    addToCalendar: true,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    effects: ['+ 95% Magnesium', '+ Muscle & Sleep Recovery'],
  },
];

function storageKey(owner = 'guest') {
  return `${STORAGE_PREFIX}${owner || 'guest'}`;
}

class SupplementsSubject {
  constructor() {
    this.observers = [];
  }

  subscribe(listener) {
    if (!this.observers.includes(listener)) this.observers.push(listener);
    return () => {
      this.observers = this.observers.filter((other) => other !== listener);
    };
  }

  notify() {
    [...this.observers].forEach((listener) => listener());
  }
}

export const supplementsSubject = new SupplementsSubject();

export function resolveSupplementOwner(userOrToken) {
  if (!userOrToken) return 'guest';
  if (typeof userOrToken === 'string') return userOrToken;
  return userOrToken.token || userOrToken.username || (userOrToken.id != null ? String(userOrToken.id) : 'guest');
}

export function getSupplements(userOrToken) {
  const key = storageKey(resolveSupplementOwner(userOrToken));
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setSupplementsForOwner(userOrToken, list) {
  const key = storageKey(resolveSupplementOwner(userOrToken));
  const safeList = Array.isArray(list) ? list : [];
  try {
    localStorage.setItem(key, JSON.stringify(safeList));
  } catch {
    // Ignore storage quota errors in restricted environments
  }
  supplementsSubject.notify();
  return safeList;
}

export function clearSupplementsForOwner(userOrToken) {
  return setSupplementsForOwner(userOrToken, []);
}

export function normalizeEffects(effects) {
  if (!Array.isArray(effects)) return [];
  return effects
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

export function saveSupplement(userOrToken, supplement) {
  const current = getSupplements(userOrToken);
  const clean = {
    id: supplement.id ?? `supp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: String(supplement.name ?? '').trim(),
    dosage: String(supplement.dosage ?? '').trim() || '1 serving',
    unit: String(supplement.unit ?? 'serving').trim() || 'serving',
    frequency: supplement.frequency || 'daily',
    timeOfDay: supplement.timeOfDay || 'breakfast',
    withFood: Boolean(supplement.withFood),
    addToGoals: supplement.addToGoals !== undefined ? Boolean(supplement.addToGoals) : true,
    addToCalendar: supplement.addToCalendar !== undefined ? Boolean(supplement.addToCalendar) : true,
    calories: Number(supplement.calories) || 0,
    protein: Number(supplement.protein) || 0,
    carbs: Number(supplement.carbs) || 0,
    fat: Number(supplement.fat) || 0,
    effects: normalizeEffects(supplement.effects),
    takenDates: Array.isArray(supplement.takenDates) ? supplement.takenDates : [],
  };

  if (!clean.name) {
    throw new Error('Supplement name is required.');
  }

  const exists = current.some((item) => item.id === clean.id);
  const next = exists
    ? current.map((item) => (item.id === clean.id ? { ...item, ...clean, takenDates: supplement.takenDates ?? item.takenDates ?? [] } : item))
    : [...current, clean];

  return setSupplementsForOwner(userOrToken, next);
}

export function deleteSupplement(userOrToken, id) {
  const current = getSupplements(userOrToken);
  const next = current.filter((item) => item.id !== id);
  return setSupplementsForOwner(userOrToken, next);
}

export function toggleSupplementTakenOnDate(userOrToken, id, dateStr) {
  const current = getSupplements(userOrToken);
  const next = current.map((item) => {
    if (item.id !== id) return item;
    const takenDates = Array.isArray(item.takenDates) ? item.takenDates : [];
    const nextTaken = takenDates.includes(dateStr)
      ? takenDates.filter((d) => d !== dateStr)
      : [...takenDates, dateStr];
    return { ...item, takenDates: nextTaken };
  });
  return setSupplementsForOwner(userOrToken, next);
}

export function isSupplementScheduledForDate(supplement, date) {
  if (!supplement || !supplement.addToCalendar) return false;
  const d = date instanceof Date ? date : new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat

  switch (supplement.frequency) {
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekly':
      return dayOfWeek === 1; // Mondays
    case 'every-other-day': {
      const epochDays = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
      return epochDays % 2 === 0;
    }
    case 'as-needed': {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return Array.isArray(supplement.takenDates) && supplement.takenDates.includes(dateStr);
    }
    case 'daily':
    default:
      return true;
  }
}

export function getScheduledSupplementsForDate(supplements, date) {
  if (!Array.isArray(supplements)) return [];
  return supplements.filter((supp) => isSupplementScheduledForDate(supp, date));
}

export function getSupplementNutritionTotals(supplements, date) {
  const scheduled = date ? getScheduledSupplementsForDate(supplements, date) : (supplements || []).filter((s) => s.addToGoals);
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  scheduled.forEach((supp) => {
    totals.calories += Number(supp.calories) || 0;
    totals.protein += Number(supp.protein) || 0;
    totals.carbs += Number(supp.carbs) || 0;
    totals.fat += Number(supp.fat) || 0;
  });
  return totals;
}

export function collectSupplementEffects(supplements, { onlyGoals = false, date = null } = {}) {
  if (!Array.isArray(supplements)) return [];
  const active = date
    ? getScheduledSupplementsForDate(supplements, date)
    : onlyGoals
      ? supplements.filter((s) => s.addToGoals)
      : supplements;

  const result = [];
  active.forEach((supp) => {
    normalizeEffects(supp.effects).forEach((effect) => {
      result.push({
        id: `${supp.id}:${effect}`,
        supplementId: supp.id,
        supplementName: supp.name,
        text: effect,
      });
    });
  });
  return result;
}
