import { useSearchParams } from 'react-router';
import { parseCalendarDate } from '../utils/calendarDate';
import WeeklyRecap from '../components/WeeklyRecap';
import { MealLogProvider } from '../context/MealLogContext';
import CalendarPanel from '../components/CalendarPanel';
import NutritionGoalsCard from '../components/NutritionGoalsCard';
import { useAuth } from '../context/useAuth';
import { useNutritionGoals } from '../hooks/useNutritionGoals';

function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = parseCalendarDate(searchParams.get('date'));
  function returnToToday() {
    setSearchParams(previous => { const next = new URLSearchParams(previous); next.delete('date'); return next; });
  }
  const { currentUser } = useAuth();
  const { goals, error, saveGoals } = useNutritionGoals(currentUser);

  return (
    <MealLogProvider key={currentUser?.id ?? 'guest'} currentUser={currentUser}>
      <div className="meal-dashboard">
        <h1 className="dashboard-title">Meal Planner</h1>
        <div className="planner-layout">
          <NutritionGoalsCard
            key={currentUser?.id ?? 'guest'}
            currentUser={currentUser}
            goals={goals}
            loadError={error}
            onSave={saveGoals}
          />
          <CalendarPanel key={`${currentUser?.token ?? 'guest'}:${searchParams.get('date') ?? ''}`} goals={goals} currentUser={currentUser} selectedDate={selectedDate} onToday={returnToToday} />
        </div>
        <WeeklyRecap goals={goals} />
      </div>
    </MealLogProvider>
  );
}

export default HomePage;
