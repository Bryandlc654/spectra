import { useState, useEffect } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineEye } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../api/axios';
import { useDebounce } from '../../hooks/useDebounce';

const countries = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba',
  'Ecuador', 'El Salvador', 'España', 'Estados Unidos', 'Guatemala', 'Honduras',
  'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'República Dominicana',
  'Uruguay', 'Venezuela', 'Canadá', 'Francia', 'Italia', 'Portugal', 'Reino Unido',
  'Alemania', 'Países Bajos', 'Suiza',
];

interface Freelancer {
  id: number; code?: string; name: string; email: string; phone?: string; country?: string;
  documentId?: string; yearsOfExperience?: number; skills?: string; bio?: string;
  isActive: boolean; createdAt: string;
  area?: { id: number; name: string };
}

interface Area { id: number; name: string; }

export default function AdminTenantFreelancers() {
  const { t } = useTranslation();
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Freelancer | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', country: '', documentId: '', areaId: 0, yearsOfExperience: 0, skills: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Freelancer | null>(null);
  const [viewing, setViewing] = useState<Freelancer | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [skillInput, setSkillInput] = useState('');

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    const current = form.skills ? form.skills.split(',').map((x) => x.trim()).filter(Boolean) : [];
    if (!current.includes(s)) { current.push(s); setForm({ ...form, skills: current.join(', ') }); }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    const current = form.skills ? form.skills.split(',').map((x) => x.trim()).filter(Boolean) : [];
    setForm({ ...form, skills: current.filter((s) => s !== skill).join(', ') });
  };

  const load = async (q?: string, p?: number) => {
    const params = new URLSearchParams({ page: String(p ?? page), limit: '20' });
    if (q) params.set('search', q);
    const [f, a] = await Promise.all([
      api.get(`/admin-tenant/freelancers?${params.toString()}`),
      api.get('/admin-tenant/areas'),
    ]);
    setFreelancers(f.data.data || []);
    setTotalPages(f.data.totalPages || 1);
    setTotal(f.data.total || 0);
    setAreas(a.data || []);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); load(debouncedSearch, 1); }, [debouncedSearch]);
  useEffect(() => { load(debouncedSearch); }, [page]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', country: '', documentId: '', areaId: 0, yearsOfExperience: 0, skills: '', bio: '' });
    setShowForm(true);
  };

  const openEdit = (f: Freelancer) => {
    setEditing(f);
    setForm({
      name: f.name, email: f.email, phone: f.phone || '', country: f.country || '',
      documentId: f.documentId || '', areaId: f.area?.id || 0,
      yearsOfExperience: f.yearsOfExperience || 0, skills: f.skills || '', bio: f.bio || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name, email: form.email, phone: form.phone || undefined,
        country: form.country || undefined, documentId: form.documentId || undefined,
        areaId: form.areaId || undefined, yearsOfExperience: form.yearsOfExperience || undefined,
        skills: form.skills || undefined, bio: form.bio || undefined,
      };
      if (editing) {
        await api.put(`/admin-tenant/freelancers/${editing.id}`, payload);
        toast.success(t('freelancers.updated') || 'Freelancer actualizado');
      } else {
        await api.post('/admin-tenant/freelancers', payload);
        toast.success(t('freelancers.created') || 'Freelancer creado');
      }
      setShowForm(false); setEditing(null); load();
    } catch (err: any) {
      const msg = err.response?.data?.message || t('error.save');
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin-tenant/freelancers/${deleteTarget.id}`);
      toast.success(t('freelancers.deleted') || 'Freelancer eliminado');
      setDeleteTarget(null); load();
    } catch (err: any) {
      const msg = err.response?.data?.message || t('error.delete');
      toast.error(msg);
      setDeleteTarget(null);
    }
  };

  const handleToggleStatus = async (f: Freelancer) => {
    try {
      await api.put(`/admin-tenant/freelancers/${f.id}/toggle-status`);
      load();
    } catch (err: any) {
      const msg = err.response?.data?.message || t('error.toggleStatus');
      toast.error(msg);
    }
  };

  const handleExportCsv = async () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    const qs = params.toString();
    const res = await api.get(`/admin-tenant/export/freelancers/csv${qs ? '?' + qs : ''}`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'freelancers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('freelancers.title')}</h1>
          <p className="text-sm text-gray-500">{total} {t('dashboard.freelancers')}</p>
        </div>
        <button onClick={handleExportCsv}
          className="bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition text-sm font-medium shrink-0 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {t('actions.exportCsv')}
        </button>
      </div>

      <div className="mb-5">
        <input type="text" placeholder={t('freelancers.searchPlaceholder')}
          className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 shrink-0">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900">{editing ? t('freelancers.editFreelancer') : t('freelancers.newFreelancer')}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{editing ? t('freelancers.editSubtitle') : t('freelancers.inviteHint')}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('freelancers.fullName')} <span className="text-red-400">*</span></label>
                    <input placeholder={t('freelancers.fullName')}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('freelancers.email')} <span className="text-red-400">*</span></label>
                    <input type="email" placeholder="freelancer@email.com"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                      value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('freelancers.documentId')}</label>
                    <input placeholder={t('freelancers.documentPlaceholder')}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                      value={form.documentId} onChange={(e) => setForm({ ...form, documentId: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('freelancers.country')}</label>
                    <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                      value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                      <option value="">{t('freelancers.selectCountry')}</option>
                      {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('freelancers.phone')}</label>
                    <input placeholder={t('freelancers.phonePlaceholder')}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                      value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('freelancers.area')}</label>
                    <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                      value={form.areaId} onChange={(e) => setForm({ ...form, areaId: Number(e.target.value) })}>
                      <option value={0}>{t('freelancers.selectArea')}</option>
                      {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('freelancers.experience')}</label>
                    <input type="number" min="0" placeholder="0"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                      value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('freelancers.skills')}</label>
                  <div className="border border-gray-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition overflow-hidden">
                    <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2.5 min-h-[42px]">
                      {form.skills ? form.skills.split(',').map((s) => s.trim()).filter(Boolean).map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-primary-200">
                          {s}
                          <button type="button" onClick={() => removeSkill(s)} className="w-4 h-4 flex items-center justify-center rounded-full text-primary-400 hover:text-red-500 transition">×</button>
                        </span>
                      )) : <span className="text-xs text-gray-300 py-0.5">{t('freelancers.skillsPlaceholder')}</span>}
                    </div>
                    <div className="flex items-center border-t border-gray-100 bg-gray-50/50">
                      <input placeholder={t('freelancers.skillInputPlaceholder')}
                        className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
                        value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } if (e.key === ',' && skillInput.trim()) { e.preventDefault(); addSkill(); } }} />
                      <button type="button" onClick={addSkill} className="mr-1.5 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600 transition shrink-0">+ {t('freelancers.add')}</button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('freelancers.bio')}</label>
                  <textarea rows={3} placeholder={t('freelancers.bioPlaceholder')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white resize-none"
                    value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-white transition text-center">{t('actions.cancel')}</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.email}
                className="px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition disabled:opacity-60 shadow-lg shadow-primary-200 flex items-center justify-center gap-2">
                {saving && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                {saving ? t('actions.saving') : editing ? t('freelancers.saveChanges') : t('freelancers.createBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-3">{t('freelancers.code')}</th>
              <th className="px-4 py-3">{t('freelancers.name')}</th>
              <th className="px-4 py-3">{t('adminTenants.email')}</th>
              <th className="px-4 py-3">{t('freelancers.area_label')}</th>
              <th className="px-4 py-3">{t('freelancers.country')}</th>
              <th className="px-4 py-3">{t('status.active')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {freelancers.map((f) => (
              <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 text-primary-600 font-mono font-bold text-xs">{f.code || '—'}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{f.name}</td>
                <td className="px-4 py-3 text-gray-600">{f.email}</td>
                <td className="px-4 py-3">
                  {f.area ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">{f.area.name}</span> : <span className="text-gray-400 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{f.country || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${f.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {f.isActive ? t('status.active') : t('status.inactive')}
                  </span>
                </td>
                <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button onClick={() => setViewing(f)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition" title={t('actions.view')}>
                  <HiOutlineEye className="w-4 h-4" />
                </button>
              </div>
            </td>
              </tr>
            ))}
            {freelancers.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">{t('freelancers.noneRegistered')}</td></tr>
            )}
          </tbody>
        </table>
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

      <ConfirmModal
        open={!!deleteTarget}
        title={t('freelancers.deleteTitle')}
        message={t('freelancers.deleteMessage', { name: deleteTarget?.name || '' })}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {viewing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{viewing.name}</h2>
                <p className="text-sm text-gray-500">{viewing.email}</p>
              </div>
              <button onClick={() => setViewing(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('freelancers.code')}</p>
                  <p className="font-mono font-bold text-primary-600">{viewing.code || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('status.active')}</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${viewing.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {viewing.isActive ? t('status.active') : t('status.inactive')}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('freelancers.documentId')}</p>
                  <p className="text-gray-800 text-sm">{viewing.documentId || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('freelancers.country')}</p>
                  <p className="text-gray-800 text-sm">{viewing.country || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('freelancers.phone')}</p>
                  <p className="text-gray-800 text-sm">{viewing.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('freelancers.area_label')}</p>
                  {viewing.area ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">{viewing.area.name}</span> : <span className="text-gray-400 text-xs">—</span>}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('freelancers.experience')}</p>
                <p className="text-gray-800 text-sm">{viewing.yearsOfExperience ? `${viewing.yearsOfExperience} ${t('freelancers.years')}` : '—'}</p>
              </div>
              {viewing.skills && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('freelancers.skills')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewing.skills.split(',').map((s) => s.trim()).filter(Boolean).map((s) => (
                      <span key={s} className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg text-xs font-medium border border-primary-200">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {viewing.bio && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('freelancers.bio')}</p>
                  <p className="text-gray-800 text-sm whitespace-pre-wrap">{viewing.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
