import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineHome, HiOutlineBuildingOffice2, HiOutlineShieldCheck, HiOutlineUsers, HiOutlineBriefcase, HiOutlineUserGroup, HiOutlineChartBarSquare, HiOutlineClipboardDocumentCheck, HiOutlineComputerDesktop, HiOutlineDocumentText, HiOutlineCog6Tooth } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import AdminSidebar from '../../components/AdminSidebar';
import Dashboard from './Dashboard';
import Tenants from './Tenants';
import Roles from './Roles';
import ManagedUsers from './ManagedUsers';
import AdminTenantsList from './AdminTenantsList';
import FreelancersList from './FreelancersList';
import Reports from './Reports';
import KycReview from './KycReview';
import Settings from './Settings';
import SessionLogs from './SessionLogs';
import ContractsPanel from './ContractsPanel';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: HiOutlineHome,
  tenants: HiOutlineBuildingOffice2,
  roles: HiOutlineShieldCheck,
  users: HiOutlineUsers,
  'admin-tenants': HiOutlineBriefcase,
  freelancers: HiOutlineUserGroup,
  reports: HiOutlineChartBarSquare,
  kyc: HiOutlineClipboardDocumentCheck,
  'session-logs': HiOutlineComputerDesktop,
  'contracts': HiOutlineDocumentText,
  settings: HiOutlineCog6Tooth,
};

export default function SuperAdminPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get('tab') || 'dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modules, setModules] = useState<{ key: string; label: string }[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    api.get('/modules').then((r) => setModules(r.data));
  }, []);

  const sidebarModules = modules.map((m) => ({
    key: m.key,
    label: t(`modules.${m.key}`, m.label),
    icon: iconMap[m.key] || HiOutlineHome,
  }));

  const setActive = (key: string) => setSearchParams({ tab: key });

  const renderModule = () => {
    switch (active) {
      case 'dashboard': return <Dashboard />;
      case 'tenants': return <Tenants />;
      case 'roles': return <Roles />;
      case 'users': return <ManagedUsers />;
      case 'admin-tenants': return <AdminTenantsList />;
      case 'freelancers': return <FreelancersList />;
      case 'reports': return <Reports />;
      case 'kyc': return <KycReview />;
      case 'session-logs': return <SessionLogs />;
      case 'contracts': return <ContractsPanel />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div>
      <AdminSidebar modules={sidebarModules} active={active} onSelect={setActive} open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        {renderModule()}
      </div>
    </div>
  );
}
