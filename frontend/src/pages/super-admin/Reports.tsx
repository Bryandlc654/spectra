import { useState, useEffect } from 'react';
import api from '../../api/axios';

interface LogEntry {
  id: number; userId: number; userName?: string; action: string;
  entityType: string; entityId?: number; description?: string; createdAt: string;
}

interface PageData {
  data: LogEntry[];
  total: number; page: number; limit: number; totalPages: number;
}

export default function Reports() {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [actions, setActions] = useState<string[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);

  const load = () => {
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (filterAction) params.set('action', filterAction);
    if (filterEntity) params.set('entityType', filterEntity);
    api.get(`/activity-logs?${params}`).then((r) => setPageData(r.data));
  };

  useEffect(() => {
    api.get('/activity-logs/actions').then((r) => setActions(r.data));
    api.get('/activity-logs/entity-types').then((r) => setEntityTypes(r.data));
  }, []);

  useEffect(() => { load(); }, [page, filterAction, filterEntity]);

  const actionLabels: Record<string, string> = {
    create: 'Creación', update: 'Actualización', delete: 'Eliminación', view: 'Visita',
  };

  const entityLabels: Record<string, string> = {
    tenant: 'Tenant', admin_tenant: 'Admin Tenant', freelancer: 'Freelancer',
    dashboard: 'Dashboard', managed_user: 'Usuario', custom_role: 'Rol', area: 'Área',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Reportes de actividad</h1>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white min-w-[150px]"
          value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}>
          <option value="">Todas las acciones</option>
          {actions.map((a) => <option key={a} value={a}>{actionLabels[a] || a}</option>)}
        </select>
        <select className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white min-w-[180px]"
          value={filterEntity} onChange={(e) => { setFilterEntity(e.target.value); setPage(1); }}>
          <option value="">Todas las entidades</option>
          {entityTypes.map((e) => <option key={e} value={e}>{entityLabels[e] || e}</option>)}
        </select>
        {(filterAction || filterEntity) && (
          <button onClick={() => { setFilterAction(''); setFilterEntity(''); setPage(1); }}
            className="text-xs text-gray-500 hover:text-primary-500 transition font-medium px-2">Limpiar</button>
        )}
        <span className="text-xs text-gray-400 ml-auto">{pageData?.total ?? 0} registro(s)</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3">Entidad</th>
              <th className="px-4 py-3">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {pageData?.data.map((log) => (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('es', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 text-gray-800 text-xs">{log.userName || `ID ${log.userId}`}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    log.action === 'create' ? 'bg-green-100 text-green-700' :
                    log.action === 'update' ? 'bg-blue-100 text-blue-700' :
                    log.action === 'delete' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {actionLabels[log.action] || log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{entityLabels[log.entityType] || log.entityType}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{log.description || '—'}</td>
              </tr>
            ))}
            {(!pageData || pageData.data.length === 0) && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No hay registros de actividad</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pageData && pageData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-40">
            Anterior
          </button>
          <span className="text-sm text-gray-500">Pág. {pageData.page} de {pageData.totalPages}</span>
          <button disabled={page >= pageData.totalPages} onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-40">
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
