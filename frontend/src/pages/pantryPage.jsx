import IngredientsPanel from '../components/IngredientsPanel';
import { useAuth } from '../context/useAuth';

function PantryPage() {
  const { currentUser } = useAuth();

  return <IngredientsPanel key={currentUser?.id ?? 'guest'} currentUser={currentUser} />;
}

export default PantryPage;
