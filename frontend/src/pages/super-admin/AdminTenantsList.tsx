import { useState, useEffect, useRef } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../api/axios';

interface AdminTenant {
  id: number; name: string; email: string; phone?: string; createdAt: string;
  tenant?: { id: number; taxId?: string; businessName: string; name: string; country?: string; baseCurrency?: string; status: string };
}

interface Tenant {
  id: number; businessName: string; name: string;
}

export default function AdminTenantsList() {
  const [admins, setAdmins] = useState<AdminTenant[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminTenant | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', tenantId: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminTenant | null>(null);
  const [search, setSearch] = useState('');
  const [filterTenantId, setFilterTenantId] = useState(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const tenantDropdownRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const [a, t] = await Promise.all([
      api.get('/super-admin/admin-tenants'),
      api.get('/tenants'),
    ]);
    setAdmins(a.data.data);
    setTenants(t.data.data);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tenantDropdownRef.current && !tenantDropdownRef.current.contains(e.target as Node)) {
        setTenantDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', tenantId: 0 });
    setError(''); setShowForm(true);
  };

  const openEdit = (a: AdminTenant) => {
    setEditing(a);
    setForm({ name: a.name, email: a.email, phone: a.phone || '', tenantId: a.tenant?.id || 0 });
    setError(''); setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = { name: form.name, email: form.email, phone: form.phone || undefined, tenantId: form.tenantId || undefined };
      if (editing) {
        await api.put(`/super-admin/admin-tenants/${editing.id}`, payload);
      } else {
        await api.post('/super-admin/admin-tenants', payload);
      }
      setShowForm(false); setEditing(null); load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/super-admin/admin-tenants/${deleteTarget.id}`);
      setDeleteTarget(null); load();
    } catch { setError('Error al eliminar'); setDeleteTarget(null); }
  };

  const selectedTenant = tenants.find((t) => t.id === form.tenantId);
  const filteredTenants = tenants.filter((t) =>
    t.businessName.toLowerCase().includes(tenantSearch.toLowerCase()) ||
    t.name.toLowerCase().includes(tenantSearch.toLowerCase())
  );

  const displayedAdmins = admins.filter((a) => {
    if (search) {
      const q = search.toLowerCase();
      if (!a.name.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q)) return false;
    }
    if (filterTenantId) {
      if (a.tenant?.id !== filterTenantId) return false;
    }
    if (filterStatus !== 'all') {
      if (!a.tenant) return false;
      if (filterStatus === 'active' && a.tenant.status !== 'active') return false;
      if (filterStatus === 'inactive' && a.tenant.status !== 'inactive') return false;
    }
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Tenants</h1>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre o email..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={filterTenantId} onChange={(e) => setFilterTenantId(+e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white text-gray-700">
          <option value={0}>Todos los tenants</option>
          {tenants.map((t) => <option key={t.id} value={t.id}>{t.businessName}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white text-gray-700">
          <option value="all">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
        <button onClick={openCreate} className="bg-primary-500 text-white px-4 py-2.5 rounded-xl hover:bg-primary-600 transition text-sm font-medium shadow-md shadow-primary-200 shrink-0">
          + Nuevo admin
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">{editing ? 'Editar admin tenant' : 'Nuevo admin tenant'}</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{editing ? 'Actualiza los datos del administrador' : 'Registra un nuevo administrador de tenant'}</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-xl mb-5 text-sm border border-red-100">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 bg-primary-500 rounded-full"></div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Datos del administrador</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        <input placeholder="Nombre del administrador"
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                        <input type="email" placeholder="admin@tenant.com"
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                        <input placeholder="+52 555 123 4567"
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                          value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 bg-gray-300 rounded-full"></div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Asignación de tenant</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar tenant</label>
                    <div className="relative" ref={tenantDropdownRef}>
                      <button type="button" onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-left focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white flex items-center justify-between">
                        <span className={selectedTenant ? 'text-gray-800' : 'text-gray-400'}>
                          {selectedTenant ? `${selectedTenant.businessName} (${selectedTenant.name})` : 'Sin tenant asignado'}
                        </span>
                        <svg className={`w-4 h-4 text-gray-400 transition ${tenantDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {tenantDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-hidden">
                          <div className="p-2 border-b border-gray-100">
                            <div className="relative">
                              <HiOutlineMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input type="text" placeholder="Buscar tenant..."
                                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-500"
                                value={tenantSearch} onChange={(e) => setTenantSearch(e.target.value)}
                                autoFocus />
                            </div>
                          </div>
                          <div className="overflow-y-auto max-h-48">
                            <button type="button"
                              onClick={() => { setForm({ ...form, tenantId: 0 }); setTenantDropdownOpen(false); setTenantSearch(''); }}
                              className={`w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition ${form.tenantId === 0 ? 'bg-primary-50 text-primary-700' : 'text-gray-500'}`}>
                              Sin tenant asignado
                            </button>
                            {filteredTenants.map((t) => (
                              <button key={t.id} type="button"
                                onClick={() => { setForm({ ...form, tenantId: t.id }); setTenantDropdownOpen(false); setTenantSearch(''); }}
                                className={`w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition ${form.tenantId === t.id ? 'bg-primary-50 text-primary-700' : 'text-gray-700'}`}>
                                <p className="font-medium">{t.businessName}</p>
                                <p className="text-xs text-gray-400">{t.name}</p>
                              </button>
                            ))}
                            {filteredTenants.length === 0 && (
                              <div className="px-4 py-3 text-sm text-gray-400 text-center">No se encontraron tenants</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {selectedTenant && (
                      <div className="mt-2 flex items-center gap-2 text-xs bg-primary-50 text-primary-700 px-3 py-2 rounded-lg border border-primary-100">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Asignado a <strong>{selectedTenant.businessName}</strong></span>
                      </div>
                    )}
                    {!selectedTenant && form.tenantId === 0 && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        El administrador quedará sin tenant asignado
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl shrink-0">
              <button onClick={() => setShowForm(false)}
                className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-white hover:border-gray-300 transition">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition disabled:opacity-60 shadow-lg shadow-primary-200 flex items-center justify-center gap-2">
                {saving && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {displayedAdmins.map((a) => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-800">{a.name}</td>
                <td className="px-4 py-3 text-gray-600">{a.email}</td>
                <td className="px-4 py-3 text-gray-600">{a.phone || '—'}</td>
                <td className="px-4 py-3">
                  {a.tenant ? (
                    <div>
                      <span className="font-medium text-gray-800 text-xs">{a.tenant.businessName}</span>
                      <span className="text-gray-400 text-xs block">{a.tenant.name} {a.tenant.taxId && `· ${a.tenant.taxId}`}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Sin tenant</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {a.tenant && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {a.tenant.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(a)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Editar">
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(a)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Eliminar">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {displayedAdmins.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                {admins.length === 0 ? 'No hay admin tenants registrados' : 'No se encontraron resultados con esos filtros'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar admin tenant"
        message={`¿Eliminar a "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
