import { useState, useEffect } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import ConfirmModal from './ConfirmModal';
import api from '../api/axios';

interface Area {
  id: number; name: string; description?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AreasModal({ open, onClose }: Props) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Area | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Area | null>(null);

  const load = () => api.get('/areas').then((r) => setAreas(r.data.data || r.data));
  useEffect(() => { if (open) load(); }, [open]);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setError(''); setShowForm(true); };
  const openEdit = (a: Area) => { setEditing(a); setForm({ name: a.name, description: a.description || '' }); setError(''); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (editing) await api.put(`/areas/${editing.id}`, form);
      else await api.post('/areas', form);
      setShowForm(false); setEditing(null); load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/areas/${deleteTarget.id}`);
      setDeleteTarget(null); load();
    } catch { setError('Error al eliminar'); setDeleteTarget(null); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Gestionar áreas</h2>
              <p className="text-sm text-gray-500 mt-0.5">Administra las áreas o especialidades</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-xl mb-5 text-sm border border-red-100">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{areas.length} área(s) registradas</p>
            <button onClick={openCreate} className="bg-primary-500 text-white px-4 py-2 rounded-xl hover:bg-primary-600 transition text-sm font-medium shadow-md shadow-primary-200">
              + Nueva área
            </button>
          </div>

          {showForm && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-4">
              <div className="flex gap-3 items-start">
                <div className="flex-1 space-y-2">
                  <input placeholder="Nombre del área *" autoFocus
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <input placeholder="Descripción (opcional)"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white"
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="flex gap-2 shrink-0 pt-0.5">
                  <button onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-white transition">Cancelar</button>
                  <button onClick={handleSave} disabled={saving}
                    className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm hover:bg-primary-600 transition disabled:opacity-60">
                    {saving ? '...' : editing ? 'Guardar' : 'Crear'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {areas.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 transition">
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.name}</p>
                  {a.description && <p className="text-xs text-gray-400 mt-0.5">{a.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(a)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Editar">
                    <HiOutlinePencilSquare className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(a)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Eliminar">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {areas.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">No hay áreas registradas. Crea la primera.</div>
            )}
          </div>
        </div>

        <ConfirmModal
          open={!!deleteTarget}
          title="Eliminar área"
          message={`¿Eliminar el área "${deleteTarget?.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </div>
  );
}
