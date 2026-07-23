import { useAuth } from '../context/AuthContext';
import SuperAdminPanel from '../pages/super-admin/SuperAdminPanel';
import AdminTenantPanel from '../pages/admin-tenant/AdminTenantPanel';
import FreelancePanel from '../pages/freelance/FreelancePanel';

export default function DashboardRouter() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'super_admin':
      return <SuperAdminPanel />;
    case 'admin_tenant':
      return <AdminTenantPanel />;
    case 'freelance':
      return <FreelancePanel />;
    default:
      return <div className="text-gray-500">Rol no reconocido</div>;
  }
}
