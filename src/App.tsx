import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { CATEGORIES } from './features/categories/categories';
import { LanguageProvider } from './localization/LanguageContext';
import { CategoryPlaceholderPage } from './pages/CategoryPlaceholderPage';
import { DashboardPage } from './pages/DashboardPage';
import { FamilyMemberProfilePage } from './pages/FamilyMemberProfilePage';
import { FamilyPage } from './pages/FamilyPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { PropertyProfilePage } from './pages/PropertyProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { StaffPage } from './pages/StaffPage';
import { StaffProfilePage } from './pages/StaffProfilePage';
import { TrashPage } from './pages/TrashPage';
import { VehicleProfilePage } from './pages/VehicleProfilePage';
import { VehiclesPage } from './pages/VehiclesPage';

const PLACEHOLDER_CATEGORIES = CATEGORIES.filter(
  (category) =>
    category.id !== 'family' &&
    category.id !== 'properties' &&
    category.id !== 'vehicles' &&
    category.id !== 'staff',
);

export default function App() {
  return (
    <LanguageProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="family" element={<FamilyPage />} />
            <Route path="family/:memberId" element={<FamilyMemberProfilePage />} />
            <Route path="properties" element={<PropertiesPage />} />
            <Route path="properties/:propertyId" element={<PropertyProfilePage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="vehicles/:vehicleId" element={<VehicleProfilePage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="staff/:staffId" element={<StaffProfilePage />} />
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
