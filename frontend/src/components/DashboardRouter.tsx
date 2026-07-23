import React from 'react';
import { useAuth } from '../context/AuthContext';

const SuperAdminPanel = React.lazy(() => import('../pages/super-admin/SuperAdminPanel'));
const AdminTenantPanel = React.lazy(() => import('../pages/admin-tenant/AdminTenantPanel'));
const FreelancePanel = React.lazy(() => import('../pages/freelance/FreelancePanel'));

export default function DashboardRouter() {
  const { user } = useAuth();

  return (
    <React.Suspense fallback={<div className="flex items-center justify-center h-64 text-primary-500">Cargando...</div>}>
      {user?.role === 'super_admin' && <SuperAdminPanel />}
      {user?.role === 'admin_tenant' && <AdminTenantPanel />}
      {user?.role === 'freelance' && <FreelancePanel />}
      {!['super_admin', 'admin_tenant', 'freelance'].includes(user?.role || '') && (
        <div className="text-gray-500">Rol no reconocido</div>
      )}
    </React.Suspense>
  );
}
