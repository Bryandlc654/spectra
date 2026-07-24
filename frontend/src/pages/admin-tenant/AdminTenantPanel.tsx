import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineHome, HiOutlineDocumentText, HiOutlineUserGroup, HiOutlineShieldCheck, HiOutlineUser } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import AdminSidebar from '../../components/AdminSidebar';
import AdminTenantDashboard from './Dashboard';
import AdminTenantFreelancers from './FreelancersList';
import AdminTenantContracts from './ContractsPage';
import KycUpload from './KycUpload';
import ProfilePage from './ProfilePage';

export default function AdminTenantPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get('tab') || 'dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { t } = useTranslation();

  const modules = [
    { key: 'dashboard', label: t('modules.dashboard'), icon: HiOutlineHome },
    { key: 'freelancers', label: t('modules.freelancers'), icon: HiOutlineUserGroup },
    { key: 'contracts', label: t('modules.contracts'), icon: HiOutlineDocumentText },
    { key: 'kyb', label: 'KYB', icon: HiOutlineShieldCheck },
    { key: 'profile', label: t('modules.profile') || 'Mi Perfil', icon: HiOutlineUser },
  ];

  const setActive = (key: string) => setSearchParams({ tab: key });

  const renderModule = () => {
    switch (active) {
      case 'dashboard': return <AdminTenantDashboard onNavigate={setActive} />;
      case 'freelancers': return <AdminTenantFreelancers />;
      case 'contracts': return <AdminTenantContracts />;
      case 'kyb': return <KycUpload />;
      case 'profile': return <ProfilePage />;
      default: return <AdminTenantDashboard onNavigate={setActive} />;
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
