import { useState, useEffect } from 'react';
import { HiOutlinePencilSquare } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

const countries = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba',
  'Ecuador', 'El Salvador', 'España', 'Estados Unidos', 'Guatemala', 'Honduras',
  'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'República Dominicana',
  'Uruguay', 'Venezuela', 'Canadá', 'Francia', 'Italia', 'Portugal', 'Reino Unido',
  'Alemania', 'Países Bajos', 'Suiza',
];

interface Profile {
  id: number; code?: string; name: string; email: string; phone?: string;
  country?: string; documentId?: string; yearsOfExperience?: number;
  skills?: string; bio?: string; createdAt: string;
  area?: { id: number; name: string };
  tenant?: { id: number; businessName: string };
}

interface Area { id: number; name: string; }

export default function FreelanceProfile() {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    phone: '', country: '', documentId: '', areaId: 0,
    yearsOfExperience: 0, skills: '', bio: '',
  });

  const load = async () => {
    try {
      const [pRes, aRes] = await Promise.all([
        api.get('/freelance/profile'),
        api.get('/freelance/areas'),
      ]);
      const p = pRes.data.profile;
      setProfile(p);
      setAreas(aRes.data || []);
      setForm({
        phone: p.phone || '', country: p.country || '', documentId: p.documentId || '',
        areaId: p.area?.id || 0, yearsOfExperience: p.yearsOfExperience || 0,
        skills: p.skills || '', bio: p.bio || '',
      });
    } catch { setError(t('error.loading')); }
  };

  useEffect(() => { load(); }, []);

  const startEdit = () => { setEditing(true); setError(''); setSuccess(''); };
  const cancelEdit = () => {
    if (profile) {
      setForm({
        phone: profile.phone || '', country: profile.country || '', documentId: profile.documentId || '',
        areaId: profile.area?.id || 0, yearsOfExperience: profile.yearsOfExperience || 0,
        skills: profile.skills || '', bio: profile.bio || '',
      });
    }
    setEditing(false); setError('');
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const { data } = await api.put('/freelance/profile', {
        phone: form.phone || undefined,
        country: form.country || undefined,
        documentId: form.documentId || undefined,
        areaId: form.areaId || undefined,
        yearsOfExperience: form.yearsOfExperience || undefined,
        skills: form.skills || undefined,
        bio: form.bio || undefined,
      });
      setProfile(data.profile);
      setEditing(false);
      setSuccess(t('profile.updated'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('error.save'));
    } finally { setSaving(false); }
  };

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

  if (!profile) return <div className="text-primary-500 py-12 text-center">{t('profile.loadingProfile')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('profile.title')}</h1>
          <p className="text-sm text-gray-500">{t('profile.subtitle')}</p>
        </div>
        {!editing && (
          <button onClick={startEdit} className="bg-primary-500 text-white px-4 py-2.5 rounded-xl hover:bg-primary-600 transition text-sm font-medium shadow-md shadow-primary-200 flex items-center gap-2">
            <HiOutlinePencilSquare className="w-4 h-4" /> {t('profile.editProfile')}
          </button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-xl mb-4 text-sm border border-green-100">{success}</div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm border border-red-100">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-primary-600">{profile.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{profile.name}</h2>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            {profile.code && (
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('profile.code')}</span>
                <p className="text-primary-600 font-mono font-bold text-lg mt-0.5">{profile.code}</p>
              </div>
            )}
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('profile.role')}</span>
              <p className="text-gray-800 font-medium mt-0.5">{t('roles.freelance')}</p>
            </div>
            {profile.tenant && (
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('adminTenants.tenant')}</span>
                <p className="text-gray-800 font-medium mt-0.5">{profile.tenant.businessName}</p>
              </div>
            )}
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('profile.memberSince')}</span>
              <p className="text-gray-800 mt-0.5">{new Date(profile.createdAt).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-5">{t('profile.personalInfo')}</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('freelancers.phone')}</label>
                {editing ? (
                  <input placeholder={t('freelancers.phonePlaceholder')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                ) : (
                  <p className="text-gray-800 py-2.5">{profile.phone || '—'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('freelancers.country')}</label>
                {editing ? (
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                    value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                    <option value="">{t('freelancers.selectCountry')}</option>
                    {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <p className="text-gray-800 py-2.5">{profile.country || '—'}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('freelancers.documentId')}</label>
              {editing ? (
                <input placeholder={t('freelancers.documentPlaceholder')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                  value={form.documentId} onChange={(e) => setForm({ ...form, documentId: e.target.value })} />
              ) : (
                <p className="text-gray-800 py-2.5">{profile.documentId || '—'}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('freelancers.area')}</label>
                {editing ? (
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                    value={form.areaId} onChange={(e) => setForm({ ...form, areaId: Number(e.target.value) })}>
                    <option value={0}>{t('freelancers.selectArea')}</option>
                    {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                ) : (
                  <p className="text-gray-800 py-2.5">{profile.area?.name || '—'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('freelancers.experience')}</label>
                {editing ? (
                  <input type="number" min="0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                    value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: Number(e.target.value) })} />
                ) : (
                  <p className="text-gray-800 py-2.5">{profile.yearsOfExperience ?? '—'}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('freelancers.skills')}</label>
              {editing ? (
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
              ) : (
                <div className="flex flex-wrap gap-1.5 py-2">
                  {profile.skills ? profile.skills.split(',').map((s) => s.trim()).filter(Boolean).map((s) => (
                    <span key={s} className="bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-primary-200">{s}</span>
                  )) : <span className="text-gray-400 text-sm">—</span>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('freelancers.bio')}</label>
              {editing ? (
                <textarea rows={3} placeholder={t('profile.bioPlaceholder')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white resize-none"
                  value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              ) : (
                <p className="text-gray-800 py-2.5 whitespace-pre-wrap">{profile.bio || '—'}</p>
              )}
            </div>
          </div>

          {editing && (
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
              <button onClick={cancelEdit} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">{t('actions.cancel')}</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition disabled:opacity-60 shadow-md shadow-primary-200 flex items-center gap-2">
                {saving && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                {saving ? t('actions.saving') : t('freelancers.saveChanges')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
