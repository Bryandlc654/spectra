import { useState, useEffect, useCallback } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlineArrowPath, HiOutlineClipboardDocument, HiOutlineCheck, HiOutlineQueueList } from 'react-icons/hi2';
import ConfirmModal from '../../components/ConfirmModal';
import AreasModal from '../../components/AreasModal';
import api from '../../api/axios';
import { generatePassword, passwordStrength } from '../../utils/password';

const countries = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba',
  'Ecuador', 'El Salvador', 'España', 'Estados Unidos', 'Guatemala', 'Honduras',
  'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'República Dominicana',
  'Uruguay', 'Venezuela', 'Canadá', 'Francia', 'Italia', 'Portugal', 'Reino Unido',
  'Alemania', 'Países Bajos', 'Suiza', 'Japón', 'China', 'India', 'Australia',
];

interface Freelancer {
  id: number; code?: string; name: string; email: string; phone?: string; country?: string;
  documentId?: string; yearsOfExperience?: number; skills?: string; bio?: string;
  isActive: boolean; createdAt: string;
  tenant?: { id: number; businessName: string; name: string };
  area?: { id: number; name: string };
}

interface Tenant { id: number; businessName: string; name: string; }
interface Area { id: number; name: string; }

export default function FreelancersList() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Freelancer | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', country: '', documentId: '', areaId: 0, yearsOfExperience: 0, skills: '', bio: '', tenantId: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Freelancer | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAreas, setShowAreas] = useState(false);
  const [search, setSearch] = useState('');
  const [skillInput, setSkillInput] = useState('');

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    const current = form.skills ? form.skills.split(',').map((x) => x.trim()).filter(Boolean) : [];
    if (!current.includes(s)) {
      current.push(s);
      setForm({ ...form, skills: current.join(', ') });
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    const current = form.skills ? form.skills.split(',').map((x) => x.trim()).filter(Boolean) : [];
    setForm({ ...form, skills: current.filter((s) => s !== skill).join(', ') });
  };
  const [filterTenant, setFilterTenant] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

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
    const [f, t, a] = await Promise.all([
      api.get('/super-admin/freelancers'),
      api.get('/tenants'),
      api.get('/areas'),
    ]);
    setFreelancers(f.data.data);
    setTenants(t.data.data);
    setAreas(a.data);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: generatePassword(), phone: '', country: '', documentId: '', areaId: 0, yearsOfExperience: 0, skills: '', bio: '', tenantId: 0 });
    setError(''); setCopied(false); setShowForm(true);
  };

  const openEdit = (f: Freelancer) => {
    setEditing(f);
    setForm({ name: f.name, email: f.email, password: '', phone: f.phone || '', country: f.country || '', documentId: f.documentId || '', areaId: f.area?.id || 0, yearsOfExperience: f.yearsOfExperience || 0, skills: f.skills || '', bio: f.bio || '', tenantId: f.tenant?.id || 0 });
    setError(''); setCopied(false); setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name, email: form.email, phone: form.phone || undefined,
        country: form.country || undefined, documentId: form.documentId || undefined,
        areaId: form.areaId || undefined, yearsOfExperience: form.yearsOfExperience || undefined,
        skills: form.skills || undefined, bio: form.bio || undefined,
        tenantId: form.tenantId || undefined,
      };
      if (editing) {
        await api.put(`/super-admin/freelancers/${editing.id}`, { ...payload, ...(form.password ? { password: form.password } : {}) });
      } else {
        await api.post('/super-admin/freelancers', { ...payload, password: form.password });
      }
      setShowForm(false); setEditing(null); load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/super-admin/freelancers/${deleteTarget.id}`);
      setDeleteTarget(null); load();
    } catch { setError('Error al eliminar'); setDeleteTarget(null); }
  };

  const filtered = freelancers.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch = !search || f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q) || (f.phone || '').includes(q) || (f.documentId || '').includes(q) || (f.skills || '').toLowerCase().includes(q);
    const matchTenant = !filterTenant || f.tenant?.id === Number(filterTenant);
    const matchStatus = !filterStatus || (filterStatus === 'active' ? f.isActive : !f.isActive);
    return matchSearch && matchTenant && matchStatus;
  });

  const selectedTenant = tenants.find((t) => t.id === form.tenantId);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Freelancers</h1>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" placeholder="Buscar por nombre, email o teléfono..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white min-w-[160px]"
          value={filterTenant} onChange={(e) => setFilterTenant(e.target.value)}>
          <option value="">Todos los tenants</option>
          {tenants.map((t) => <option key={t.id} value={t.id}>{t.businessName}</option>)}
        </select>
        <select className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white min-w-[130px]"
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
        {(search || filterTenant || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterTenant(''); setFilterStatus(''); }}
            className="text-xs text-gray-500 hover:text-primary-500 transition font-medium px-2">
            Limpiar
          </button>
        )}
        <button onClick={() => setShowAreas(true)}
          className="bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition text-sm font-medium shrink-0 flex items-center gap-2">
          <HiOutlineQueueList className="w-4 h-4" />
          Gestionar áreas
        </button>
        <button onClick={openCreate} className="bg-primary-500 text-white px-4 py-2.5 rounded-xl hover:bg-primary-600 transition text-sm font-medium shadow-md shadow-primary-200 shrink-0">
          + Nuevo freelancer
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="hidden sm:flex w-10 h-10 rounded-xl bg-green-100 items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{editing ? 'Editar freelancer' : 'Nuevo freelancer'}</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{editing ? 'Actualiza los datos del freelancer' : 'Registra un nuevo freelancer'}</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm border border-red-100">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Información personal</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo <span className="text-red-400">*</span></label>
                      <input placeholder="Nombre completo"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico <span className="text-red-400">*</span></label>
                      <input type="email" placeholder="freelancer@email.com"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Documento de Identidad</label>
                      <input placeholder="DNI / RUC / Pasaporte"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                        value={form.documentId} onChange={(e) => setForm({ ...form, documentId: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                      <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                        value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                        <option value="">Seleccionar país</option>
                        {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input placeholder="+52 555 123 4567"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                        value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Información profesional</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Área / Especialidad</label>
                      <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                        value={form.areaId} onChange={(e) => setForm({ ...form, areaId: Number(e.target.value) })}>
                        <option value={0}>Seleccionar área</option>
                        {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Años de Experiencia</label>
                      <input type="number" min="0" placeholder="0"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                        value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Habilidades</label>
                    <div className="border border-gray-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition overflow-hidden">
                      <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2.5 min-h-[42px]">
                        {form.skills ? form.skills.split(',').map((s) => s.trim()).filter(Boolean).map((s) => (
                          <span key={s}
                            className="inline-flex items-center gap-1 bg-gradient-to-br from-primary-50 to-primary-100 text-primary-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-primary-200 shadow-sm group">
                            <svg className="w-3 h-3 text-primary-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {s}
                            <button type="button" onClick={() => removeSkill(s)}
                              className="w-4 h-4 flex items-center justify-center rounded-full text-primary-400 hover:text-red-500 hover:bg-red-50 transition ml-0.5">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        )) : (
                          <span className="text-xs text-gray-300 py-0.5">No hay habilidades agregadas</span>
                        )}
                      </div>
                      <div className="flex items-center border-t border-gray-100 bg-gray-50/50">
                        <input placeholder="Agregar habilidad..."
                          className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
                            if (e.key === ',' && skillInput.trim()) { e.preventDefault(); addSkill(); }
                          }} />
                        <button type="button" onClick={addSkill}
                          className="mr-1.5 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600 transition shrink-0 flex items-center gap-1 shadow-sm">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Agregar
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">Presiona Enter o coma (,) para agregar</p>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Descripción</label>
                    <textarea rows={3} placeholder="Breve descripción del freelancer..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white resize-none"
                      value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 bg-gray-300 rounded-full"></div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Acceso y asignación</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {editing ? 'Nueva contraseña' : 'Contraseña'} <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} placeholder={editing ? 'Dejar vacío' : '••••••••'}
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
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Generar">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a tenant</label>
                      <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                        value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: Number(e.target.value) })}>
                        <option value={0}>Sin tenant</option>
                        {tenants.map((t) => <option key={t.id} value={t.id}>{t.businessName}</option>)}
                      </select>
                      {selectedTenant && (
                        <div className="mt-2 flex items-center gap-2 text-xs bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-100">
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Asignado a <strong>{selectedTenant.businessName}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)}
                className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-white hover:border-gray-300 transition text-center">
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
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear freelancer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Área</th>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">País</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 text-primary-600 font-mono font-bold text-xs">{f.code || '—'}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{f.name}</td>
                <td className="px-4 py-3 text-gray-600">{f.email}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{f.documentId || '—'}</td>
                <td className="px-4 py-3">
                  {f.area ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">{f.area.name}</span> : <span className="text-gray-400 text-xs">—</span>}
                </td>
                <td className="px-4 py-3">
                  {f.tenant ? (
                    <span className="font-medium text-gray-800 text-xs">{f.tenant.businessName}</span>
                  ) : (
                    <span className="text-gray-400 text-xs">Sin tenant</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{f.country || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{f.phone || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(f)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Editar">
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(f)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Eliminar">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No hay freelancers registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AreasModal open={showAreas} onClose={() => setShowAreas(false)} />

      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar freelancer"
        message={`¿Eliminar a "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
