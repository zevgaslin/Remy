import TopBar from '../components/TopBar';
import CalendarPanel from '../components/CalendarPanel';
import IngredientsPanel from '../components/IngredientsPanel';
import RecipesPanel from '../components/RecipesPanel';
import '../dashboard.css';

function HomePage() {
  return (
    <div className="dashboard">
      <TopBar />
      <CalendarPanel />
      <div className="dashboard-bottom">
        <IngredientsPanel />
        <RecipesPanel />
      </div>
    </div>
  );
}

export default HomePage;
