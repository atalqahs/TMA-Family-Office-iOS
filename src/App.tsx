import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { CATEGORIES } from './features/categories/categories';
import { LanguageProvider } from './localization/LanguageContext';
import { CategoryPlaceholderPage } from './pages/CategoryPlaceholderPage';
import { DashboardPage } from './pages/DashboardPage';
import { FamilyMemberProfilePage } from './pages/FamilyMemberProfilePage';
import { FamilyPage } from './pages/FamilyPage';
import { SettingsPage } from './pages/SettingsPage';
import { TrashPage } from './pages/TrashPage';

const PLACEHOLDER_CATEGORIES = CATEGORIES.filter((category) => category.id !== 'family');

export default function App() {
  return (
    <LanguageProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="family" element={<FamilyPage />} />
            <Route path="family/:memberId" element={<FamilyMemberProfilePage />} />
            {PLACEHOLDER_CATEGORIES.map((category) => (
              <Route
                key={category.id}
                path={category.path.slice(1)}
                element={<CategoryPlaceholderPage category={category} />}
              />
            ))}
            <Route path="settings" element={<SettingsPage />} />
            <Route path="trash" element={<TrashPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </LanguageProvider>
  );
}
