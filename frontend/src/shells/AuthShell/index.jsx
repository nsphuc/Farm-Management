import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

/**
 * AuthShell - Shell Xác Thực Tập Trung (Mục 1.1.1 File 08)
 * (/login, /force-change-password) - Tối giản, không Sidebar, không TopBar.
 */
export function AuthShell() {
  return (
    <div className="min-h-screen w-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      {/* Header Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 text-slate-900 shadow-xl shadow-emerald-500/20 ring-1 ring-white/20">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
          AGRI-ERP PLATFORM
        </h1>
        <p className="mt-1 text-xs text-emerald-300 font-medium tracking-wider uppercase">
          Hệ Thống Quản Trị Nông Nghiệp Đa Trang Trại Chuẩn 72 Bảng
        </p>
      </div>

      {/* Card Content Outlet */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-white/20 text-slate-900">
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-slate-400 z-10">
        Bản quyền © 2026 Agri-ERP SaaS. Thiết kế bảo mật cao cấp (ADR-02 In-Memory Token).
      </div>
    </div>
  );
}

export default AuthShell;
