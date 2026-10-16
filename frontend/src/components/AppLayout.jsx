import { Outlet } from 'react-router';
import TopBar from './TopBar';
import '../dashboard.css';

function AppLayout() {
  return (
    <div className="app-layout">
      <TopBar />
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
