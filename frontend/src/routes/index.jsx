import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout/AppLayout';
import DashboardPage from '../pages/dashboard/DashboardPage';
import NotFoundPage from '../pages/errors/NotFoundPage';
import LoginPage from '../pages/auth/LoginPage';
import ProtectedRoute from './ProtectedRoute';
import FarmListPage from '../pages/organization/farms/FarmListPage';
import FarmDetailPage from '../pages/organization/farms/FarmDetailPage';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Application Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/system-status" element={<DashboardPage />} />

          {/* 1.2. Phân hệ Quản lý Trang trại & Phân khu sản xuất */}
          <Route
            path="/farms"
            element={
              <ProtectedRoute requiredPermission="PERM_FARM_VIEW">
                <FarmListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farms/:id"
            element={
              <ProtectedRoute requiredPermission="PERM_FARM_VIEW">
                <FarmDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/organization" element={<Navigate to="/farms" replace />} />

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
