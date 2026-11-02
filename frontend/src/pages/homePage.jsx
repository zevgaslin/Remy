import WeeklyRecap from '../components/WeeklyRecap';
import { MealLogProvider } from '../context/MealLogContext';
import CalendarPanel from '../components/CalendarPanel';
import NutritionGoalsCard from '../components/NutritionGoalsCard';
import { useAuth } from '../context/useAuth';
import { useNutritionGoals } from '../hooks/useNutritionGoals';

function HomePage() {
  const { currentUser } = useAuth();
  const { goals, error, saveGoals } = useNutritionGoals(currentUser);

  return (
    <MealLogProvider key={currentUser?.id ?? 'guest'} currentUser={currentUser}>
      <NutritionGoalsCard
        key={currentUser?.id ?? 'guest'}
        currentUser={currentUser}
        goals={goals}
        loadError={error}
        onSave={saveGoals}
      />
<<<<<<< HEAD
      <CalendarPanel key={currentUser?.token ?? 'guest'} goals={goals} currentUser={currentUser} />
=======
      <CalendarPanel goals={goals} currentUser={currentUser} />
>>>>>>> 5c9c23b9f6d25d5b46830c48608be2d1178d6413
      <WeeklyRecap />
    </MealLogProvider>
  );
}

export default HomePage;
