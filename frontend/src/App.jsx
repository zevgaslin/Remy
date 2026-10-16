import { BrowserRouter, Route, Routes } from 'react-router';
import AppLayout from './components/AppLayout';
import { AuthProvider } from './context/AuthProvider';
import HomePage from './pages/homePage';
import PantryPage from './pages/pantryPage';
import RecipesPage from './pages/recipesPage';
import NotFoundPage from './pages/notFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="pantry" element={<PantryPage />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
