import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sprout } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-xl bg-emerald-600 items-center justify-center text-white shadow-md mb-3">
          <Sprout className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Farm SaaS</h2>
        <p className="mt-1 text-xs text-slate-500">Hệ thống Quản lý Đa Trang trại</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
