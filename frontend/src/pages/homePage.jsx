import CalendarPanel from '../components/CalendarPanel';
import NotificationsPanel from '../components/NotificationsPanel';
import { useAuth } from '../context/useAuth';

function HomePage() {
  const { currentUser } = useAuth();

  return (
    <>
      {currentUser && <NotificationsPanel key={currentUser.id} currentUser={currentUser} />}
      <CalendarPanel />
    </>
  );
}

export default HomePage;
