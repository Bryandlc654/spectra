import { useState, useEffect } from 'react';
import { HiOutlineDocumentText, HiOutlineEye, HiOutlineTrash } from 'react-icons/hi2';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { downloadPdf } from '../../utils/pdf';
import { contractService } from '../../services/api';
import type { Contract, ContractTemplate } from '../../types';

const contractSchema = z.object({
  templateId: z.number().min(1, 'Selecciona una plantilla'),
  freelancerUserId: z.number().min(1, 'Selecciona un freelancer'),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  amount: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractSchema>;

interface FreelancerOption { id: number; name: string; }

function ContractForm({ form, setForm, onSubmit, onCancel, templates, freelancers }: {
  form: ContractFormData;
  setForm: React.Dispatch<React.SetStateAction<ContractFormData>>;
  onSubmit: () => void;
  onCancel: () => void;
  templates: ContractTemplate[];
  freelancers: FreelancerOption[];
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: form,
  });

  const onSubmitHandler = () => onSubmit();

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-3">
      <div>
        <select {...register('templateId', { valueAsNumber: true })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white">
          <option value={0}>Seleccionar plantilla</option>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {errors.templateId && <p className="text-xs text-red-500 mt-1">{errors.templateId.message}</p>}
      </div>
      <div>
        <select {...register('freelancerUserId', { valueAsNumber: true })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white">
          <option value={0}>Seleccionar freelancer</option>
          {freelancers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        {errors.freelancerUserId && <p className="text-xs text-red-500 mt-1">{errors.freelancerUserId.message}</p>}
      </div>
      <div>
        <input {...register('title')} placeholder="Título del contrato" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>
      <input {...register('description')} placeholder="Descripción del servicio" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
      <div className="grid grid-cols-2 gap-3">
        <input type="date" {...register('startDate')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
        <input type="date" {...register('endDate')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
      </div>
      <input type="number" {...register('amount')} placeholder="Monto $" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white" />
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
        <p className="text-xs font-medium text-gray-600 mb-1">Placeholders disponibles en plantillas:</p>
        <p className="text-xs text-gray-400">{`{{tenant_name}} {{freelancer_name}} {{date}} {{start_date}} {{end_date}} {{amount}}`}</p>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
        <button type="submit" className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition shadow-md">Crear contrato</button>
      </div>
    </form>
  );
}

export default function Contracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [freelancers, setFreelancers] = useState<FreelancerOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ContractFormData>({ templateId: 0, freelancerUserId: 0, title: '', description: '', startDate: '', endDate: '', amount: '' });
  const [selected, setSelected] = useState<Contract | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null);

  const isAdminTenant = user?.role === 'admin_tenant';

  const load = async () => {
    try {
      const [contractsData, templatesData, freelancersData] = await Promise.all([
        contractService.list(),
        contractService.templates(),
        api.get('/super-admin/freelancers').then((r) => r.data.data),
      ]);
      setContracts(contractsData);
      setTemplates(templatesData.filter((t) => t.isActive));
      setFreelancers(freelancersData);
    } catch (err) {
      console.error('Error loading contracts:', err);
    }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ templateId: 0, freelancerUserId: 0, title: '', description: '', startDate: '', endDate: '', amount: '' }); setShowForm(true); };

  const handleCreate = async (data: ContractFormData) => {
    try {
      const fr = freelancers.find((f) => f.id === data.freelancerUserId);
      await contractService.create({
        templateId: data.templateId,
        freelancerUserId: data.freelancerUserId,
        freelancerName: fr?.name,
        title: data.title,
        description: data.description,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        amount: data.amount ? Number(data.amount) : undefined,
      });
      setShowForm(false); load();
    } catch (err) {
      console.error('Error creating contract:', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await contractService.delete(deleteTarget.id);
      setDeleteTarget(null); load();
    } catch (err) {
      console.error('Error deleting contract:', err);
    }
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
                <button onClick={() => downloadPdf(`/contracts/${c.id}/pdf`, `contrato-${c.id}.pdf`)}
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
            <ContractForm
              form={form}
              setForm={setForm}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              templates={templates}
              freelancers={freelancers}
            />
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
                <button onClick={() => downloadPdf(`/contracts/${selected.id}/pdf`, `contrato-${selected.id}.pdf`)}
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
                  <button onClick={async () => { try { await contractService.updateStatus(selected.id, 'cancelled'); setSelected(null); load(); } catch (err) { console.error('Error cancelling contract:', err); } }}
                    className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition">Cancelar contrato</button>
                  <button onClick={async () => { try { await contractService.updateStatus(selected.id, 'signed'); setSelected(null); load(); } catch (err) { console.error('Error signing contract:', err); } }}
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
