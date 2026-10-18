import React from 'react';
import { Outlet } from 'react-router-dom';
import { QrCode, ShieldCheck } from 'lucide-react';

/**
 * PublicTraceShell - Cổng Tra Cứu Nguồn Gốc Nông Sản Công Khai (Mục 1.1.4 File 08)
 * (/trace/:traceabilityCode) - Hoàn toàn công khai, Mobile-First.
 */
export function PublicTraceShell() {
  return (
    <div className="min-h-screen w-screen bg-slate-100 font-sans text-slate-900 flex flex-col">
      {/* Top Mobile-First Header */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <QrCode className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-slate-900 text-sm leading-tight">
              TRUY XUẤT NÔNG SẢN
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
              Hệ Thống Minh Bạch Quốc Gia
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>VietGAP Verified</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 sm:p-6 pb-12">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Nền tảng Nông nghiệp Số Agri-ERP • Cổng thông tin truy xuất nguồn gốc nông sản an toàn
      </footer>
    </div>
  );
}

export default PublicTraceShell;
