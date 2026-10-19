import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from '@/components/layout/TopBar';
import { DynamicSidebar } from '@/components/layout/DynamicSidebar';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

/**
 * TenantAppShell - Khung Ứng Dụng Nghiệp Vụ Chính (Mục 1.1.3 File 08)
 * Dành cho 5 Role của Tenant (/app/*).
 * Tích hợp Universal Global TopBar và Dynamic Sidebar 9 Workspaces.
 * Trang bị ErrorBoundary bảo vệ Outlet chống sập trắng toàn bộ ứng dụng khi có lỗi runtime tại Workspace.
 */
export function TenantAppShell() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Dynamic Sidebar */}
      <DynamicSidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main View Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TopBar */}
        <TopBar onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

        {/* Workspace Canvas Outlet được bảo vệ bởi ErrorBoundary */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default TenantAppShell;
