import { useState, useEffect } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../api/axios';

interface Tenant {
  id: number; logo?: string; taxId?: string; businessName: string; name: string;
  country?: string; baseCurrency?: string; status: string;
  email: string; phone?: string; address?: string; createdAt: string;
  adminTenantsCount?: number; freelancersCount?: number;
}

const currencies = ['USD', 'EUR', 'MXN', 'COP', 'ARS', 'BRL', 'GBP', 'PEN', 'CLP'];

const countries = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba',
  'Ecuador', 'El Salvador', 'España', 'Estados Unidos', 'Guatemala', 'Honduras',
  'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'República Dominicana',
  'Uruguay', 'Venezuela',
];

export default function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState({
    logo: '', taxId: '', businessName: '', name: '', country: '', baseCurrency: 'USD', status: 'active',
    email: '', phone: '', address: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, logo: reader.result as string });
    reader.readAsDataURL(file);
  };

  const load = () => api.get('/tenants').then((r) => setTenants(r.data.data));
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ logo: '', taxId: '', businessName: '', name: '', country: '', baseCurrency: 'USD', status: 'active', email: '', phone: '', address: '' });
    setError(''); setShowForm(true);
  };
  const openEdit = (t: Tenant) => {
    setEditing(t);
    setForm({
      logo: t.logo || '', taxId: t.taxId || '', businessName: t.businessName, name: t.name,
      country: t.country || '', baseCurrency: t.baseCurrency || 'USD', status: t.status || 'active',
      email: t.email, phone: t.phone || '', address: t.address || '',
    });
    setError(''); setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing) await api.put(`/tenants/${editing.id}`, form);
      else await api.post('/tenants', form);
      setShowForm(false); setEditing(null); load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/tenants/${deleteTarget.id}`);
      setDeleteTarget(null);
      load();
    } catch {
      setError('Error al eliminar');
      setDeleteTarget(null);
    }
  };

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !search || t.name.toLowerCase().includes(q) || t.businessName.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || (t.taxId && t.taxId.toLowerCase().includes(q));
    const matchCountry = !filterCountry || t.country === filterCountry;
    const matchStatus = !filterStatus || t.status === filterStatus;
    return matchSearch && matchCountry && matchStatus;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Tenants</h1>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" placeholder="Buscar por nombre, razón social o email..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white min-w-[140px]"
          value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
          <option value="">Todos los países</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white min-w-[130px]"
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
        {(search || filterCountry || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterCountry(''); setFilterStatus(''); }}
            className="text-xs text-gray-500 hover:text-primary-500 transition font-medium px-2">
            Limpiar
          </button>
        )}
        <button onClick={openCreate} className="ml-auto bg-primary-500 text-white px-4 py-2.5 rounded-xl hover:bg-primary-600 transition text-sm font-medium shadow-md shadow-primary-200 shrink-0">
          + Nuevo tenant
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editing ? 'Editar tenant' : 'Nuevo tenant'}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{editing ? 'Actualiza los datos del tenant' : 'Registra un nuevo tenant en el sistema'}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-xl mb-5 text-sm border border-red-100">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 bg-primary-500 rounded-full"></div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Identidad del tenant</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logotipo</label>
                      <div className="flex items-center gap-4">
                        <label className="relative cursor-pointer group">
                          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-gray-200 group-hover:ring-primary-300 transition">
                            {form.logo ? (
                              <img src={form.logo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-6 h-6 text-gray-400 group-hover:text-primary-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                              </svg>
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-xl transition"></div>
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </label>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Subir imagen</p>
                          <p className="text-xs text-gray-400 mt-0.5">PNG, JPG hasta 2MB</p>
                          {form.logo && (
                            <button type="button" onClick={() => setForm({ ...form, logo: '' })}
                              className="text-xs text-red-500 hover:text-red-600 mt-1 font-medium">
                              Eliminar logo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">RUC / Tax ID</label>
                        <input placeholder="Ej: 123456789-1"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                          value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social <span className="text-red-400">*</span></label>
                        <input placeholder="Ej: Spectra Corp S.A."
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                          value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial <span className="text-red-400">*</span></label>
                        <input placeholder="Ej: Spectra"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                        <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                          value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                          <option value="">Seleccionar país</option>
                          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Moneda Base</label>
                        <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                          value={form.baseCurrency} onChange={(e) => setForm({ ...form, baseCurrency: e.target.value })}>
                          {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <div className="flex gap-3">
                        {['active', 'inactive'].map((s) => (
                          <button key={s} type="button" onClick={() => setForm({ ...form, status: s })}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
                              form.status === s
                                ? s === 'active'
                                  ? 'bg-green-50 border-green-300 text-green-700'
                                  : 'bg-red-50 border-red-300 text-red-700'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-gray-50'
                            }`}>
                            {s === 'active' ? 'Activo' : 'Inactivo'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 bg-gray-300 rounded-full"></div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contacto</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-400">*</span></label>
                      <input type="email" placeholder="contacto@tenant.com"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input placeholder="+52 555 123 4567"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                          value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                        <input placeholder="Calle y número"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                          value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)}
                className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-white hover:border-gray-300 transition">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition disabled:opacity-60 shadow-lg shadow-primary-200 flex items-center gap-2">
                {saving && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear tenant'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Nombre Comercial</th>
              <th className="px-4 py-3">País</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Free</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">{String(i + 1).padStart(2, '0')}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
                <td className="px-4 py-3 text-gray-600">{t.country || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {t.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{t.adminTenantsCount ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{t.freelancersCount ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(t)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Editar">
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(t)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Eliminar">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No hay tenants registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar tenant"
        message={`¿Eliminar a "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
