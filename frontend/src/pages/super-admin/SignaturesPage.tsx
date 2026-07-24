import { useState, useEffect } from 'react';
import { HiOutlineDocumentArrowUp, HiOutlineTrash, HiOutlinePaperAirplane, HiOutlineEye, HiOutlineUserPlus, HiOutlineCheckCircle, HiOutlineDocumentText } from 'react-icons/hi2';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../api/axios';

interface Signer {
  id: number; name: string; email: string; role: string; signOrder: number;
  hasSigned: boolean; signedAt?: string; token: string;
}

interface SignDocument {
  id: number; title: string; description?: string; filePath: string;
  originalName: string; status: string; signers: Signer[];
  certificateData?: string; createdAt: string;
}

export default function SignaturesPage() {
  const [docs, setDocs] = useState<SignDocument[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', file: null as File | null });
  const [selectedDoc, setSelectedDoc] = useState<SignDocument | null>(null);
  const [signerForm, setSignerForm] = useState({ name: '', email: '', role: 'signer' });
  const [deleteTarget, setDeleteTarget] = useState<SignDocument | null>(null);
  const [fetching, setFetching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setFetching(true); setError('');
    try { const r = await api.get('/signatures'); setDocs(r.data.data || r.data); } catch { setError('Error al cargar documentos'); }
    finally { setFetching(false); }
  };
  useEffect(() => { load(); }, []);

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.title) return;
    setError(''); setSending(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadForm.file);
      fd.append('title', uploadForm.title);
      await api.post('/signatures', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowUpload(false); setUploadForm({ title: '', file: null }); load();
    } catch (err: any) { setError(err.response?.data?.message || 'Error al subir'); }
    finally { setSending(false); }
  };

  const handleAddSigner = async () => {
    if (!selectedDoc || !signerForm.name || !signerForm.email) return;
    setError('');
    try {
      await api.post(`/signatures/${selectedDoc.id}/signers`, signerForm);
      setSignerForm({ name: '', email: '', role: 'signer' });
      const updated = await api.get(`/signatures/${selectedDoc.id}`);
      setSelectedDoc(updated.data);
    } catch (err: any) { setError(err.response?.data?.message || 'Error al agregar firmante'); }
  };

  const handleRemoveSigner = async (signerId: number) => {
    if (!selectedDoc) return;
    setError('');
    try {
      await api.delete(`/signatures/${selectedDoc.id}/signers/${signerId}`);
      const updated = await api.get(`/signatures/${selectedDoc.id}`);
      setSelectedDoc(updated.data);
    } catch { setError('Error al eliminar firmante'); }
  };

  const handleSend = async (id: number) => {
    setError(''); setSending(true);
    try { await api.post(`/signatures/${id}/send`); load(); }
    catch (err: any) { setError(err.response?.data?.message || 'Error al enviar'); }
    finally { setSending(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError('');
    try { await api.delete(`/signatures/${deleteTarget.id}`); setDeleteTarget(null); load(); }
    catch { setError('Error al eliminar'); }
  };

  const statusBadge = (s: string) => {
    if (s === 'completed') return 'bg-green-100 text-green-700';
    if (s === 'sent') return 'bg-blue-100 text-blue-700';
    return 'bg-yellow-100 text-yellow-700';
  };
  const statusLabel = (s: string) => s === 'completed' ? 'Completado' : s === 'sent' ? 'Enviado' : 'Borrador';

  return (
    <div>
      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm border border-red-100">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {fetching ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Cargando documentos...</p>
        </div>
      ) : (
      <><div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center"><HiOutlineDocumentText className="w-5 h-5 text-primary-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Firma Digital</h1><p className="text-sm text-gray-500">Sube documentos y agrega firmantes</p></div>
        </div>
        <button onClick={() => setShowUpload(true)} disabled={sending} className="bg-primary-500 text-white px-4 py-2.5 rounded-xl hover:bg-primary-600 transition text-sm font-medium shadow-md shadow-primary-200 flex items-center gap-2 disabled:opacity-60">
          <HiOutlineDocumentArrowUp className="w-4 h-4" /> Subir documento
        </button>
      </div>

      <div className="grid gap-3">
        {docs.map((doc) => (
          <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0"><HiOutlineDocumentText className="w-5 h-5 text-gray-500" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{doc.title}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(doc.status)}`}>{statusLabel(doc.status)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{doc.originalName} · {doc.signers.length} firmante(s) · {doc.signers.filter((s) => s.hasSigned).length} firmaron</p>
                </div>
              </div>
              <div className="flex gap-1 ml-4 shrink-0">
                {doc.status === 'draft' && (
                  <button onClick={() => handleSend(doc.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Enviar">
                    <HiOutlinePaperAirplane className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setSelectedDoc(doc)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Ver">
                  <HiOutlineEye className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget(doc)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Eliminar">
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {docs.length === 0 && <div className="text-center py-12 text-gray-400">No hay documentos para firma</div>}
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowUpload(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subir documento</h2>
            <div className="space-y-3">
              <input placeholder="Título del documento" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} />
              <label className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-primary-300 transition">
                <div className="text-center">
                  <HiOutlineDocumentArrowUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{uploadForm.file ? uploadForm.file.name : 'PDF, Word o imagen · Max 20MB'}</p>
                </div>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })} />
              </label>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowUpload(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button onClick={handleUpload} disabled={!uploadForm.file || !uploadForm.title} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition disabled:opacity-60 shadow-md">Subir</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDoc && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedDoc(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedDoc.title}</h2>
                <p className="text-sm text-gray-500">{selectedDoc.originalName}</p>
              </div>
              <div className="flex gap-2">
                {selectedDoc.status === 'completed' && selectedDoc.certificateData && (
                  <a href={`/api/signatures/${selectedDoc.id}/certificate`} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition">Certificado</a>
                )}
                <button onClick={() => setSelectedDoc(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3 mb-5">
                <p className="text-sm font-medium text-gray-700">Firmantes</p>
                {selectedDoc.signers.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold">{s.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.email} · {s.role === 'signer' ? 'Firmante' : s.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.hasSigned ? (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1"><HiOutlineCheckCircle className="w-4 h-4" /> Firmó</span>
                      ) : selectedDoc.status === 'draft' ? (
                        <button onClick={() => handleRemoveSigner(s.id)} className="text-xs text-red-500 hover:text-red-600 font-medium">Quitar</button>
                      ) : (
                        <span className="text-xs text-yellow-600">Pendiente</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedDoc.status === 'draft' && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Agregar firmante</p>
                  <div className="space-y-2">
                    <input placeholder="Nombre" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                      value={signerForm.name} onChange={(e) => setSignerForm({ ...signerForm, name: e.target.value })} />
                    <input placeholder="Email" type="email" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                      value={signerForm.email} onChange={(e) => setSignerForm({ ...signerForm, email: e.target.value })} />
                    <button onClick={handleAddSigner} className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2">
                      <HiOutlineUserPlus className="w-4 h-4" /> Agregar firmante
                    </button>
                  </div>
                </div>
              )}

              {selectedDoc.status === 'draft' && selectedDoc.signers.length > 0 && (
                <div className="mt-4">
                  <button onClick={() => { handleSend(selectedDoc.id); setSelectedDoc(null); }} disabled={sending}
                    className="w-full py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition disabled:opacity-60 shadow-md flex items-center justify-center gap-2">
                    <HiOutlinePaperAirplane className="w-4 h-4" /> Enviar para firma
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal open={!!deleteTarget} title="Eliminar documento" message="¿Eliminar este documento?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      </>)}
    </div>
  );
}
