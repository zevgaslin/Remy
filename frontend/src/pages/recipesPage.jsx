import RecipesPanel from '../components/RecipesPanel';
import { useAuth } from '../context/useAuth';

function RecipesPage() {
  const { currentUser } = useAuth();

  return <RecipesPanel currentUser={currentUser} />;
}

export default RecipesPage;
