import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './modules/auth/components/AuthGuard';
import AppLayout from './shared/components/AppLayout';
import ChatWidget from './modules/chatbot/components/ChatWidget';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { ROUTES } from './shared/constants/routes';

const DashboardPage = lazy(() => import('./modules/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const PatientsPage = lazy(() => import('./modules/patients/pages/PatientsPage').then(m => ({ default: m.PatientsPage })));
const PatientDetailsPage = lazy(() => import('./modules/patients/pages/PatientDetailsPage').then(m => ({ default: m.PatientDetailsPage })));
const AnalyticsPage = lazy(() => import('./modules/analytics/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const SecondBrainPage = lazy(() => import('./modules/second-brain/pages/SecondBrainPage').then(m => ({ default: m.SecondBrainPage })));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <AppLayout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                    <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                    <Route path={ROUTES.PATIENTS} element={<PatientsPage />} />
                    <Route path="/patients/:id" element={<PatientDetailsPage />} />
                    <Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />
                    <Route path={ROUTES.SECOND_BRAIN} element={<SecondBrainPage />} />
                    <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                  </Routes>
                </Suspense>
              </AppLayout>
            </AuthGuard>
          }
        />
      </Routes>
      <ChatWidget />
    </>
  );
}

export default App;
