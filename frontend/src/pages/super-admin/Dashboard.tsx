import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';

interface DashboardData {
  stats: { totalUsers: number; admins: number; freelancers: number };
  recentUsers: { id: number; name: string; email: string; role: string; createdAt: string }[];
}

const COLORS = ['#7c3aed', '#3b82f6', '#10b981'];

const roleLabelMap: Record<string, string> = {
  super_admin: 'roles.super_admin',
  admin_tenant: 'roles.admin_tenant',
  freelance: 'roles.freelance',
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    api.get('/super-admin/dashboard').then((res) => setData(res.data));
  }, []);

  if (!data) return <div className="text-primary-500">{t('loadingDashboard')}</div>;

  const cards = [
    { label: t('dashboard.totalUsers'), value: data.stats.totalUsers, color: 'bg-primary-500' },
    { label: t('dashboard.adminTenants'), value: data.stats.admins, color: 'bg-blue-500' },
    { label: t('dashboard.freelancers'), value: data.stats.freelancers, color: 'bg-green-500' },
  ];

  const pieData = [
    { name: t('roles.admin_tenant'), value: data.stats.admins },
    { name: t('roles.freelance'), value: data.stats.freelancers },
  ];

  const barData = data.recentUsers.slice(0, 8).map((u) => ({
    name: u.name.split(' ')[0],
    [t('roles.admin_tenant')]: u.role === 'admin_tenant' ? 1 : 0,
    [t('roles.freelance')]: u.role === 'freelance' ? 1 : 0,
    [t('roles.super_admin')]: u.role === 'super_admin' ? 1 : 0,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className={`w-3 h-3 rounded-full ${c.color} mb-2`}></div>
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-3xl font-bold text-gray-800">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('dashboard.roleDistribution')}</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('dashboard.userOverview')}</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey={t('roles.admin_tenant')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey={t('roles.freelance')} fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey={t('roles.super_admin')} fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('dashboard.recentUsers')}</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">{t('dashboard.name')}</th>
              <th className="pb-2">{t('dashboard.email')}</th>
              <th className="pb-2">{t('dashboard.role')}</th>
              <th className="pb-2">{t('dashboard.date')}</th>
            </tr>
          </thead>
          <tbody>
            {data.recentUsers.map((u) => (
              <tr key={u.id} className="border-b border-gray-50">
                <td className="py-2 text-gray-800">{u.name}</td>
                <td className="py-2 text-gray-600">{u.email}</td>
                <td className="py-2">
                  <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-xs">{t(roleLabelMap[u.role] || u.role)}</span>
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
