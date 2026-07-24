import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { fileUrl } from '../../utils/fileUrl';
import { HiOutlineCheckCircle, HiOutlineDocumentArrowDown, HiOutlineShieldCheck, HiOutlineUserGroup, HiOutlineClock, HiOutlineXCircle, HiOutlineEye, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineTrash } from 'react-icons/hi2';

interface KycDocument {
  id: number; type: string; originalName: string; filePath: string; mimeType: string; createdAt: string;
}

interface KycRequest {
  id: number; userId: number; userType: string; status: string; adminNotes?: string;
  documents: KycDocument[]; createdAt: string;
  user?: { id: number; name: string; email: string };
}

export default function KycReview() {
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [totalPages, setTotalPages] = useState(1);
  const [reviewing, setReviewing] = useState<KycRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<KycRequest | null>(null);

  const load = async () => {
    setFetching(true); setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (filterStatus) params.set('status', filterStatus);
      const [kycRes, statsRes] = await Promise.all([
        api.get(`/kyc?${params}`),
        api.get('/kyc/stats'),
      ]);
      setRequests(kycRes.data.data);
      setTotalPages(kycRes.data.totalPages);
      setStats(statsRes.data);
    } catch {
      setError('Error al cargar las solicitudes');
    } finally { setFetching(false); }
  };

  useEffect(() => { load(); }, [page, filterStatus]);

  const handleApprove = async (id: number) => {
    setLoading(true); setError(null);
    try {
      await api.put(`/kyc/approve/${id}`);
      setReviewing(null); await load();
    } catch {
      setError('Error al aprobar la solicitud');
    } finally { setLoading(false); }
  };

  const handleReject = async (id: number) => {
    if (!rejectNote.trim()) return;
    setLoading(true); setError(null);
    try {
      await api.put(`/kyc/reject/${id}`, { adminNotes: rejectNote });
      setReviewing(null); setRejectNote(''); await load();
    } catch {
      setError('Error al rechazar la solicitud');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    setLoading(true); setError(null);
    try {
      await api.delete(`/kyc/${id}`);
      setDeleting(null); setReviewing(null); await load();
    } catch {
      setError('Error al eliminar la solicitud');
    } finally { setLoading(false); }
  };

  const userTypeLabel = (t: string) => t === 'admin_tenant' ? 'Admin Tenant' : 'Freelancer';
  const userTypeIcon = (t: string) => t === 'admin_tenant' ? HiOutlineShieldCheck : HiOutlineUserGroup;
  const statusBadge = (s: string) => {
    if (s === 'approved') return 'bg-green-50 text-green-700 border-green-200';
    if (s === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  };
  const statusLabel = (s: string) => s === 'approved' ? 'Aprobado' : s === 'rejected' ? 'Rechazado' : 'Pendiente';
  const statusIcon = (s: string) => s === 'approved' ? HiOutlineCheckCircle : s === 'rejected' ? HiOutlineXCircle : HiOutlineClock;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
          <HiOutlineShieldCheck className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC / KYB</h1>
          <p className="text-sm text-gray-500">Verificación y aprobación de documentos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pendientes', value: stats.pending, icon: HiOutlineClock, color: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
          { label: 'Aprobados', value: stats.approved, icon: HiOutlineCheckCircle, color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
          { label: 'Rechazados', value: stats.rejected, icon: HiOutlineXCircle, color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${s.text}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-xl mb-5 text-sm border border-red-100">
          <HiOutlineXCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <select className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white min-w-[160px]"
            value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">Todas las solicitudes</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
          </select>
        </div>
        <span className="text-xs text-gray-400">{stats.total} solicitudes</span>
      </div>

      {fetching ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Cargando solicitudes...</p>
        </div>
      ) : (
      <div className="space-y-3">
        {requests.map((req) => {
          const TypeIcon = userTypeIcon(req.userType);
          const StatusIcon = statusIcon(req.status);
          return (
            <div key={req.id} className={`bg-white rounded-xl border shadow-sm transition hover:shadow-md ${
              req.status === 'approved' ? 'border-green-100' :
              req.status === 'rejected' ? 'border-red-100' : 'border-yellow-100'
            }`}>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      req.userType === 'admin_tenant' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                    }`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-semibold text-gray-900 text-sm">{req.user?.name || 'Usuario'}</span>
                        <span className="text-xs text-gray-400">· {req.user?.email || `ID ${req.userId}`}</span>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusBadge(req.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusLabel(req.status)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span>{new Date(req.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span>{req.documents.length} documento(s)</span>
                      </div>
                      {req.documents.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {req.documents.map((doc) => (
                            <a key={doc.id} href={fileUrl(doc.filePath)} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition">
                              <HiOutlineDocumentArrowDown className="w-3.5 h-3.5" />
                              {doc.type === 'identity' ? 'Documento Identidad' : doc.type === 'cv' ? 'CV' : doc.type === 'tenant_document' ? 'Doc. Tenant' : doc.type}
                            </a>
                          ))}
                        </div>
                      )}
                      {req.adminNotes && (
                        <div className="mt-2 flex items-start gap-1.5 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs border border-red-100">
                          <HiOutlineXCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
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
                  <button onClick={() => setDeleting(req)} disabled={loading}
                    className="ml-2 shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-100 hover:border-red-200 transition disabled:opacity-40"
                    title="Eliminar solicitud">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {requests.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineShieldCheck className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">No hay solicitudes</p>
            <p className="text-gray-300 text-sm mt-1">Las solicitudes pendientes aparecerán aquí</p>
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
                  <h2 className="text-lg font-semibold text-gray-900">Revisar solicitud</h2>
                  <p className="text-sm text-gray-500">{reviewing.user?.name || 'Usuario'} · {reviewing.user?.email || `ID ${reviewing.userId}`}</p>
                </div>
              </div>
              <button onClick={() => setReviewing(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6">
              {reviewing.documents.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-medium text-gray-700 mb-3">Documentos presentados</p>
                  <div className="space-y-2">
                    {reviewing.documents.map((doc) => (
                      <a key={doc.id} href={fileUrl(doc.filePath)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 text-sm hover:bg-primary-50 transition border border-gray-200 hover:border-primary-200 group">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-200 group-hover:border-primary-200">
                          <HiOutlineDocumentArrowDown className="w-5 h-5 text-primary-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{doc.originalName}</p>
                          <p className="text-xs text-gray-400">
                            {doc.type === 'identity' ? 'Documento de Identidad' : doc.type === 'cv' ? 'Currículum Vitae' : doc.type === 'tenant_document' ? 'Documento del Tenant' : doc.type}
                          </p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nota de revisión</label>
                <textarea rows={3} placeholder="Escribe el motivo si vas a rechazar, o deja vacío para aprobar..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white resize-none"
                  value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button onClick={() => setDeleting(reviewing)}
                disabled={loading}
                className="px-4 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition disabled:opacity-40 flex items-center gap-2">
                <HiOutlineTrash className="w-4 h-4" />
                Eliminar
              </button>
              <button onClick={() => { handleReject(reviewing.id); }}
                disabled={loading || !rejectNote.trim()}
                className="px-6 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition disabled:opacity-40 flex items-center gap-2">
                <HiOutlineXCircle className="w-4 h-4" />
                Rechazar
              </button>
              <button onClick={() => { handleApprove(reviewing.id); }}
                disabled={loading}
                className="px-6 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition disabled:opacity-60 shadow-lg shadow-green-200 flex items-center gap-2">
                {loading ? 'Procesando...' : <><HiOutlineCheckCircle className="w-4 h-4" /> Aprobar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleting(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <HiOutlineTrash className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar solicitud</h3>
              <p className="text-sm text-gray-500">
                Se eliminará la solicitud de <strong>{deleting.user?.name || 'este usuario'}</strong> y todos sus documentos adjuntos. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button onClick={() => setDeleting(null)}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleting.id)} disabled={loading}
                className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition disabled:opacity-60 shadow-lg shadow-red-200 flex items-center gap-2">
                {loading ? 'Eliminando...' : <><HiOutlineTrash className="w-4 h-4" /> Eliminar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
