import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import DashboardRouter from './components/DashboardRouter';

const Login = React.lazy(() => import('./components/Login'));
const Register = React.lazy(() => import('./components/Register'));
const SignPage = React.lazy(() => import('./components/SignPage'));
const ForgotPassword = React.lazy(() => import('./components/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./components/ResetPassword'));
const AcceptInvitation = React.lazy(() => import('./pages/AcceptInvitation'));

function Suspense({ children }: { children: React.ReactNode }) {
  return <React.Suspense fallback={<div className="flex items-center justify-center h-screen text-primary-500">Cargando...</div>}>{children}</React.Suspense>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', padding: '14px 16px', fontSize: '14px' } }} />
          <Routes>
            <Route path="/login" element={<Suspense><Login /></Suspense>} />
            <Route path="/register" element={<Suspense><Register /></Suspense>} />
            <Route path="/forgot-password" element={<Suspense><ForgotPassword /></Suspense>} />
            <Route path="/reset-password" element={<Suspense><ResetPassword /></Suspense>} />
            <Route path="/accept-invitation/:token" element={<Suspense><AcceptInvitation /></Suspense>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardRouter />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
            <Route path="/sign/:token" element={<Suspense><SignPage /></Suspense>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
