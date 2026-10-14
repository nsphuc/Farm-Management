import React from 'react';
import { Menu, Bell, User, Sprout } from 'lucide-react';
import { useUiStore } from '../../store/ui/useUiStore';

export const Header = () => {
  const { toggleSidebar } = useUiStore();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none"
          title="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">Farm SaaS</span>
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-medium ml-1">v0.0.1</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative" title="Thông báo">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-left text-xs">
            <p className="font-semibold text-slate-800">Admin User</p>
            <p className="text-slate-400">admin@farm.saas</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
