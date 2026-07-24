import { useState, useEffect, useMemo } from 'react';
import { HiOutlineDocumentText, HiOutlineEye, HiOutlineTrash, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlinePencilSquare } from 'react-icons/hi2';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import ConfirmModal from '../../components/ConfirmModal';
import { downloadPdf } from '../../utils/pdf';
import api from '../../api/axios';
import { useDebounce } from '../../hooks/useDebounce';

type ContractFormData = {
  templateId: number;
  freelancerUserId: number;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  amount?: string;
};

interface Contract {
  id: number; title: string; content: string; status: string; freelancerUserId: number;
  freelancerName?: string; tenantName?: string; amount?: number; startDate?: string;
  endDate?: string; template?: { id: number; name: string }; createdAt: string;
}

interface Template { id: number; name: string; content: string; isActive: boolean; }
interface FreelancerOption { id: number; name: string; email: string; }

const statusBadge = (s: string) => {
  if (s === 'signed') return 'bg-green-100 text-green-700';
  if (s === 'sent') return 'bg-blue-100 text-blue-700';
  if (s === 'cancelled') return 'bg-red-100 text-red-700';
  return 'bg-yellow-100 text-yellow-700';
};

export default function AdminTenantContracts() {
  const { t, i18n } = useTranslation();

  const contractSchema = useMemo(() => z.object({
    templateId: z.number().min(1, t('contracts.selectTemplate')),
    freelancerUserId: z.number().min(1, t('contracts.selectFreelancer')),
    title: z.string().min(3, t('contracts.titleMinChars')),
    description: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    amount: z.string().optional(),
  }), [t]);

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [freelancers, setFreelancers] = useState<FreelancerOption[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Contract | null>(null);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [editForm, setEditForm] = useState({ title: '', startDate: '', endDate: '', amount: '' });
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
  });

  const load = async (p?: number) => {
    try {
      const params = new URLSearchParams({ page: String(p ?? page), limit: '20' });
      if (filterStatus) params.set('status', filterStatus);
      if (debouncedSearch) params.set('search', debouncedSearch);
      const [contractsRes, templatesRes, freelancersRes] = await Promise.all([
        api.get(`/admin-tenant/contracts?${params.toString()}`),
        api.get('/admin-tenant/templates'),
        api.get('/admin-tenant/freelancers'),
      ]);
      setContracts(contractsRes.data.data || []);
      setTotalPages(contractsRes.data.totalPages || 1);
      setTotal(contractsRes.data.total || 0);
      setTemplates((templatesRes.data || []).filter((tpl: Template) => tpl.isActive));
      setFreelancers((freelancersRes.data.data || []).map((f: any) => ({ id: f.id, name: f.name, email: f.email })));
    } catch { console.error('Error loading'); }
  };
  useEffect(() => { setPage(1); load(1); }, [filterStatus, debouncedSearch]);
  useEffect(() => { load(); }, [page]);

  const openCreate = () => {
    reset({ templateId: 0, freelancerUserId: 0, title: '', description: '', startDate: '', endDate: '', amount: '' });
    setError(''); setShowForm(true);
  };

  const handleCreate = async (data: ContractFormData) => {
    try {
      const fr = freelancers.find((f) => f.id === data.freelancerUserId);
      await api.post('/admin-tenant/contracts', {
        templateId: data.templateId,
        freelancerUserId: data.freelancerUserId,
        freelancerName: fr?.name,
        title: data.title,
        customData: data.description ? { description: data.description } : undefined,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        amount: data.amount ? Number(data.amount) : undefined,
      });
      setShowForm(false); load();
    } catch (err: any) {
      setError(err.response?.data?.message || t('error.save'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin-tenant/contracts/${deleteTarget.id}`);
      setDeleteTarget(null); load();
    } catch { setError(t('error.delete')); setDeleteTarget(null); }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.put(`/admin-tenant/contracts/${id}/status`, { status });
      setSelected(null); load();
    } catch { setError(t('error.updateStatus')); }
  };

  const openEdit = (c: Contract) => {
    setEditing(c);
    setEditForm({
      title: c.title,
      startDate: c.startDate || '',
      endDate: c.endDate || '',
      amount: c.amount ? String(c.amount) : '',
    });
    setError('');
  };

  const handleEdit = async () => {
    if (!editing) return;
    try {
      await api.put(`/admin-tenant/contracts/${editing.id}`, {
        title: editForm.title,
        startDate: editForm.startDate || undefined,
        endDate: editForm.endDate || undefined,
        amount: editForm.amount ? Number(editForm.amount) : undefined,
      });
      setEditing(null); load();
    } catch (err: any) {
      setError(err.response?.data?.message || t('error.save'));
    }
  };

  const handleExportCsv = async () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (debouncedSearch) params.set('search', debouncedSearch);
    const qs = params.toString();
    const res = await api.get(`/admin-tenant/export/contracts/csv${qs ? '?' + qs : ''}`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contracts.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('contracts.title')}</h1>
          <p className="text-sm text-gray-500">{total} {t('dashboard.contracts')}</p>
        </div>
        <button onClick={openCreate} className="bg-primary-500 text-white px-4 py-2.5 rounded-xl hover:bg-primary-600 transition text-sm font-medium shadow-md shadow-primary-200">
          + {t('contracts.newContract')}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" placeholder={t('contracts.searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={handleExportCsv}
          className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition text-sm font-medium shrink-0 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          CSV
        </button>
        {[
          { value: '', label: t('actions.all') },
          { value: 'draft', label: t('status.draft') },
          { value: 'sent', label: t('status.sent') },
          { value: 'signed', label: t('status.signed') },
          { value: 'cancelled', label: t('status.cancelled') },
        ].map((opt) => (
          <button key={opt.value} onClick={() => setFilterStatus(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterStatus === opt.value ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm border border-red-100">{error}</div>
      )}

      <div className="grid gap-3">
        {contracts.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition cursor-pointer" onClick={() => setSelected(c)}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-800 truncate">{c.title}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusBadge(c.status)}`}>{t(`status.${c.status}`)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  <span>{c.freelancerName || `Freelancer #${c.freelancerUserId}`}</span>
                  {c.amount && <span>${Number(c.amount).toFixed(2)}</span>}
                  <span>{new Date(c.createdAt).toLocaleDateString(i18n.language)}</span>
                </div>
              </div>
              <div className="flex gap-1 ml-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setSelected(c)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title={t('actions.view')}><HiOutlineEye className="w-4 h-4" /></button>
                {c.status === 'draft' && <button onClick={() => openEdit(c)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title={t('actions.edit')}><HiOutlinePencilSquare className="w-4 h-4" /></button>}
                <button onClick={() => downloadPdf(`/contracts/${c.id}/pdf`, `contract-${c.id}.pdf`)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="PDF">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                </button>
                <button onClick={() => setDeleteTarget(c)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title={t('actions.delete')}><HiOutlineTrash className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {contracts.length === 0 && <div className="text-center py-12 text-gray-400">{t('contracts.noContracts')}</div>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-40">
            <HiOutlineChevronLeft className="w-4 h-4" /> {t('pagination.previous')}
          </button>
          <span className="text-sm text-gray-500 font-medium">{t('pagination.pageOf', { page, total: totalPages })}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-40">
            {t('pagination.next')} <HiOutlineChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('contracts.newContract')}</h2>
            <form onSubmit={handleSubmit(handleCreate)} className="space-y-3">
              <div>
                <select {...register('templateId', { valueAsNumber: true })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white">
                  <option value={0}>{t('contracts.selectTemplate')}</option>
                  {templates.map((tpl) => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
                </select>
                {errors.templateId && <p className="text-xs text-red-500 mt-1">{errors.templateId.message}</p>}
              </div>
              <div>
                <select {...register('freelancerUserId', { valueAsNumber: true })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white">
                  <option value={0}>{t('contracts.selectFreelancer')}</option>
                  {freelancers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                {errors.freelancerUserId && <p className="text-xs text-red-500 mt-1">{errors.freelancerUserId.message}</p>}
              </div>
              <div>
                <input {...register('title')} placeholder={t('contracts.contractTitle')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
              </div>
              <input {...register('description')} placeholder={t('contracts.description')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" {...register('startDate')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
                <input type="date" {...register('endDate')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
              </div>
              <input type="number" {...register('amount')} placeholder={t('contracts.amountPlaceholder')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">{t('actions.cancel')}</button>
                <button type="submit" className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition shadow-md">{t('contracts.createContract')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selected.title}</h2>
                <p className="text-sm text-gray-500">{selected.freelancerName || `Freelancer #${selected.freelancerUserId}`}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadPdf(`/contracts/${selected.id}/pdf`, `contract-${selected.id}.pdf`)} className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition shadow-md flex items-center gap-2">
                  <HiOutlineDocumentText className="w-4 h-4" /> PDF
                </button>
                <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="border rounded-xl bg-white p-6 whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">{selected.content}</div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl shrink-0">
              {selected.status === 'draft' && (
                <>
                  <button onClick={() => handleStatusChange(selected.id, 'cancelled')} className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition">{t('actions.cancel')}</button>
                  <button onClick={() => handleStatusChange(selected.id, 'sent')} className="px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition shadow-md">{t('actions.send')}</button>
                  <button onClick={() => handleStatusChange(selected.id, 'signed')} className="px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition shadow-md">{t('contracts.signContract')}</button>
                </>
              )}
              {selected.status === 'sent' && (
                <button onClick={() => handleStatusChange(selected.id, 'signed')} className="px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition shadow-md">{t('contracts.signContract')}</button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal open={!!deleteTarget} title={t('contracts.deleteTitle')} message={t('contracts.deleteMessage', { name: deleteTarget?.title || '' })} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />

      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('actions.edit')} — {editing.title}</h2>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm border border-red-100">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('contracts.contractTitle')}</label>
                <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('contracts.startDate')}</label>
                  <input type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('contracts.endDate')}</label>
                  <input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('contracts.amount')}</label>
                <input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} placeholder="$"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditing(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">{t('actions.cancel')}</button>
                <button onClick={handleEdit} disabled={!editForm.title} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition shadow-md disabled:opacity-60">{t('actions.save')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
