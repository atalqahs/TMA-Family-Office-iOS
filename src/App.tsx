import { HashRouter, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { LanguageProvider } from './localization/LanguageContext';
import { DashboardPage } from './pages/DashboardPage';

export default function App() {
  return (
    <LanguageProvider>
      <HashRouter>
        <Header />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
        </Routes>
      </HashRouter>
    </LanguageProvider>
  );
}
