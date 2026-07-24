import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineHome, HiOutlineDocumentText, HiOutlineShieldCheck } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import AdminSidebar from '../../components/AdminSidebar';
import FreelanceProfile from './ProfilePage';
import FreelanceContracts from './FreelanceContracts';
import FreelanceKyc from './FreelanceKyc';

export default function FreelancePanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get('tab') || 'profile';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { t } = useTranslation();

  const modules = [
    { key: 'profile', label: t('profile.title'), icon: HiOutlineHome },
    { key: 'contracts', label: t('profile.myContracts'), icon: HiOutlineDocumentText },
    { key: 'kyc', label: t('modules.kyc'), icon: HiOutlineShieldCheck },
  ];

  const setActive = (key: string) => setSearchParams({ tab: key });

  const renderModule = () => {
    switch (active) {
      case 'profile': return <FreelanceProfile />;
      case 'contracts': return <FreelanceContracts />;
      case 'kyc': return <FreelanceKyc />;
      default: return <FreelanceProfile />;
    }
  };

  return (
    <div>
      <AdminSidebar modules={modules} active={active} onSelect={setActive} open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className={`flex-1 transition-all duration-300 p-4 sm:p-6 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        {renderModule()}
      </main>
    </div>
  );
}
