import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { APIProvider } from '@vis.gl/react-google-maps';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages - Lazy Loaded for bundle optimization
const Home = lazy(() => import('./pages/Home'));
const RideResults = lazy(() => import('./pages/RideResults'));
const Profile = lazy(() => import('./pages/Profile'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Settings = lazy(() => import('./pages/Settings'));
const UserHistory = lazy(() => import('./pages/UserHistory'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Languages = lazy(() => import('./pages/Languages'));
const Cities = lazy(() => import('./pages/Cities'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Version = lazy(() => import('./pages/Version'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Ads = lazy(() => import('./pages/Ads'));
const CreateAd = lazy(() => import('./pages/CreateAd'));
const EditAd = lazy(() => import('./pages/EditAd'));

const GOOGLE_MAPS_API_KEY = 
  process.env.GOOGLE_MAPS_PLATFORM_KEY || 
  'AIzaSyCT4_-3Hr6FRrKWKSw2DO_dsss0-a_fswQ';

const hasValidKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY.startsWith('AIza');

// Config React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  React.useEffect(() => {
    (window as any).gm_authFailure = () => {
      (window as any).gm_authFailed = true;
      console.warn("Google Maps auth failure detected. ApiTargetBlockedMapError might be active.");
      window.dispatchEvent(new CustomEvent('google-maps-auth-failure'));
    };
  }, []);

  if (!hasValidKey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
            <span className="text-3xl font-black">!</span>
          </div>
          <h2 className="text-2xl font-black font-display text-gray-900">Configuração Necessária</h2>
          <p className="text-gray-500 font-medium">A chave da API do Google Maps é necessária para calcular rotas e mostrar o mapa.</p>
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/50 text-left space-y-4">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Passos para configurar:</p>
            <ol className="text-sm font-medium text-gray-700 space-y-3 list-decimal list-inside">
              <li>Abre as <strong>Definições</strong> (ícone da engrenagem)</li>
              <li>Vai a <strong>Secrets</strong></li>
              <li>Adiciona <code>GOOGLE_MAPS_PLATFORM_KEY</code></li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
          <AuthProvider>
            <ThemeProvider>
              <Router>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route element={<MainLayout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/rides" element={<RideResults />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/history" element={<UserHistory />} />
                      <Route path="/statistics" element={<Statistics />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/edit-profile" element={<EditProfile />} />
                      <Route path="/languages" element={<Languages />} />
                      <Route path="/cities" element={<Cities />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/version" element={<Version />} />
                      <Route path="/ads" element={<Ads />} />
                    </Route>
                    
                    {/* Admin Dashboard */}
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/create-ad" element={<CreateAd />} />
                    <Route path="/edit-ad/:id" element={<EditAd />} />
                    
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </Router>
            </ThemeProvider>
          </AuthProvider>
        </APIProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export default App;

