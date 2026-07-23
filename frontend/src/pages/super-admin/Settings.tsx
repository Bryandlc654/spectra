import { useState, useEffect } from 'react';
import { HiOutlineEnvelope, HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi2';
import api from '../../api/axios';

export default function Settings() {
  const [form, setForm] = useState({ host: '', port: '587', user: '', pass: '', from: '' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    api.get('/settings/smtp').then((r) => {
      setForm({
        host: r.data.smtp_host || 'smtp.gmail.com',
        port: r.data.smtp_port || '587',
        user: r.data.smtp_user || '',
        pass: r.data.smtp_pass || '',
        from: r.data.smtp_from || 'noreply@spectra.com',
      });
    });
  }, []);

  const handleSave = async () => {
    setSaving(true); setMessage(null);
    try {
      await api.put('/settings/smtp', form);
      setMessage({ type: 'success', text: 'Configuración SMTP guardada correctamente' });
    } catch {
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setMessage(null);
    try {
      await api.post('/email/test', { to: form.from });
      setMessage({ type: 'success', text: 'Correo de prueba enviado. Revisa la bandeja de entrada.' });
    } catch {
      setMessage({ type: 'error', text: 'Error al enviar correo de prueba' });
    } finally { setTesting(false); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
          <HiOutlineEnvelope className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración SMTP</h1>
          <p className="text-sm text-gray-500">Configura el servidor de correo para notificaciones</p>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl mb-5 text-sm border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.type === 'success' ? <HiOutlineCheckCircle className="w-5 h-5 shrink-0" /> : <HiOutlineExclamationCircle className="w-5 h-5 shrink-0" />}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servidor SMTP</label>
              <input placeholder="smtp.gmail.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Puerto</label>
              <input placeholder="587"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <input placeholder="correo@gmail.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} placeholder="App password"
                  className="w-full pr-10 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
                  value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    {showPass
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                    }
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo remitente (From)</label>
            <input placeholder="noreply@spectra.com"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-gray-50 focus:bg-white"
              value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={handleTest} disabled={testing}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-60">
            {testing ? 'Enviando...' : 'Enviar prueba'}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition disabled:opacity-60 shadow-md shadow-primary-200">
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  );
}
