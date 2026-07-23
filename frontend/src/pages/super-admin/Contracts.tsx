import { useState, useEffect } from 'react';
import { HiOutlineDocumentText, HiOutlineEye, HiOutlineTrash } from 'react-icons/hi2';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

interface Contract {
  id: number; title: string; content: string; status: string;
  tenantUserId: number; tenantName?: string;
  freelancerUserId: number; freelancerName?: string;
  startDate?: string; endDate?: string; amount?: number;
  template?: { id: number; name: string };
  createdAt: string;
}

export default function Contracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<{ id: number; name: string }[]>([]);
  const [freelancers, setFreelancers] = useState<{ id: number; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ templateId: 0, freelancerUserId: 0, title: '', description: '', startDate: '', endDate: '', amount: '' });
  const [selected, setSelected] = useState<Contract | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null);

  const isAdminTenant = user?.role === 'admin_tenant';

  const load = () => {
    api.get('/contracts').then((r) => setContracts(r.data));
    api.get('/contracts/templates').then((r) => setTemplates(r.data.filter((t: any) => t.isActive)));
    api.get('/super-admin/freelancers').then((r) => setFreelancers(r.data.data));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ templateId: 0, freelancerUserId: 0, title: '', description: '', startDate: '', endDate: '', amount: '' }); setShowForm(true); };

  const handleCreate = async () => {
    try {
      const fr = freelancers.find((f) => f.id === form.freelancerUserId);
      await api.post('/contracts', {
        templateId: form.templateId, freelancerUserId: form.freelancerUserId,
        freelancerName: fr?.name, title: form.title,
        startDate: form.startDate || undefined, endDate: form.endDate || undefined,
        amount: form.amount ? Number(form.amount) : undefined,
        customData: { description: form.description },
      });
      setShowForm(false); load();
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/contracts/${deleteTarget.id}`); setDeleteTarget(null); load(); } catch {}
  };

  const statusBadge = (s: string) => {
    if (s === 'signed') return 'bg-green-100 text-green-700';
    if (s === 'sent') return 'bg-blue-100 text-blue-700';
    if (s === 'cancelled') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };
  const statusLabel = (s: string) => s === 'signed' ? 'Firmado' : s === 'sent' ? 'Enviado' : s === 'cancelled' ? 'Cancelado' : 'Borrador';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <HiOutlineDocumentText className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
            <p className="text-sm text-gray-500">{contracts.length} contratos</p>
          </div>
        </div>
        {isAdminTenant && (
          <button onClick={openCreate} className="bg-primary-500 text-white px-4 py-2.5 rounded-xl hover:bg-primary-600 transition text-sm font-medium shadow-md shadow-primary-200">
            + Nuevo contrato
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {contracts.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition cursor-pointer" onClick={() => setSelected(c)}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-800">{c.title}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(c.status)}`}>{statusLabel(c.status)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  <span>{c.freelancerName || `Freelancer #${c.freelancerUserId}`}</span>
                  {c.amount && <span>${Number(c.amount).toFixed(2)}</span>}
                  <span>{new Date(c.createdAt).toLocaleDateString('es')}</span>
                </div>
              </div>
              <div className="flex gap-1 ml-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setSelected(c)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Vista previa"><HiOutlineEye className="w-4 h-4" /></button>
                <button onClick={async () => { try { const r = await api.get(`/contracts/${c.id}/pdf`, { responseType: 'blob' }); const url = URL.createObjectURL(r.data); const a = document.createElement('a'); a.href = url; a.download = `contrato-${c.id}.pdf`; a.click(); URL.revokeObjectURL(url); } catch {} }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Descargar PDF">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </button>
                <button onClick={() => setDeleteTarget(c)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Eliminar"><HiOutlineTrash className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {contracts.length === 0 && <div className="text-center py-12 text-gray-400">No hay contratos</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nuevo contrato</h2>
            <div className="space-y-3">
              <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" value={form.templateId} onChange={(e) => setForm({ ...form, templateId: Number(e.target.value) })}>
                <option value={0}>Seleccionar plantilla</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" value={form.freelancerUserId} onChange={(e) => setForm({ ...form, freelancerUserId: Number(e.target.value) })}>
                <option value={0}>Seleccionar freelancer</option>
                {freelancers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <input placeholder="Título del contrato" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input placeholder="Descripción del servicio" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" placeholder="Inicio" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                <input type="date" placeholder="Fin" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <input type="number" placeholder="Monto $" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button onClick={handleCreate} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition shadow-md">Crear contrato</button>
              </div>
            </div>
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
                <button onClick={async () => { try { const r = await api.get(`/contracts/${selected.id}/pdf`, { responseType: 'blob' }); const url = URL.createObjectURL(r.data); const a = document.createElement('a'); a.href = url; a.download = `contrato-${selected.id}.pdf`; a.click(); URL.revokeObjectURL(url); } catch {} }}
                  className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition shadow-md flex items-center gap-2">
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
                  <button onClick={async () => { await api.put(`/contracts/${selected.id}/status`, { status: 'cancelled' }); setSelected(null); load(); }}
                    className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition">Cancelar contrato</button>
                  <button onClick={async () => { await api.put(`/contracts/${selected.id}/status`, { status: 'signed' }); setSelected(null); load(); }}
                    className="px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition shadow-md">Firmar contrato</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal open={!!deleteTarget} title="Eliminar contrato" message={`¿Eliminar "${deleteTarget?.title}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
