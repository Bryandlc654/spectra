import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineHome, HiOutlineDocumentText, HiOutlineUserGroup } from 'react-icons/hi2';
import AdminSidebar from '../../components/AdminSidebar';
import AdminTenantDashboard from './Dashboard';
import ContractsPanel from '../super-admin/ContractsPanel';

const modules = [
  { key: 'dashboard', label: 'Dashboard', icon: HiOutlineHome },
  { key: 'contracts', label: 'Contratos', icon: HiOutlineDocumentText },
  { key: 'freelancers', label: 'Freelancers', icon: HiOutlineUserGroup },
];

export default function AdminTenantPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get('tab') || 'dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const setActive = (key: string) => setSearchParams({ tab: key });

  const renderModule = () => {
    switch (active) {
      case 'dashboard': return <AdminTenantDashboard />;
      case 'contracts': return <ContractsPanel />;
      case 'freelancers': return <div className="text-gray-500 py-12 text-center">Gestión de freelancers (próximamente)</div>;
      default: return <AdminTenantDashboard />;
    }
  };

  return (
    <div>
      <AdminSidebar modules={modules} active={active} onSelect={setActive} open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className={`flex-1 transition-all duration-300 p-4 sm:p-6 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        {renderModule()}
      </main>
    </div>
  );
}
