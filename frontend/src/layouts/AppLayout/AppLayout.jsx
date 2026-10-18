import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Header } from '../../components/shared/Header';
import { Sidebar } from '../../components/shared/Sidebar';
import { ToastContainer } from '../../components/feedback/ToastContainer';
import { useAuthStore } from '../../store/auth/useAuthStore';

export const AppLayout = () => {
  const { user } = useAuthStore();

  // Task 3: ROLE_SUPER_ADMIN chuyển hướng sang PlatformShell, ẩn toàn bộ Sidebar trang trại
  if (user?.roles?.includes('ROLE_SUPER_ADMIN')) {
    return <Navigate to="/platform" replace />;
  }
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default AppLayout;
