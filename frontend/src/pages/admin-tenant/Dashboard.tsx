import { useState, useEffect } from 'react';
import { HiOutlineDocumentText } from 'react-icons/hi2';
import api from '../../api/axios';
import ContractsPanel from '../super-admin/ContractsPanel';

interface DashboardData {
  admin: { name: string; email: string };
  stats: { freelancers: number };
  recentFreelancers: { id: number; name: string; email: string; createdAt: string }[];
}

export default function AdminTenantDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    api.get('/admin-tenant/dashboard').then((res) => setData(res.data));
  }, []);

  if (!data) return <div className="text-primary-500">Cargando...</div>;

  if (tab === 'contracts') return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setTab('dashboard')}
          className="text-sm text-gray-500 hover:text-primary-500 transition flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver al panel
        </button>
      </div>
      <ContractsPanel />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Panel Admin Tenant</h1>
      <p className="text-gray-500 mb-6">Bienvenido, {data.admin.name}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="w-3 h-3 rounded-full bg-green-500 mb-2"></div>
          <p className="text-sm text-gray-500">Freelancers</p>
          <p className="text-3xl font-bold text-gray-800">{data.stats.freelancers}</p>
        </div>
        <button onClick={() => setTab('contracts')}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-left hover:border-primary-200 transition group">
          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center mb-2 group-hover:bg-primary-200 transition">
            <HiOutlineDocumentText className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-sm text-gray-500">Contratos</p>
          <p className="text-lg font-bold text-gray-800">Gestionar contratos</p>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Freelancers recientes</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Nombre</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Registro</th>
            </tr>
          </thead>
          <tbody>
            {data.recentFreelancers.map((u) => (
              <tr key={u.id} className="border-b border-gray-50">
                <td className="py-2 text-gray-800">{u.name}</td>
                <td className="py-2 text-gray-600">{u.email}</td>
                <td className="py-2 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
