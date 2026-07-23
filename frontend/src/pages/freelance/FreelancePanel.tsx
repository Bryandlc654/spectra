import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineHome, HiOutlineDocumentText } from 'react-icons/hi2';
import AdminSidebar from '../../components/AdminSidebar';
import { downloadPdf } from '../../utils/pdf';
import { freelanceService, contractService } from '../../services/api';
import type { FreelanceProfile, Contract } from '../../types';

function FreelanceDashboard() {
  const [profile, setProfile] = useState<FreelanceProfile | null>(null);
  useEffect(() => { freelanceService.profile().then(setProfile); }, []);
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
  const [contracts, setContracts] = useState<Contract[]>([]);
  useEffect(() => { contractService.list().then(setContracts); }, []);
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
                <button onClick={() => downloadPdf(`/contracts/${c.id}/pdf`, `contrato-${c.id}.pdf`)}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get('tab') || 'dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const setActive = (key: string) => setSearchParams({ tab: key });

  const renderModule = () => {
    switch (active) {
      case 'dashboard': return <FreelanceDashboard />;
      case 'contracts': return <MyContracts />;
      default: return <FreelanceDashboard />;
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
