import { useState, useEffect, useRef } from 'react';
import { HiOutlineDocumentArrowUp, HiOutlineCheckCircle, HiOutlineClock, HiOutlineXCircle, HiOutlineTrash } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { fileUrl } from '../../utils/fileUrl';

interface KycDocument { id: number; type: string; originalName: string; filePath: string; mimeType: string; createdAt: string; }
interface KybRequest { id: number; tenantId: number; status: string; adminNotes?: string; documents: KycDocument[]; createdAt: string; }

export default function KybUpload() {
  const { t, i18n } = useTranslation();

  const DOC_TYPES = [
    { value: 'business_registration', label: 'Registro de Empresa' },
    { value: 'tax_document', label: 'Documento Fiscal' },
    { value: 'bank_statement', label: 'Estado de Cuenta Bancaria' },
    { value: 'other', label: 'Otro' },
  ];
  const [kybRequest, setKybRequest] = useState<KybRequest | null>(null);
  const [docType, setDocType] = useState('business_registration');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const res = await api.get('/admin-tenant/kyb');
      setKybRequest(res.data || null);
    } catch { console.error('Error loading KYB'); }
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
      await api.post('/admin-tenant/kyb/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadMsg('Documento cargado correctamente');
      if (fileInputRef.current) fileInputRef.current.value = '';
      load();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Error al cargar el documento');
    } finally { setUploading(false); }
  };

  const handleDeleteDoc = async (docId: number) => {
    try {
      await api.delete(`/admin-tenant/kyb/documents/${docId}`);
      load();
    } catch (err: any) {
      console.error('Error deleting document:', err);
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
        <h1 className="text-2xl font-bold text-gray-800">Verificación de Empresa (KYB)</h1>
        <p className="text-sm text-gray-500">Carga los documentos de tu empresa para la verificación</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <HiOutlineDocumentArrowUp className="w-5 h-5 text-primary-500" />
          Cargar Documento
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white">
              {DOC_TYPES.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Archivo</label>
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary-100 file:text-primary-700 hover:file:bg-primary-200 transition bg-gray-50 focus:bg-white" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleUpload} disabled={uploading || !fileInputRef.current?.files?.length}
            className="px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition disabled:opacity-60 shadow-md shadow-primary-200 flex items-center gap-2">
            {uploading && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            {uploading ? 'Procesando...' : 'Cargar Documento'}
          </button>
          {uploadMsg && <span className="text-sm text-green-600">{uploadMsg}</span>}
          {uploadError && <span className="text-sm text-red-600">{uploadError}</span>}
        </div>
      </div>

      {/* Status Section */}
      {kybRequest && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Estado de Verificación</h3>
              <p className="text-sm text-gray-500">Solicitud creada el {new Date(kybRequest.createdAt).toLocaleDateString(i18n.language)}</p>
            </div>
            <div className="flex items-center gap-2">
              {statusIcon(kybRequest.status)}
              <span className={`text-sm font-medium capitalize ${kybRequest.status === 'approved' ? 'text-green-700' : kybRequest.status === 'rejected' ? 'text-red-700' : 'text-yellow-700'}`}>
                {kybRequest.status === 'approved' ? 'Aprobado' : kybRequest.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
              </span>
            </div>
          </div>
          {kybRequest.adminNotes && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
              <h4 className="text-sm font-semibold text-yellow-800 mb-1">Notas del Administrador</h4>
              <p className="text-sm text-yellow-700">{kybRequest.adminNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Documents List */}
      {kybRequest?.documents && kybRequest.documents.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Documentos Cargados</h3>
          <div className="space-y-3">
            {kybRequest.documents.map((doc) => (
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
                {kybRequest.status !== 'approved' && (
                  <button onClick={() => handleDeleteDoc(doc.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition shrink-0" title="Eliminar">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Documents */}
      {(!kybRequest?.documents || kybRequest.documents.length === 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <HiOutlineDocumentArrowUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No hay documentos cargados</h3>
          <p className="text-sm text-gray-500">Carga los documentos de tu empresa para iniciar la verificación</p>
        </div>
      )}
    </div>
  );
}