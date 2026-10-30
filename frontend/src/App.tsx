import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlarmProvider } from './context/AlarmContext';

import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { AlarmBanner } from './components/AlarmBanner';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ImageDetectionPage } from './pages/ImageDetectionPage';
import { DetectionHistoryPage } from './pages/DetectionHistoryPage';
import { DetectionDetailPage } from './pages/DetectionDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { ModelInfoPage } from './pages/ModelInfoPage';
import { DatasetTrainingPage } from './pages/DatasetTrainingPage';
import { SettingsPage } from './pages/SettingsPage';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-mono text-sm">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main App Layout Structure
const AppLayout: React.FC = () => {
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/': return 'Dashboard Overview';
      case '/detect': return 'Image Upload & Hazard Detection';
      case '/history': return 'Detection History';
      case '/model-info': return 'ML Model Information';
      case '/dataset-training': return 'Dataset & Training Control';
      case '/profile': return 'User Profile';
      case '/settings': return 'System Settings';
      default:
        if (pathname.startsWith('/history/')) return 'Detection Record Details';
        return 'Safety Console';
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DisclaimerBanner />
        <AlarmBanner />
        <Navbar title={getPageTitle(location.pathname)} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/detect" element={<ImageDetectionPage />} />
            <Route path="/history" element={<DetectionHistoryPage />} />
            <Route path="/history/:id" element={<DetectionDetailPage />} />
            <Route path="/model-info" element={<ModelInfoPage />} />
            <Route path="/dataset-training" element={<DatasetTrainingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AlarmProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AlarmProvider>
    </AuthProvider>
  );
};

export default App;
