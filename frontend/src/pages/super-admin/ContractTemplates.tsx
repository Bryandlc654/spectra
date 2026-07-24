import { useState, useEffect, useRef } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlinePlus, HiOutlineEye, HiOutlineArrowDownTray } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../api/axios';
import { downloadPdf } from '../../utils/pdf';

interface Template {
  id: number; name: string; content: string; isActive: boolean; createdAt: string;
}

export default function ContractTemplates() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [preview, setPreview] = useState<Template | null>(null);

  const load = () => api.get('/contracts/templates').then((r) => setTemplates(r.data.data || r.data));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', content: getDefaultTemplate() }); setError(''); setShowForm(true); };
  const openEdit = (t: Template) => { setEditing(t); setForm({ name: t.name, content: t.content }); setError(''); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (editing) await api.put(`/contracts/templates/${editing.id}`, form);
      else await api.post('/contracts/templates', form);
      setShowForm(false); setEditing(null); load();
    }     catch (err: any) { setError(err.response?.data?.message || t('error.save')); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/contracts/templates/${deleteTarget.id}`); setDeleteTarget(null); load(); }
    catch { setError(t('error.delete')); setDeleteTarget(null); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('templates.title')}</h1>
      <button onClick={openCreate} className="mb-5 bg-primary-500 text-white px-4 py-2.5 rounded-xl hover:bg-primary-600 transition text-sm font-medium shadow-md shadow-primary-200 flex items-center gap-2">
        <HiOutlinePlus className="w-4 h-4" /> {t('templates.newTemplate')}
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">{editing ? t('templates.editTemplate') : t('templates.newTemplate')}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{t('templates.placeholdersHint')}</p>
            </div>
            {error && <div className="mx-6 mt-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{error}</div>}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <input placeholder={t('templates.templateName')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('templates.content')}</label>
                <textarea rows={16} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white font-mono resize-none" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl shrink-0">
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-white transition">{t('actions.cancel')}</button>
              <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition disabled:opacity-60 shadow-md">{saving ? t('actions.saving') : t('actions.save')}</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {templates.map((tpl) => (
          <div key={tpl.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">{tpl.name}</h3>
                <p className="text-xs text-gray-400 mt-1 truncate">{tpl.content.substring(0, 120)}...</p>
              </div>
              <div className="flex gap-1 ml-4 shrink-0">
                <button onClick={() => setPreview(tpl)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title={t('templates.preview')}><HiOutlineEye className="w-4 h-4" /></button>
                <button onClick={() => downloadPdf(`/contracts/templates/${tpl.id}/pdf`, `${tpl.name}.pdf`)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title={t('templates.downloadPdf')}>
                  <HiOutlineArrowDownTray className="w-4 h-4" />
                </button>
                <button onClick={() => openEdit(tpl)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title={t('actions.edit')}><HiOutlinePencilSquare className="w-4 h-4" /></button>
                <button onClick={() => setDeleteTarget(tpl)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title={t('actions.delete')}><HiOutlineTrash className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {templates.length === 0 && <div className="text-center py-12 text-gray-400">{t('templates.noTemplates')}</div>}
      </div>

      {preview && (
        <PdfPreviewModal template={preview} onClose={() => setPreview(null)} />
      )}

      <ConfirmModal open={!!deleteTarget} title={t('templates.deleteTitle')} message={t('templates.deleteMessage', { name: deleteTarget?.name })} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

function PdfPreviewModal({ template, onClose }: { template: Template; onClose: () => void }) {
  const { t } = useTranslation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/contracts/templates/${template.id}/pdf`, { responseType: 'blob' }).then((r) => {
      const url = URL.createObjectURL(r.data);
      setPdfUrl(url);
    });
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [template.id]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{template.name}</h2>
            <p className="text-sm text-gray-500">{t('templates.pdfPreview')}</p>
          </div>
          <div className="flex items-center gap-2">
            {pdfUrl && (
              <a href={pdfUrl} download={`${template.name}.pdf`}
                className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition shadow-md flex items-center gap-2">
                <HiOutlineArrowDownTray className="w-4 h-4" /> PDF
              </a>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-100">
          {pdfUrl ? (
            <iframe ref={iframeRef} src={pdfUrl} className="w-full h-full min-h-[500px]" title="PDF Preview" />
          ) : (
            <div className="flex items-center justify-center h-[500px] text-gray-400 text-sm">{t('templates.loadingPdf')}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function getDefaultTemplate() {
  return `CONTRATO DE SERVICIOS

En {{city}}, a {{date}}

CONTRATANTE: {{tenant_name}}
CONTRATISTA: {{freelancer_name}}
RUC / DOC: {{freelancer_document}}

Las partes acuerdan celebrar el presente contrato de servicios profesionales, sujeto a las siguientes cláusulas:

PRIMERA: OBJETO
El CONTRATISTA se obliga a prestar sus servicios profesionales al CONTRATANTE para {{description}}.

SEGUNDA: PLAZO
El presente contrato tendrá una vigencia desde el {{start_date}} hasta el {{end_date}}.

TERCERA: CONTRAPRESTACIÓN
El CONTRATANTE pagará al CONTRATISTA la suma de {{amount}} por los servicios prestados.

CUARTA: CONFIDENCIALIDAD
El CONTRATISTA se obliga a mantener la más estricta confidencialidad sobre toda la información del CONTRATANTE.


FIRMAS
________________________              ________________________
{{tenant_name}}                       {{freelancer_name}}
CONTRATANTE                           CONTRATISTA`;
}
