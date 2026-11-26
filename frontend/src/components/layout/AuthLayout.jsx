import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

/**
 * AuthShell - Shell Xác Thực Tập Trung
 * (/login, /register, /force-change-password) - Tối giản, có nút mũi tên quay lại trang chủ.
 */
export function AuthShell() {
  return (
    <div className="min-h-screen w-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      {/* Top Back to Home Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition-all hover:scale-105 shadow-sm"
          title="Quay lại trang chủ"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Quay lại trang chủ</span>
          <span className="sm:hidden">Trang chủ</span>
        </Link>
      </div>

      {/* Header Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-block group">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-xl shadow-emerald-500/20 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
            <span className="text-2xl">🐖</span>
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl flex items-center justify-center gap-1.5">
            FarmGo <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-400/30">Chăn Nuôi</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Nền tảng Quản trị Chăn nuôi Gia súc & Gia cầm Toàn diện
          </p>
        </Link>
      </div>

      {/* Card Content Outlet */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-white/20 text-slate-900">
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-slate-400 z-10">
        Bản quyền © 2026 FarmGo SaaS. Thiết kế bảo mật cao cấp chuẩn doanh nghiệp.
      </div>
    </div>
  );
}

export const AuthLayout = AuthShell;
export default AuthShell;
