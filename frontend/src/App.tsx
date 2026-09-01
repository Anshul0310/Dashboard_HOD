import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/store';
import { AppLayout } from './components/layout/AppLayout';
import { RoleGate } from './components/layout/RoleGate';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { KpiEntryPage } from './pages/KpiEntryPage';
import { FacultyKpiEntryPage } from './pages/FacultyKpiEntryPage';
import { HodReviewPage } from './pages/HodReviewPage';
import { FacultyPage } from './pages/FacultyPage';
import { PublicationsPage } from './pages/PublicationsPage';
import { PlacementsPage } from './pages/PlacementsPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CollegeDashboardPage } from './pages/CollegeDashboardPage';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((s) => s.role);
  if (!role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public: Login / Role Selection */}
        <Route path="/" element={<LoginPage />} />

        {/* Protected: Authenticated layout */}
        <Route
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route path="/overview" element={<OverviewPage />} />
          <Route
            path="/college-dashboard"
            element={
              <RoleGate allowedRoles={['college_admin', 'management']}>
                <CollegeDashboardPage />
              </RoleGate>
            }
          />
          <Route
            path="/my-kpi"
            element={
              <RoleGate allowedRoles={['faculty']}>
                <FacultyKpiEntryPage />
              </RoleGate>
            }
          />
          <Route
            path="/kpi-entry"
            element={
              <RoleGate allowedRoles={['hod']}>
                <KpiEntryPage />
              </RoleGate>
            }
          />
          <Route
            path="/review"
            element={
              <RoleGate allowedRoles={['hod']}>
                <HodReviewPage />
              </RoleGate>
            }
          />
          <Route path="/faculty" element={<FacultyPage />} />
          <Route path="/publications" element={<PublicationsPage />} />
          <Route path="/placements" element={<PlacementsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
