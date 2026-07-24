import { useState, useEffect, useRef } from 'react';
import { HiOutlineDocumentArrowUp, HiOutlineCheckCircle, HiOutlineClock, HiOutlineXCircle, HiOutlineEye } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { fileUrl } from '../../utils/fileUrl';

interface KycDocument { id: number; type: string; originalName: string; filePath: string; mimeType: string; createdAt: string; }
interface KycRequest { id: number; userId: number; userType: string; status: string; adminNotes?: string; documents: KycDocument[]; createdAt: string; }

export default function FreelanceKyc() {
  const { t, i18n } = useTranslation();
  const [kyc, setKyc] = useState<KycRequest | null>(null);
  const [docType, setDocType] = useState('identity');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const DOC_TYPES = [
    { value: 'identity', label: t('kyc.identityDoc') },
    { value: 'cv', label: t('kyc.cvDoc') },
    { value: 'tenant_document', label: t('kyc.tenantDoc') },
  ];

  const load = async () => {
    try {
      const { data } = await api.get('/freelance/kyc');
      setKyc(data.kyc);
    } catch { setUploadError(t('error.loading')); }
  };
  useEffect(() => { load(); }, []);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true); setUploadError(''); setUploadMsg('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', docType);
    try {
      await api.post('/freelance/kyc/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadMsg(t('kyc.uploadSuccess'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      load();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || t('error.uploadDoc'));
    } finally { setUploading(false); }
  };

  const statusConfig = (s: string) => {
    if (s === 'approved') return { icon: <HiOutlineCheckCircle className="w-5 h-5 text-green-500" />, label: t('status.approved'), color: 'text-green-700 bg-green-50 border-green-200' };
    if (s === 'rejected') return { icon: <HiOutlineXCircle className="w-5 h-5 text-red-500" />, label: t('status.rejected'), color: 'text-red-700 bg-red-50 border-red-200' };
    return { icon: <HiOutlineClock className="w-5 h-5 text-yellow-500" />, label: t('kyc.reviewPending'), color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
  };

  const docLabel = (type: string) => {
    if (type === 'identity') return t('kyc.identityDoc');
    if (type === 'cv') return t('kyc.cvDoc');
    return t('kyc.tenantDoc');
  };

  const st = kyc ? statusConfig(kyc.status) : statusConfig('pending');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('kyc.uploadTitle')}</h1>
        <p className="text-sm text-gray-500">{t('kyc.uploadSubtitleFreelance')}</p>
      </div>

      <div className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${st.color}`}>
        {st.icon}
        <div>
          <p className="font-medium text-sm">{st.label}</p>
          {kyc?.adminNotes && <p className="text-xs mt-0.5 opacity-80">{t('kyc.note')} {kyc.adminNotes}</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <HiOutlineDocumentArrowUp className="w-5 h-5 text-primary-500" />
          {t('kyc.uploadFile')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('kyc.fileType')}</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white">
              {DOC_TYPES.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('kyc.fileMaxSize')}</label>
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary-100 file:text-primary-700 hover:file:bg-primary-200 transition bg-gray-50 focus:bg-white" />
          </div>
          <div className="flex items-end">
            <button onClick={handleUpload} disabled={uploading}
              className="w-full px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition disabled:opacity-60 shadow-md shadow-primary-200 flex items-center justify-center gap-2">
              {uploading && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {uploading ? t('kyc.uploading') : t('kyc.uploadDocument')}
            </button>
          </div>
        </div>
        {uploadMsg && <p className="text-sm text-green-600 mt-3">{uploadMsg}</p>}
        {uploadError && <p className="text-sm text-red-600 mt-3">{uploadError}</p>}
      </div>

      {kyc && kyc.documents && kyc.documents.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{t('kyc.uploadedCount', { count: kyc.documents.length })}</h2>
          </div>
          <div className="space-y-3">
            {kyc.documents.map((doc) => (
              <a key={doc.id} href={fileUrl(doc.filePath)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition group">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 group-hover:bg-primary-200 transition">
                  {doc.mimeType === 'application/pdf' ? (
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 text-sm truncate">{doc.originalName}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{docLabel(doc.type)} · {doc.mimeType.split('/').pop()?.toUpperCase()}</div>
                </div>
                <div className="text-xs text-gray-400 shrink-0">{new Date(doc.createdAt).toLocaleDateString(i18n.language)}</div>
                <HiOutlineEye className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {(!kyc || !kyc.documents || kyc.documents.length === 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <HiOutlineDocumentArrowUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{t('kyc.noDocsYet')}</p>
          <p className="text-gray-400 text-xs mt-1">{t('kyc.noDocsHint')}</p>
        </div>
      )}
    </div>
  );
}
