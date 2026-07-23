import { useState, useEffect } from 'react';
import { HiOutlineHome, HiOutlineDocumentText, HiOutlineChevronDoubleLeft, HiOutlineChevronDoubleRight } from 'react-icons/hi2';
import api from '../../api/axios';

function FreelanceDashboard() {
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => { api.get('/freelance/profile').then((r) => setProfile(r.data.profile)); }, []);
  if (!profile) return <div className="text-primary-500">Cargando...</div>;
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-lg">
        <div className="space-y-3">
          {profile.code && <div><span className="text-sm text-gray-500">Código</span><p className="text-primary-600 font-mono font-bold">{profile.code}</p></div>}
          <div><span className="text-sm text-gray-500">Nombre</span><p className="text-gray-800 font-medium">{profile.name}</p></div>
          <div><span className="text-sm text-gray-500">Email</span><p className="text-gray-800">{profile.email}</p></div>
          <div><span className="text-sm text-gray-500">Teléfono</span><p className="text-gray-800">{profile.phone || '—'}</p></div>
          <div><span className="text-sm text-gray-500">Rol</span><p className="text-primary-700 font-medium">Freelance</p></div>
          <div><span className="text-sm text-gray-500">Miembro desde</span><p className="text-gray-800">{new Date(profile.createdAt).toLocaleDateString()}</p></div>
        </div>
      </div>
    </div>
  );
}

function MyContracts() {
  const [contracts, setContracts] = useState<any[]>([]);
  useEffect(() => { api.get('/contracts').then((r) => setContracts(r.data)); }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Mis Contratos</h1>
      {contracts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No tienes contratos asignados</div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{c.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{c.tenantName} · {new Date(c.createdAt).toLocaleDateString('es')}</p>
                </div>
                <button onClick={async () => { try { const r = await api.get(`/contracts/${c.id}/pdf`, { responseType: 'blob' }); const url = URL.createObjectURL(r.data); const a = document.createElement('a'); a.href = url; a.download = `contrato-${c.id}.pdf`; a.click(); URL.revokeObjectURL(url); } catch {} }}
                  className="px-4 py-2 bg-primary-500 text-white rounded-xl text-xs font-medium hover:bg-primary-600 transition shadow-md">
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const modules = [
  { key: 'dashboard', label: 'Mi Perfil', icon: HiOutlineHome },
  { key: 'contracts', label: 'Mis Contratos', icon: HiOutlineDocumentText },
];

export default function FreelancePanel() {
  const [active, setActive] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderModule = () => {
    switch (active) {
      case 'dashboard': return <FreelanceDashboard />;
      case 'contracts': return <MyContracts />;
      default: return <FreelanceDashboard />;
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
