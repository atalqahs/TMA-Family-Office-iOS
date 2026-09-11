import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { DbLifecycleNotice } from './components/DbLifecycleNotice';
import { CATEGORIES } from './features/categories/categories';
import { LanguageProvider } from './localization/LanguageContext';
import { ArchiveCategoryPage } from './pages/ArchiveCategoryPage';
import { ArchivePage } from './pages/ArchivePage';
import { CategoryPlaceholderPage } from './pages/CategoryPlaceholderPage';
import { ContractProfilePage } from './pages/ContractProfilePage';
import { ContractsPage } from './pages/ContractsPage';
import { DashboardPage } from './pages/DashboardPage';
import { FamilyMemberProfilePage } from './pages/FamilyMemberProfilePage';
import { FamilyPage } from './pages/FamilyPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { PropertyProfilePage } from './pages/PropertyProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { StaffPage } from './pages/StaffPage';
import { StaffProfilePage } from './pages/StaffProfilePage';
import { TaskCalendarPage } from './pages/TaskCalendarPage';
import { TaskGroupDetailPage } from './pages/TaskGroupDetailPage';
import { TaskProfilePage } from './pages/TaskProfilePage';
import { TasksPage } from './pages/TasksPage';
import { TrashPage } from './pages/TrashPage';
import { VehicleProfilePage } from './pages/VehicleProfilePage';
import { VehiclesPage } from './pages/VehiclesPage';

const PLACEHOLDER_CATEGORIES = CATEGORIES.filter(
  (category) =>
    category.id !== 'family' &&
    category.id !== 'properties' &&
    category.id !== 'vehicles' &&
    category.id !== 'staff' &&
    category.id !== 'contracts' &&
    category.id !== 'tasks' &&
    category.id !== 'notifications' &&
    category.id !== 'archive',
);

export default function App() {
  return (
    <>
      {/*
        Sibling of LanguageProvider, not a child: LanguageProvider renders
        null until the persisted locale finishes loading from IndexedDB,
        which can never happen while the database is genuinely blocked —
        so this notice must live outside that gate to have any chance of
        being shown during exactly the scenario it exists for.
      */}
      <DbLifecycleNotice />
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
              <Route path="contracts" element={<ContractsPage />} />
              <Route path="contracts/:contractId" element={<ContractProfilePage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="tasks/calendar" element={<TaskCalendarPage />} />
              <Route path="tasks/group/:groupId" element={<TaskGroupDetailPage />} />
              <Route path="tasks/task/:taskId" element={<TaskProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="archive" element={<ArchivePage />} />
              <Route path="archive/:categoryId" element={<ArchiveCategoryPage />} />
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
    </>
  );
}
