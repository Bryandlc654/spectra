import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { useDebounce } from '../../hooks/useDebounce';
import { fileUrl } from '../../utils/fileUrl';
import { HiOutlineCheckCircle, HiOutlineDocumentArrowDown, HiOutlineShieldCheck, HiOutlineBuildingOffice, HiOutlineClock, HiOutlineXCircle, HiOutlineEye, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

interface KybDocument {
  id: number; type: string; originalName: string; filePath: string; mimeType: string; createdAt: string;
}

interface KybRequest {
  id: number; tenantId: number; status: string; adminNotes?: string;
  documents: KybDocument[]; createdAt: string;
  tenant?: { id: number; name: string; businessName: string; email: string };
}

export default function KybReview() {
  const { t, i18n } = useTranslation();
  const [requests, setRequests] = useState<KybRequest[]>([]);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [totalPages, setTotalPages] = useState(1);
  const [reviewing, setReviewing] = useState<KybRequest | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const load = async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (filterStatus) params.set('status', filterStatus);
      if (debouncedSearch) params.set('search', debouncedSearch);
      const kybRes = await api.get(`/super-admin/kyb?${params}`);
      setRequests(kybRes.data.data);
      setTotalPages(Math.ceil(kybRes.data.total / 50));
    } catch {
      console.error('Error loading KYB requests');
    } finally { setFetching(false); }
  };

  useEffect(() => { load(); }, [page, filterStatus, debouncedSearch]);

  const handleUpdateStatus = async (id: number, status: string) => {
    setLoading(true);
    try {
      await api.put(`/super-admin/kyb/${id}/status`, { status, adminNotes: actionNote || undefined });
      setReviewing(null);
      setActionNote('');
      await load();
    } catch {
      console.error('Error updating KYB status');
    } finally { setLoading(false); }
  };

  const statusBadge = (s: string) => {
    if (s === 'approved') return 'bg-green-50 text-green-700 border-green-200';
    if (s === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  };
  const statusLabel = (s: string) => s === 'approved' ? 'Aprobado' : s === 'rejected' ? 'Rechazado' : 'Pendiente';
  const statusIcon = (s: string) => s === 'approved' ? HiOutlineCheckCircle : s === 'rejected' ? HiOutlineXCircle : HiOutlineClock;

  const docTypeLabel = (type: string) => {
    switch (type) {
      case 'business_registration': return 'Registro de Empresa';
      case 'tax_document': return 'Documento Fiscal';
      case 'bank_statement': return 'Estado de Cuenta';
      default: return type;
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
          <HiOutlineBuildingOffice className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verificación KYB</h1>
          <p className="text-sm text-gray-500">Revisa las solicitudes de verificación de empresas</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input type="text" placeholder="Buscar empresa..."
              className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white w-[220px]"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white min-w-[160px]"
            value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
          </select>
        </div>
      </div>

      {fetching ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Cargando...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const StatusIcon = statusIcon(req.status);
            return (
              <div key={req.id} className={`bg-white rounded-xl border shadow-sm transition hover:shadow-md ${
                req.status === 'approved' ? 'border-green-100' :
                req.status === 'rejected' ? 'border-red-100' : 'border-yellow-100'
              }`}>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <HiOutlineBuildingOffice className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="font-semibold text-gray-900 text-sm">{req.tenant?.businessName || req.tenant?.name || 'Empresa'}</span>
                          <span className="text-xs text-gray-400">· {req.tenant?.email || `ID ${req.tenantId}`}</span>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusBadge(req.status)}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusLabel(req.status)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                          <span>{new Date(req.createdAt).toLocaleDateString(i18n.language, { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span>{req.documents.length} documento(s)</span>
                        </div>
                        {req.documents.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {req.documents.map((doc) => (
                              <a key={doc.id} href={fileUrl(doc.filePath)} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition">
                                <HiOutlineDocumentArrowDown className="w-3.5 h-3.5" />
                                {docTypeLabel(doc.type)}
                              </a>
                            ))}
                          </div>
                        )}
                        {req.adminNotes && (
                          <div className="mt-2 flex items-start gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg text-xs border border-yellow-100">
                            <HiOutlineClock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{req.adminNotes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {req.status === 'pending' && (
                      <button onClick={() => setReviewing(req)}
                        className="ml-4 shrink-0 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition flex items-center gap-2 shadow-md shadow-primary-200">
                        <HiOutlineEye className="w-4 h-4" />
                        Revisar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {requests.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiOutlineBuildingOffice className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium">No hay solicitudes</p>
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-40">
            <HiOutlineChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <span className="text-sm text-gray-500 font-medium">Página {page} de {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-40">
            Siguiente <HiOutlineChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {reviewing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setReviewing(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <HiOutlineClock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Revisar Solicitud KYB</h2>
                  <p className="text-sm text-gray-500">{reviewing.tenant?.businessName || reviewing.tenant?.name || 'Empresa'} · {reviewing.tenant?.email || `ID ${reviewing.tenantId}`}</p>
                </div>
              </div>
              <button onClick={() => setReviewing(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6">
              {reviewing.documents.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-medium text-gray-700 mb-3">Documentos Presentados</p>
                  <div className="space-y-2">
                    {reviewing.documents.map((doc) => (
                      <a key={doc.id} href={fileUrl(doc.filePath)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 text-sm hover:bg-primary-50 transition border border-gray-200 hover:border-primary-200 group">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-200 group-hover:border-primary-200">
                          <HiOutlineDocumentArrowDown className="w-5 h-5 text-primary-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{doc.originalName}</p>
                          <p className="text-xs text-gray-400">{docTypeLabel(doc.type)}</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-300 group-hover:text-primary-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nota (opcional)</label>
                <textarea rows={3} placeholder="Escribe una nota..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white resize-none"
                  value={actionNote} onChange={(e) => setActionNote(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button onClick={() => { handleUpdateStatus(reviewing.id, 'rejected'); }}
                disabled={loading}
                className="px-6 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition disabled:opacity-40 flex items-center gap-2">
                <HiOutlineXCircle className="w-4 h-4" />
                Rechazar
              </button>
              <button onClick={() => { handleUpdateStatus(reviewing.id, 'approved'); }}
                disabled={loading}
                className="px-6 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition disabled:opacity-60 shadow-lg shadow-green-200 flex items-center gap-2">
                {loading ? 'Procesando...' : <><HiOutlineCheckCircle className="w-4 h-4" /> Aprobar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
