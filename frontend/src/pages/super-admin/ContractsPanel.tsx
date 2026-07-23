import { useState } from 'react';
import { HiOutlineDocumentText, HiOutlineDocumentPlus, HiOutlinePencilSquare } from 'react-icons/hi2';
import ContractTemplates from './ContractTemplates';
import Contracts from './Contracts';
import SignaturesPage from './SignaturesPage';

const tabs = [
  { key: 'templates', label: 'Plantillas', icon: HiOutlinePencilSquare },
  { key: 'contracts', label: 'Contratos', icon: HiOutlineDocumentText },
  { key: 'signatures', label: 'Firma Digital', icon: HiOutlineDocumentPlus },
];

export default function ContractsPanel() {
  const [activeTab, setActiveTab] = useState('contracts');

  const renderTab = () => {
    switch (activeTab) {
      case 'templates': return <ContractTemplates />;
      case 'contracts': return <Contracts />;
      case 'signatures': return <SignaturesPage />;
      default: return <Contracts />;
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
          <HiOutlineDocumentText className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
          <p className="text-sm text-gray-500">Plantillas, contratos y firma digital</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === t.key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {renderTab()}
    </div>
  );
}
