class Subject {
  constructor() {
    this.observers = [];
  }

  addObserver(observer) {
    if (!this.observers.includes(observer)) this.observers.push(observer);
  }

  removeObserver(observer) {
    this.observers = this.observers.filter((other) => other !== observer);
  }

  notifyObservers() {
    // Copy first so an observer can unsubscribe while being notified.
    [...this.observers].forEach((observer) => observer.update(this));
  }
}

class PlannedMealsSubject extends Subject {
  constructor() {
    super();
    this.owner = 'guest';
    this.plannedMeals = {};
    this.dailyMealSlots = {};
  }

  setOwner(owner) {
    if (this.owner === owner) return;
    this.owner = owner;
    this.dailyMealSlots = {};
    this.setPlannedMeals({});
  }

  getPlannedMeals() {
    return this.plannedMeals;
  }

  setPlannedMeals(plannedMeals) {
    this.plannedMeals = plannedMeals;
    this.notifyObservers();
  }

  // Custom meal slots are remembered here too, but the cart doesn't need to be notified.
  getDailyMealSlots() {
    return this.dailyMealSlots;
  }

  setDailyMealSlots(dailyMealSlots) {
    this.dailyMealSlots = dailyMealSlots;
  }
}

// Shared with the shopping cart; cleared whenever the signed-in account changes.
export const plannedMealsSubject = new PlannedMealsSubject();

// CalendarPanel keeps calling this, so it needs no changes.
export function setSharedPlannedMeals(next) {
  plannedMealsSubject.setPlannedMeals(next);
}

