import { useState, useEffect } from 'react';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineComputerDesktop, HiOutlineClock } from 'react-icons/hi2';
import api from '../../api/axios';

interface SessionLog {
  id: number; userId: number; userName?: string; userRole?: string;
  ipAddress?: string; userAgent?: string; createdAt: string;
}

export default function SessionLogs() {
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(false);

  const load = async () => {
    setFetching(true);
    try {
      const { data } = await api.get(`/session-logs?page=${page}&limit=50`);
      setLogs(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {} finally { setFetching(false); }
  };

  useEffect(() => { load(); }, [page]);

  const parseUserAgent = (ua?: string) => {
    if (!ua) return '—';
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Postman')) return 'Postman';
    return ua.substring(0, 40) + '...';
  };

  const roleBadge = (role?: string) => {
    if (role === 'super_admin') return 'bg-purple-100 text-purple-700';
    if (role === 'admin_tenant') return 'bg-blue-100 text-blue-700';
    if (role === 'freelance') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-600';
  };

  const roleLabel = (role?: string) => {
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'admin_tenant') return 'Admin Tenant';
    if (role === 'freelance') return 'Freelance';
    return role || '—';
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <HiOutlineComputerDesktop className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de sesiones</h1>
          <p className="text-sm text-gray-500">Todos los inicios de sesión de los usuarios</p>
        </div>
      </div>

      {fetching ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Cargando...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Navegador</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">{(page - 1) * 50 + i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{log.userName || `ID ${log.userId}`}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadge(log.userRole)}`}>
                      {roleLabel(log.userRole)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{log.ipAddress || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{parseUserAgent(log.userAgent)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('es', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  <HiOutlineClock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No hay sesiones registradas
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-40">
            <HiOutlineChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <span className="text-sm text-gray-500 font-medium">{total} sesiones · Pág. {page} de {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-40">
            Siguiente <HiOutlineChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
