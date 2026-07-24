import { useState, useEffect } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../api/axios';

interface ModuleInfo {
  key: string; label: string; description?: string; superAdmin?: boolean;
}

interface Role {
  id: number; name: string; description?: string;
  permissions: { id: number; moduleKey: string; canAccess: boolean }[];
}

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; permissions: Record<string, boolean> }>({
    name: '', description: '', permissions: {},
  });

  useEffect(() => {
    Promise.all([
      api.get('/custom-roles').then((r) => setRoles(r.data.data || r.data)),
      api.get('/modules').then((r) => setModules(r.data)),
    ]);
  }, []);

  const filteredModules = modules.filter((m) => !m.superAdmin);
  const moduleKeys = filteredModules.map((m) => m.key);

  const openCreate = () => {
    setEditing(null);
    setError('');
    const perms: Record<string, boolean> = {};
    moduleKeys.forEach((k) => { perms[k] = false; });
    setForm({ name: '', description: '', permissions: perms });
    setShowForm(true);
  };

  const openEdit = (r: Role) => {
    setEditing(r);
    setError('');
    const perms: Record<string, boolean> = {};
    moduleKeys.forEach((k) => {
      const found = r.permissions.find((p) => p.moduleKey === k);
      perms[k] = found ? found.canAccess : false;
    });
    setForm({ name: r.name, description: r.description || '', permissions: perms });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        permissions: Object.entries(form.permissions)
          .filter(([, v]) => v)
          .map(([moduleKey]) => ({ moduleKey, canAccess: true })),
      };
      if (editing) await api.put(`/custom-roles/${editing.id}`, payload);
      else await api.post('/custom-roles', payload);
      setShowForm(false); setEditing(null);
      api.get('/custom-roles').then((r) => setRoles(r.data.data || r.data));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/custom-roles/${deleteTarget.id}`);
      setDeleteTarget(null);
      api.get('/custom-roles').then((r) => setRoles(r.data.data || r.data));
    } catch {
      setError('Error al eliminar');
      setDeleteTarget(null);
    }
  };

  const moduleLabel = (key: string) => {
    const m = modules.find((m) => m.key === key);
    return m ? m.label : key.replace(/-/g, ' ');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Roles personalizados</h1>
        <button onClick={openCreate} className="bg-primary-500 text-white px-4 py-2 rounded-xl hover:bg-primary-600 transition text-sm font-medium shadow-md shadow-primary-200">
          + Nuevo rol
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{editing ? 'Editar rol' : 'Nuevo rol'}</h2>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">{error}</div>}
            <div className="space-y-3">
              <input placeholder="Nombre del rol" className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input placeholder="Descripción (opcional)" className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="pt-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Acceso a módulos</p>
                <div className="space-y-2">
                  {filteredModules.map((mod) => (
                    <label key={mod.key} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox"
                        checked={form.permissions[mod.key] || false}
                        onChange={(e) => setForm({ ...form, permissions: { ...form.permissions, [mod.key]: e.target.checked } })}
                        className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                      <div>
                        <span className="text-sm text-gray-700">{mod.label}</span>
                        {mod.description && <p className="text-xs text-gray-400">{mod.description}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-primary-500 text-white py-2 rounded-xl text-sm hover:bg-primary-600 transition disabled:opacity-60">{saving ? 'Guardando...' : editing ? 'Guardar' : 'Crear'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {roles.map((r) => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{r.name}</h3>
                {r.description && <p className="text-sm text-gray-500">{r.description}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(r)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Editar">
                  <HiOutlinePencilSquare className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget(r)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Eliminar">
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {r.permissions.filter((p) => p.canAccess).map((p) => (
                <span key={p.moduleKey} className="bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {moduleLabel(p.moduleKey)}
                </span>
              ))}
              {r.permissions.filter((p) => p.canAccess).length === 0 && (
                <span className="text-xs text-gray-400">Sin módulos asignados</span>
              )}
            </div>
          </div>
        ))}
        {roles.length === 0 && (
          <div className="text-center py-12 text-gray-400">No hay roles creados</div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar rol"
        message={`¿Eliminar el rol "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
