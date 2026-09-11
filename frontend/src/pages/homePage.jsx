import { useState } from 'react';
import TopBar from '../components/TopBar';
import CalendarPanel from '../components/CalendarPanel';
import IngredientsPanel from '../components/IngredientsPanel';
import RecipesPanel from '../components/RecipesPanel';
import '../dashboard.css';

function HomePage() {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <div className="dashboard">
      <TopBar
        currentUser={currentUser}
        onLogin={setCurrentUser}
        onLogout={() => setCurrentUser(null)}
      />
      <CalendarPanel />
      <div className="dashboard-bottom">
        <IngredientsPanel />
        <RecipesPanel />
      </div>
    </div>
  );
}

export default HomePage;
