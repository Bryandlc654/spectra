import { useState, useEffect } from 'react';
import api from '../../api/axios';

interface DashboardData {
  stats: { totalUsers: number; admins: number; freelancers: number };
  recentUsers: { id: number; name: string; email: string; role: string; createdAt: string }[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get('/super-admin/dashboard').then((res) => setData(res.data));
  }, []);

  if (!data) return <div className="text-primary-500">Cargando dashboard...</div>;

  const cards = [
    { label: 'Usuarios totales', value: data.stats.totalUsers, color: 'bg-primary-500' },
    { label: 'Admin Tenants', value: data.stats.admins, color: 'bg-blue-500' },
    { label: 'Freelancers', value: data.stats.freelancers, color: 'bg-green-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className={`w-3 h-3 rounded-full ${c.color} mb-2`}></div>
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-3xl font-bold text-gray-800">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Usuarios recientes</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Nombre</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Rol</th>
              <th className="pb-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {data.recentUsers.map((u) => (
              <tr key={u.id} className="border-b border-gray-50">
                <td className="py-2 text-gray-800">{u.name}</td>
                <td className="py-2 text-gray-600">{u.email}</td>
                <td className="py-2">
                  <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-xs">{u.role}</span>
                </td>
                <td className="py-2 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
