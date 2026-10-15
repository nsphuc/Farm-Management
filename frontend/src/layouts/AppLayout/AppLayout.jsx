import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../../components/shared/Header';
import { Sidebar } from '../../components/shared/Sidebar';
import { ToastContainer } from '../../components/feedback/ToastContainer';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default AppLayout;
