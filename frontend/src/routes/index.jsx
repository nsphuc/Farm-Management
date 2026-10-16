import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout/AppLayout';
import DashboardPage from '../pages/dashboard/DashboardPage';
import NotFoundPage from '../pages/errors/NotFoundPage';
import LoginPage from '../pages/auth/LoginPage';
import ProtectedRoute from './ProtectedRoute';

// 1. Tổ chức & Trang trại
import FarmListPage from '../pages/organization/farms/FarmListPage';
import FarmDetailPage from '../pages/organization/farms/FarmDetailPage';
import OperationalCyclePage from '../pages/organization/cycles/OperationalCyclePage';
import PartnerListPage from '../pages/organization/partners/PartnerListPage';

// 3. Kho & Vật tư
import WarehouseListPage from '../pages/inventory/warehouses/WarehouseListPage';
import MaterialListPage from '../pages/inventory/materials/MaterialListPage';

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

          {/* ================================================================= */}
          {/* 1. PHÂN HỆ QUẢN LÝ TỔ CHỨC & TRANG TRẠI                          */}
          {/* ================================================================= */}
          {/* 1.2. Quản lý Trang trại & Phân khu sản xuất */}
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

          {/* 1.5. Cấu hình & Chu kỳ vận hành (Mùa vụ, Năm tài chính) */}
          <Route
            path="/cycles"
            element={
              <ProtectedRoute requiredPermission={['PERM_FARM_VIEW', 'PERM_FINANCE_REPORT']}>
                <OperationalCyclePage />
              </ProtectedRoute>
            }
          />
          <Route path="/organization/cycles" element={<Navigate to="/cycles" replace />} />

          {/* 1.6. Quản lý Đối tác (Nhà cung cấp, Khách hàng) */}
          <Route
            path="/partners"
            element={
              <ProtectedRoute requiredPermission={['PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT', 'PERM_FARM_VIEW']}>
                <PartnerListPage />
              </ProtectedRoute>
            }
          />
          <Route path="/organization/partners" element={<Navigate to="/partners" replace />} />

          {/* ================================================================= */}
          {/* 3. PHÂN HỆ QUẢN LÝ KHO & VẬT TƯ NÔNG NGHIỆP                       */}
          {/* ================================================================= */}
          {/* 3.1. Quản lý Kho bãi trong Trang trại */}
          <Route
            path="/warehouses"
            element={
              <ProtectedRoute requiredPermission="PERM_INVENTORY_VIEW">
                <WarehouseListPage />
              </ProtectedRoute>
            }
          />
          <Route path="/inventory/warehouses" element={<Navigate to="/warehouses" replace />} />

          {/* 3.2. Quản lý Danh mục & Mặt hàng vật tư */}
          <Route
            path="/materials"
            element={
              <ProtectedRoute requiredPermission={['PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT']}>
                <MaterialListPage />
              </ProtectedRoute>
            }
          />
          <Route path="/inventory/materials" element={<Navigate to="/materials" replace />} />
          <Route path="/inventory" element={<Navigate to="/warehouses" replace />} />

          {/* Fallback routes */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
