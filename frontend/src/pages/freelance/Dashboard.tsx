import { useState, useEffect } from 'react';
import api from '../../api/axios';

interface FreelanceProfile {
  id: number; code?: string; name: string; email: string; phone?: string; createdAt: string;
}

export default function FreelanceDashboard() {
  const [profile, setProfile] = useState<FreelanceProfile | null>(null);

  useEffect(() => {
    api.get('/freelance/profile').then((res) => setProfile(res.data.profile));
  }, []);

  if (!profile) return <div className="text-primary-500">Cargando perfil...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Panel Freelance</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-lg">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Mi perfil</h2>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-gray-500">Código</span>
            <p className="text-primary-600 font-mono font-bold">{profile.code || '—'}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Nombre</span>
            <p className="text-gray-800 font-medium">{profile.name}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Email</span>
            <p className="text-gray-800">{profile.email}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Teléfono</span>
            <p className="text-gray-800">{profile.phone || '—'}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Rol</span>
            <p className="text-primary-700 font-medium">Freelance</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Miembro desde</span>
            <p className="text-gray-800">{new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
