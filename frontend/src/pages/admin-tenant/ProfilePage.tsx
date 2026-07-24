import { useState, useEffect } from 'react';
import { HiOutlineUser, HiOutlineBuildingOffice2, HiOutlineKey } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

interface Profile {
  id: number; name: string; email: string; phone?: string; role: string; createdAt: string;
  tenant?: { id: number; name: string; businessName?: string; taxId?: string; country?: string; baseCurrency?: string; email?: string; phone?: string; address?: string; status?: string };
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [error, setError] = useState('');
  const [pwError, setPwError] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/admin-tenant/profile');
      setProfile(res.data);
      setForm({ name: res.data.name, phone: res.data.phone || '' });
    } catch { setError('Error loading profile'); }
  };
  useEffect(() => { load(); }, []);

  const handleSaveProfile = async () => {
    setSaving(true); setError(''); setMsg('');
    try {
      await api.put('/admin-tenant/profile', { name: form.name, phone: form.phone || undefined });
      setMsg(t('actions.save') + ' ✓');
      setEditMode(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError(t('profile.passwordMismatch'));
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError(t('profile.passwordMinLength'));
      return;
    }
    setPwSaving(true); setPwError(''); setPwMsg('');
    try {
      await api.put('/admin-tenant/profile/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg(t('profile.passwordChanged'));
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Error');
    } finally { setPwSaving(false); }
  };

  if (!profile) return <div className="text-primary-500 py-12 text-center">{t('loading')}</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">{t('profile.title')}</h1>
      <p className="text-gray-500 mb-6">{t('profile.editProfile')}</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <HiOutlineUser className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{profile.name}</h2>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>

        {msg && <div className="bg-green-50 text-green-600 p-3 rounded-xl mb-4 text-sm border border-green-100">{msg}</div>}
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm border border-red-100">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('freelancers.fullName')}</label>
            {editMode ? (
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
            ) : (
              <p className="text-gray-800 text-sm py-2.5">{profile.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminTenants.email')}</label>
            <p className="text-gray-800 text-sm py-2.5">{profile.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminTenants.phone')}</label>
            {editMode ? (
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+52 555 123 4567"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
            ) : (
              <p className="text-gray-800 text-sm py-2.5">{profile.phone || '—'}</p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            {editMode ? (
              <>
                <button onClick={() => { setEditMode(false); setForm({ name: profile.name, phone: profile.phone || '' }); setError(''); }}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">{t('actions.cancel')}</button>
                <button onClick={handleSaveProfile} disabled={saving || !form.name}
                  className="px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition shadow-md disabled:opacity-60 flex items-center gap-2">
                  {saving && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  {t('profile.saveProfile')}
                </button>
              </>
            ) : (
              <button onClick={() => setEditMode(true)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                {t('profile.editProfile')}
              </button>
            )}
          </div>
        </div>
      </div>

      {profile.tenant && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <HiOutlineBuildingOffice2 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">{t('adminTenants.tenant')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('adminTenants.name')}</p>
              <p className="text-gray-800 text-sm">{profile.tenant.name}</p>
            </div>
            {profile.tenant.businessName && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('freelancers.fullName')}</p>
                <p className="text-gray-800 text-sm">{profile.tenant.businessName}</p>
              </div>
            )}
            {profile.tenant.taxId && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('profile.taxId')}</p>
                <p className="text-gray-800 text-sm">{profile.tenant.taxId}</p>
              </div>
            )}
            {profile.tenant.country && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('freelancers.country')}</p>
                <p className="text-gray-800 text-sm">{profile.tenant.country}</p>
              </div>
            )}
            {profile.tenant.baseCurrency && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('profile.currency')}</p>
                <p className="text-gray-800 text-sm">{profile.tenant.baseCurrency}</p>
              </div>
            )}
            {profile.tenant.email && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('adminTenants.email')}</p>
                <p className="text-gray-800 text-sm">{profile.tenant.email}</p>
              </div>
            )}
            {profile.tenant.phone && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('adminTenants.phone')}</p>
                <p className="text-gray-800 text-sm">{profile.tenant.phone}</p>
              </div>
            )}
            {profile.tenant.address && (
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('profile.address')}</p>
                <p className="text-gray-800 text-sm">{profile.tenant.address}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
            <HiOutlineKey className="w-5 h-5 text-yellow-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">{t('profile.changePassword')}</h2>
        </div>

        {pwMsg && <div className="bg-green-50 text-green-600 p-3 rounded-xl mb-4 text-sm border border-green-100">{pwMsg}</div>}
        {pwError && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm border border-red-100">{pwError}</div>}

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.currentPassword')}</label>
            <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.newPassword')}</label>
            <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.confirmPassword')}</label>
            <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
          </div>
          <button onClick={handleChangePassword} disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword}
            className="px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition shadow-md disabled:opacity-60 flex items-center gap-2">
            {pwSaving && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            {t('profile.changePassword')}
          </button>
        </div>
      </div>
    </div>
  );
}
