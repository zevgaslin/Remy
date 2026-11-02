import CalendarPanel from '../components/CalendarPanel';
import NutritionGoalsCard from '../components/NutritionGoalsCard';
import { useAuth } from '../context/useAuth';
import { useNutritionGoals } from '../hooks/useNutritionGoals';

function HomePage() {
  const { currentUser } = useAuth();
  const { goals, error, saveGoals } = useNutritionGoals(currentUser);

  return (
    <>
      <NutritionGoalsCard
        key={currentUser?.id ?? 'guest'}
        currentUser={currentUser}
        goals={goals}
        loadError={error}
        onSave={saveGoals}
      />
      <CalendarPanel goals={goals} currentUser={currentUser} />
    </>
  );
}

export default HomePage;
