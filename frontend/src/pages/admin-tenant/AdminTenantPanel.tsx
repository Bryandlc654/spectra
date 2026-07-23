import { useState } from 'react';
import { HiOutlineHome, HiOutlineDocumentText, HiOutlineUserGroup, HiOutlineChevronDoubleLeft, HiOutlineChevronDoubleRight } from 'react-icons/hi2';
import AdminTenantDashboard from './Dashboard';
import ContractsPanel from '../super-admin/ContractsPanel';

const modules = [
  { key: 'dashboard', label: 'Dashboard', icon: HiOutlineHome },
  { key: 'contracts', label: 'Contratos', icon: HiOutlineDocumentText },
  { key: 'freelancers', label: 'Freelancers', icon: HiOutlineUserGroup },
];

export default function AdminTenantPanel() {
  const [active, setActive] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

      <div className="flex">
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
              const Icon = m.icon;
              const isActive = active === m.key;
              return (
                <button key={m.key} onClick={() => setActive(m.key)}
                  className={`relative w-full flex items-center gap-3 text-sm font-medium transition-all duration-200 whitespace-nowrap
                    ${sidebarOpen ? 'px-3 py-2.5 rounded-xl' : 'justify-center py-3 rounded-xl'}
                    ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
                  {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-500 rounded-full"></span>}
                  <Icon className="w-5 h-5 shrink-0" />
                  {sidebarOpen && <span className="truncate">{m.label}</span>}
                </button>
              );
            })}
          </nav>
        </aside>
        <main className={`flex-1 transition-all duration-300 p-4 sm:p-6 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
          {renderModule()}
        </main>
      </div>
    </div>
  );
}
