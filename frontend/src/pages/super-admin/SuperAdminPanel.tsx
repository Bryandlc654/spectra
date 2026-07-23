import React, { useState, useEffect } from 'react';
import { HiOutlineHome, HiOutlineBuildingOffice2, HiOutlineShieldCheck, HiOutlineUsers, HiOutlineBriefcase, HiOutlineUserGroup, HiOutlineChartBarSquare, HiOutlineClipboardDocumentCheck, HiOutlineComputerDesktop, HiOutlineDocumentText, HiOutlineCog6Tooth, HiOutlineChevronDoubleLeft, HiOutlineChevronDoubleRight } from 'react-icons/hi2';
import api from '../../api/axios';
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
  const [active, setActive] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const [modules, setModules] = useState<{ key: string; label: string }[]>([]);

  useEffect(() => {
    api.get('/modules').then((r) => setModules(r.data));
  }, []);

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
      <aside className={`fixed left-0 top-16 bottom-0 z-40 bg-white shadow-sm transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        <div className={`flex items-center h-14 px-3 border-b border-gray-100 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {sidebarOpen && <div></div>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition">
            {sidebarOpen ? <HiOutlineChevronDoubleLeft className="w-3.5 h-3.5" /> : <HiOutlineChevronDoubleRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {modules.map((m) => {
            const isActive = active === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setActive(m.key)}
                onMouseEnter={() => setHovered(m.key)}
                onMouseLeave={() => setHovered(null)}
                title={!sidebarOpen ? m.label : undefined}
                className={`relative w-full flex items-center gap-3 text-sm font-medium transition-all duration-200 whitespace-nowrap group
                  ${sidebarOpen ? 'px-3 py-2.5 rounded-xl' : 'justify-center py-3 rounded-xl'}
                  ${isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-500 rounded-full"></span>
                )}
                <span className={`relative flex items-center justify-center w-5 h-5 shrink-0 transition-transform duration-200 ${hovered === m.key ? 'scale-110' : ''}`}>
                  {iconMap[m.key] ? React.createElement(iconMap[m.key], { className: 'w-5 h-5' }) : <HiOutlineHome className="w-5 h-5" />}
                </span>
                {sidebarOpen && <span className="truncate">{m.label}</span>}
                {!sidebarOpen && isActive && (
                  <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                )}
              </button>
            );
          })}
        </nav>

      </aside>
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        {renderModule()}
      </div>
    </div>
  );
}
