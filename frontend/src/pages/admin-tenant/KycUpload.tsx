import { useState, useEffect, useRef } from 'react';
import { HiOutlineDocumentArrowUp, HiOutlineCheckCircle, HiOutlineClock, HiOutlineXCircle, HiOutlineEye, HiOutlineTrash } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { fileUrl } from '../../utils/fileUrl';
import { useDebounce } from '../../hooks/useDebounce';

interface Freelancer { id: number; name: string; email: string; code?: string; }
interface KycDocument { id: number; type: string; originalName: string; filePath: string; mimeType: string; createdAt: string; }
interface KycRequest { id: number; userId: number; userType: string; status: string; adminNotes?: string; documents: KycDocument[]; createdAt: string; user?: { name: string; email: string }; }

export default function KycUpload() {
  const { t, i18n } = useTranslation();

  const DOC_TYPES = [
    { value: 'identity', label: t('kyc.identityDoc') },
    { value: 'cv', label: t('kyc.cvDoc') },
    { value: 'tenant_document', label: t('kyc.tenantDoc') },
  ];
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [selectedFreelancer, setSelectedFreelancer] = useState<number>(0);
  const [docType, setDocType] = useState('identity');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [viewingKyc, setViewingKyc] = useState<KycRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionError, setActionError] = useState('');

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (debouncedSearch) params.set('search', debouncedSearch);
      const qs = params.toString();
      const [fRes, kRes] = await Promise.all([
        api.get('/admin-tenant/freelancers'),
        api.get(`/admin-tenant/kyc${qs ? '?' + qs : ''}`),
      ]);
      setFreelancers(fRes.data.data || []);
      setRequests(kRes.data.data || []);
    } catch { console.error('Error loading'); }
  };
  useEffect(() => { load(); }, [filterStatus, debouncedSearch]);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !selectedFreelancer) return;
    setUploading(true); setUploadError(''); setUploadMsg('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', docType);
    try {
      await api.post(`/admin-tenant/kyc/upload/${selectedFreelancer}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadMsg(t('kyc.uploadSuccess'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      load();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || t('error.uploadDoc'));
    } finally { setUploading(false); }
  };

  const handleKycStatus = async (kycId: number, status: string) => {
    setActionError('');
    try {
      await api.put(`/admin-tenant/kyc/${kycId}/status`, { status, adminNotes: adminNotes || undefined });
      setViewingKyc(null); setAdminNotes(''); load();
    } catch (err: any) {
      setActionError(err.response?.data?.message || t('error.updateStatus'));
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    try {
      await api.delete(`/admin-tenant/kyc/documents/${docId}`);
      if (viewingKyc) {
        setViewingKyc({ ...viewingKyc, documents: viewingKyc.documents.filter((d) => d.id !== docId) });
      }
      load();
    } catch (err: any) {
      setActionError(err.response?.data?.message || t('error.deleteDoc'));
    }
  };

  const statusIcon = (s: string) => {
    if (s === 'approved') return <HiOutlineCheckCircle className="w-4 h-4 text-green-500" />;
    if (s === 'rejected') return <HiOutlineXCircle className="w-4 h-4 text-red-500" />;
    return <HiOutlineClock className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('kyc.uploadTitle')}</h1>
        <p className="text-sm text-gray-500">{t('kyc.uploadSubtitle')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <HiOutlineDocumentArrowUp className="w-5 h-5 text-primary-500" />
          {t('kyc.uploadDocument')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('contracts.freelancer')} <span className="text-red-400">*</span></label>
            <select value={selectedFreelancer} onChange={(e) => setSelectedFreelancer(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white">
              <option value={0}>{t('kyc.selectFreelancer')}</option>
              {freelancers.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.email})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('kyc.docType')}</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white">
              {DOC_TYPES.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('kyc.uploadDocument')}</label>
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary-100 file:text-primary-700 hover:file:bg-primary-200 transition bg-gray-50 focus:bg-white" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleUpload} disabled={uploading || !selectedFreelancer}
            className="px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition disabled:opacity-60 shadow-md shadow-primary-200 flex items-center gap-2">
            {uploading && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            {uploading ? t('actions.processing') : t('kyc.uploadDocument')}
          </button>
          {uploadMsg && <span className="text-sm text-green-600">{uploadMsg}</span>}
          {uploadError && <span className="text-sm text-red-600">{uploadError}</span>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" placeholder={t('adminTenants.searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {[
          { value: '', label: t('actions.all') },
          { value: 'pending', label: t('kyc.pending') },
          { value: 'approved', label: t('kyc.approved') },
          { value: 'rejected', label: t('kyc.rejected') },
        ].map((opt) => (
          <button key={opt.value} onClick={() => setFilterStatus(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterStatus === opt.value ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-3">{t('contracts.freelancer')}</th>
              <th className="px-4 py-3">{t('kyc.documents')}</th>
              <th className="px-4 py-3">{t('status.active')}</th>
              <th className="px-4 py-3">{t('dashboard.date')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{r.user?.name || `User #${r.userId}`}</div>
                  <div className="text-xs text-gray-500">{r.user?.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.documents?.length || 0} {t('kyc.documents')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {statusIcon(r.status)}
                    <span className={`text-xs font-medium capitalize ${r.status === 'approved' ? 'text-green-700' : r.status === 'rejected' ? 'text-red-700' : 'text-yellow-700'}`}>
                      {t(`status.${r.status}`)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString(i18n.language)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => { setViewingKyc(r); setAdminNotes(''); setActionError(''); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title={t('actions.view')}>
                    <HiOutlineEye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t('kyc.noRequests')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {viewingKyc && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewingKyc(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t('kyc.reviewRequest')}</h2>
                <p className="text-sm text-gray-500">{viewingKyc.user?.name || `User #${viewingKyc.userId}`}</p>
              </div>
              <button onClick={() => setViewingKyc(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <h3 className="text-sm font-medium text-gray-700">{t('kyc.documentsSubmitted')}</h3>
              {viewingKyc.documents?.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
                  <a href={fileUrl(doc.filePath)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                      <HiOutlineDocumentArrowUp className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm truncate">{doc.originalName}</div>
                      <div className="text-xs text-gray-500">{doc.type} · {doc.mimeType}</div>
                    </div>
                  </a>
                  <button onClick={() => handleDeleteDoc(doc.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition shrink-0" title={t('actions.delete')}>
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(!viewingKyc.documents || viewingKyc.documents.length === 0) && (
                <p className="text-center text-gray-400 py-4">{t('kyc.noRequests')}</p>
              )}

              {viewingKyc.status === 'pending' && (
                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('kyc.reviewNote')}</label>
                  <textarea rows={2} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder={t('kyc.reviewNotePlaceholder')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white resize-none" />
                </div>
              )}
              {actionError && <p className="text-sm text-red-600">{actionError}</p>}
            </div>
            {viewingKyc.status === 'pending' && (
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl shrink-0">
                <button onClick={() => handleKycStatus(viewingKyc.id, 'rejected')}
                  className="px-5 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition flex items-center gap-2">
                  <HiOutlineXCircle className="w-4 h-4" /> {t('actions.reject')}
                </button>
                <button onClick={() => handleKycStatus(viewingKyc.id, 'approved')}
                  className="px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition shadow-md flex items-center gap-2">
                  <HiOutlineCheckCircle className="w-4 h-4" /> {t('actions.approve')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
