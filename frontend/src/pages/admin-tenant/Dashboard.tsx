import { useState, useEffect } from 'react';
import { HiOutlineUserGroup, HiOutlineDocumentText, HiOutlineShieldCheck } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';

interface DashboardData {
  stats: {
    freelancers: number;
    contracts: number;
    pendingKyc: number;
    draft: number;
    signed: number;
    sent: number;
    cancelled: number;
  };
  recentFreelancers: { id: number; name: string; email: string; createdAt: string; area?: { name: string } }[];
  recentContracts: { id: number; title: string; status: string; freelancerName?: string; amount?: number; createdAt: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#eab308',
  sent: '#3b82f6',
  signed: '#10b981',
  cancelled: '#ef4444',
};

export default function AdminTenantDashboard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    api.get('/admin-tenant/dashboard').then((res) => setData(res.data)).catch(() => setError(t('error.loading')));
  }, []);

  if (error) return (
    <div className="text-center py-12">
      <div className="bg-red-50 text-red-600 p-4 rounded-xl inline-flex items-center gap-2 text-sm border border-red-100">
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {error}
      </div>
      <button onClick={() => { setError(''); api.get('/admin-tenant/dashboard').then((res) => setData(res.data)).catch(() => setError(t('error.loading'))); }}
        className="block mx-auto mt-4 text-sm text-primary-500 hover:text-primary-700 font-medium">
        {t('actions.retry') || 'Reintentar'}
      </button>
    </div>
  );

  if (!data) return <div className="text-primary-500 py-12 text-center">{t('loading')}</div>;

  const pieData = [
    { name: t('dashboard.drafts'), value: data.stats.draft },
    { name: t('dashboard.sent'), value: data.stats.sent },
    { name: t('dashboard.signed'), value: data.stats.signed },
    { name: t('dashboard.cancelled'), value: data.stats.cancelled },
  ].filter((d) => d.value > 0);

  const pieColors = [STATUS_COLORS.draft, STATUS_COLORS.sent, STATUS_COLORS.signed, STATUS_COLORS.cancelled];

  const barData = data.recentContracts.slice(0, 6).map((c) => ({
    name: c.title.length > 14 ? c.title.substring(0, 14) + '...' : c.title,
    amount: c.amount ? Number(c.amount) : 0,
  }));

  const statusBadge = (s: string) => {
    if (s === 'signed') return 'bg-green-100 text-green-700';
    if (s === 'sent') return 'bg-blue-100 text-blue-700';
    if (s === 'cancelled') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">{t('dashboard.title')}</h1>
      <p className="text-gray-500 mb-6">{t('dashboard.summary')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <HiOutlineUserGroup className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('dashboard.freelancers')}</p>
            <p className="text-3xl font-bold text-gray-800">{data.stats.freelancers}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
            <HiOutlineDocumentText className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('dashboard.contracts')}</p>
            <p className="text-3xl font-bold text-gray-800">{data.stats.contracts}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0">
            <HiOutlineShieldCheck className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('dashboard.pendingKyc')}</p>
            <p className="text-3xl font-bold text-gray-800">{data.stats.pendingKyc}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { key: 'drafts', count: data.stats.draft, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
          { key: 'sent', count: data.stats.sent, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { key: 'signed', count: data.stats.signed, color: 'bg-green-50 text-green-700 border-green-200' },
          { key: 'cancelled', count: data.stats.cancelled, color: 'bg-red-50 text-red-700 border-red-200' },
        ].map((item) => (
          <div key={item.key} className={`rounded-xl p-4 border ${item.color} flex flex-col items-center`}>
            <span className="text-2xl font-bold">{item.count}</span>
            <span className="text-xs font-medium mt-1">{t(`dashboard.${item.key}`)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('dashboard.contractStatus')}</h2>
          {pieData.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">{t('dashboard.noContracts')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('dashboard.recentContracts')}</h2>
          {barData.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">{t('dashboard.noContracts')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                <Bar dataKey="amount" fill="#006d70" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{t('dashboard.recentFreelancers')}</h2>
            {onNavigate && <button onClick={() => onNavigate('freelancers')} className="text-xs text-primary-500 hover:text-primary-700 font-medium">{t('dashboard.viewAll')}</button>}
          </div>
          {data.recentFreelancers.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">{t('dashboard.noFreelancers')}</p>
          ) : (
            <div className="space-y-3">
              {data.recentFreelancers.map((f) => (
                <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{f.name}</div>
                    <div className="text-xs text-gray-500">{f.email}</div>
                  </div>
                  {f.area && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">{f.area.name}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{t('dashboard.recentContracts')}</h2>
            {onNavigate && <button onClick={() => onNavigate('contracts')} className="text-xs text-primary-500 hover:text-primary-700 font-medium">{t('dashboard.viewAll')}</button>}
          </div>
          {data.recentContracts.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">{t('dashboard.noContracts')}</p>
          ) : (
            <div className="space-y-3">
              {data.recentContracts.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-800 text-sm truncate">{c.title}</div>
                    <div className="text-xs text-gray-500">{c.freelancerName || t('dashboard.freelancers')}{c.amount ? ` · $${Number(c.amount).toFixed(2)}` : ''}</div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-3 ${statusBadge(c.status)}`}>{t(`status.${c.status}`)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
