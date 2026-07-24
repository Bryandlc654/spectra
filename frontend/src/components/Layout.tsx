import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet } from 'react-router-dom';
import { HiOutlineBolt, HiOutlineArrowRightOnRectangle, HiOutlineChevronDown } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin_tenant: 'bg-blue-100 text-blue-700',
  freelance: 'bg-green-100 text-green-700',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);

  const roleLabel = (role: string) => t(`roles.${role}`, role);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const changeLang = (lng: string) => {
    i18n.changeLanguage(lng);
    setLangOpen(false);
  };

  const currentLang = i18n.language?.substring(0, 2) || 'es';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex justify-between h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center shadow-sm shadow-primary-200">
              <HiOutlineBolt className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Spectra</span>
            <span className={`hidden sm:inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${roleColors[user?.role || '']}`}>
              {roleLabel(user?.role || '')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-600">
                {currentLang === 'es' ? 'ES' : 'EN'}
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-1 w-28 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-20">
                    <button onClick={() => changeLang('es')} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition ${currentLang === 'es' ? 'font-semibold text-primary-600' : 'text-gray-700'}`}>Español</button>
                    <button onClick={() => changeLang('en')} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition ${currentLang === 'en' ? 'font-semibold text-primary-600' : 'text-gray-700'}`}>English</button>
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl hover:bg-gray-50 transition group">
                <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-700 leading-tight">{user?.name}</p>
                  <p className="text-[11px] text-gray-400 leading-tight">{user?.email}</p>
                </div>
                <HiOutlineChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-20">
                    <div className="px-3 py-2 border-b border-gray-50 sm:hidden">
                      <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                    <div className="px-3 py-1.5 flex items-center gap-2 text-xs text-gray-400">
                      <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[user?.role || '']}`}>
                        {roleLabel(user?.role || '')}
                      </span>
                    </div>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition font-medium">
                      <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
                      {t('nav.logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
