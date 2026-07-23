import React from 'react';
import { HiOutlineChevronDoubleLeft, HiOutlineChevronDoubleRight } from 'react-icons/hi2';

interface SidebarModule {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AdminSidebarProps {
  modules: SidebarModule[];
  active: string;
  onSelect: (key: string) => void;
  open: boolean;
  onToggle: () => void;
}

export default function AdminSidebar({ modules, active, onSelect, open, onToggle }: AdminSidebarProps) {
  return (
    <aside className={`fixed left-0 top-16 bottom-0 z-40 bg-white shadow-sm transition-all duration-300 flex flex-col ${open ? 'w-60' : 'w-16'}`}>
      <div className={`flex items-center h-14 px-3 border-b border-gray-100 ${open ? 'justify-between' : 'justify-center'}`}>
        {open && <div></div>}
        <button onClick={onToggle}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition">
          {open ? <HiOutlineChevronDoubleLeft className="w-3.5 h-3.5" /> : <HiOutlineChevronDoubleRight className="w-3.5 h-3.5" />}
        </button>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {modules.map((m) => {
          const Icon = m.icon;
          const isActive = active === m.key;
          return (
            <button key={m.key} onClick={() => onSelect(m.key)}
              title={!open ? m.label : undefined}
              className={`relative w-full flex items-center gap-3 text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${open ? 'px-3 py-2.5 rounded-xl' : 'justify-center py-3 rounded-xl'}
                ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-500 rounded-full"></span>}
              <Icon className="w-5 h-5 shrink-0" />
              {open && <span className="truncate">{m.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
