import { useState, useEffect, useCallback, useRef } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlineArrowPath, HiOutlineClipboardDocument, HiOutlineCheck, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../api/axios';
import { generatePassword, passwordStrength } from '../../utils/password';

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
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', tenantId: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminTenant | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const tenantDropdownRef = useRef<HTMLDivElement>(null);

  const handleGenerate = useCallback(() => {
    setForm((prev) => ({ ...prev, password: generatePassword() }));
    setCopied(false);
  }, []);

  const handleCopy = async () => {
    if (form.password) {
      await navigator.clipboard.writeText(form.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
    setForm({ name: '', email: '', password: generatePassword(), phone: '', tenantId: 0 });
    setError(''); setCopied(false); setShowForm(true);
  };

  const openEdit = (a: AdminTenant) => {
    setEditing(a);
    setForm({ name: a.name, email: a.email, password: '', phone: a.phone || '', tenantId: a.tenant?.id || 0 });
    setError(''); setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = { name: form.name, email: form.email, phone: form.phone || undefined, tenantId: form.tenantId || undefined };
      if (editing) {
        await api.put(`/super-admin/admin-tenants/${editing.id}`, { ...payload, ...(form.password ? { password: form.password } : {}) });
      } else {
        await api.post('/super-admin/admin-tenants', { ...payload, password: form.password });
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Tenants</h1>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button onClick={openCreate} className="ml-auto bg-primary-500 text-white px-4 py-2.5 rounded-xl hover:bg-primary-600 transition text-sm font-medium shadow-md shadow-primary-200 shrink-0">
          + Nuevo admin
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{editing ? 'Editar admin tenant' : 'Nuevo admin tenant'}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{editing ? 'Actualiza los datos del administrador' : 'Registra un nuevo administrador de tenant'}</p>
                </div>
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
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contraseña</span>
                  </div>
                  <div>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        <input type={showPassword ? 'text' : 'password'} placeholder={editing ? 'Dejar vacío' : '••••••••'}
                          className="w-full pl-9 pr-24 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white font-mono"
                          value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); setCopied(false); }} />
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-0.5">
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition" title={showPassword ? 'Ocultar' : 'Mostrar'}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              {showPassword
                                ? <><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></>
                                : <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                              }
                            </svg>
                          </button>
                          <button type="button" onClick={handleGenerate}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Generar contraseña">
                            <HiOutlineArrowPath className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={handleCopy}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Copiar">
                            {copied ? <HiOutlineCheck className="w-4 h-4 text-green-500" /> : <HiOutlineClipboardDocument className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      {form.password && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength(form.password).color} ${passwordStrength(form.password).width}`}></div>
                            </div>
                            <span className={`text-[11px] font-medium ${passwordStrength(form.password).textColor}`}>{passwordStrength(form.password).label}</span>
                          </div>
                        </div>
                      )}
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
            {admins.map((a) => (
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
            {admins.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay admin tenants registrados</td></tr>
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
