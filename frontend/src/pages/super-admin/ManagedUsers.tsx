import { useState, useEffect, useCallback } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlineArrowPath, HiOutlineClipboardDocument, HiOutlineCheck } from 'react-icons/hi2';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../api/axios';
import { generatePassword, passwordStrength } from '../../utils/password';

interface ManagedUser {
  id: number; name: string; email: string; isActive: boolean; createdAt: string;
  role: { id: number; name: string };
}

export default function ManagedUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', roleId: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    const [u, r] = await Promise.all([api.get('/managed-users'), api.get('/custom-roles')]);
    setUsers(u.data.data);
    setRoles(r.data);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', password: generatePassword(), roleId: roles[0]?.id || 0 }); setError(''); setCopied(false); setShowForm(true); };
  const openEdit = (u: ManagedUser) => { setEditing(u); setForm({ name: u.name, email: u.email, password: '', roleId: u.role?.id || 0 }); setError(''); setCopied(false); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = editing
        ? { name: form.name, email: form.email, roleId: form.roleId, ...(form.password ? { password: form.password } : {}) }
        : form;
      if (editing) await api.put(`/managed-users/${editing.id}`, payload);
      else await api.post('/managed-users', payload);
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
      await api.delete(`/managed-users/${deleteTarget.id}`);
      setDeleteTarget(null);
      load();
    } catch {
      setError('Error al eliminar');
      setDeleteTarget(null);
    }
  };

  const toggleActive = async (u: ManagedUser) => {
    try {
      await api.put(`/managed-users/${u.id}`, { isActive: !u.isActive });
      load();
    } catch {
      setError('Error al cambiar estado');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Usuarios del sistema</h1>
        <button onClick={openCreate} className="bg-primary-500 text-white px-4 py-2 rounded-xl hover:bg-primary-600 transition text-sm font-medium shadow-md shadow-primary-200">
          + Nuevo usuario
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editing ? 'Editar usuario' : 'Nuevo usuario'}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{editing ? 'Actualiza los datos del usuario' : 'Crea un nuevo usuario del sistema'}</p>
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
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Información del usuario</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-400">*</span></label>
                      <input placeholder="Ej: Juan Pérez"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-400">*</span></label>
                      <input type="email" placeholder="usuario@ejemplo.com"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rol <span className="text-red-400">*</span></label>
                      <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                        value={form.roleId} onChange={(e) => setForm({ ...form, roleId: Number(e.target.value) })}>
                        <option value={0}>Selecciona un rol</option>
                        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 bg-gray-300 rounded-full"></div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contraseña</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {editing ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña'} <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'}
                          placeholder={editing ? 'Nueva contraseña' : 'Contraseña'}
                          className="w-full pr-24 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white font-mono"
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
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear usuario'}
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
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-xs">{u.role?.name}</span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(u)} className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(u)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Editar">
                    <HiOutlinePencilSquare className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(u)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Eliminar">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay usuarios del sistema</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar usuario"
        message={`¿Eliminar a "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
