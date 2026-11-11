import { Outlet } from 'react-router';
import TopBar from './TopBar';
import '../dashboard.css';
import '../campus.css';
import '../canteen.css';

function AppLayout() {
  return (
    <div className="app-layout">
      <TopBar />
      <main className="page">
        <Outlet />
      </main>
      <footer className="app-footer">
        Food illustrations by <a href="https://openmoji.org/" target="_blank" rel="noreferrer">OpenMoji</a>
        {' · '}<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>
        {' · '}Unmodified
      </footer>
    </div>
  );
}

export default AppLayout;
