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
import ReceiptListPage from '../pages/inventory/receipts/ReceiptListPage';
import ReceiptFormPage from '../pages/inventory/receipts/ReceiptFormPage';
import IssueListPage from '../pages/inventory/issues/IssueListPage';
import IssueFormPage from '../pages/inventory/issues/IssueFormPage';
import InventoryBalancePage from '../pages/inventory/balances/InventoryBalancePage';

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

          {/* 3.3. Nhập kho (Inventory Receipts) */}
          <Route
            path="/inventory/receipts"
            element={
              <ProtectedRoute requiredPermission="PERM_INVENTORY_VIEW">
                <ReceiptListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/receipts/new"
            element={
              <ProtectedRoute requiredPermission={['PERM_INVENTORY_MANAGE', 'PERM_INVENTORY_RECEIPT']}>
                <ReceiptFormPage />
              </ProtectedRoute>
            }
          />
          <Route path="/receipts" element={<Navigate to="/inventory/receipts" replace />} />
          <Route path="/receipts/new" element={<Navigate to="/inventory/receipts/new" replace />} />

          {/* 3.4. Xuất kho (Inventory Issues) */}
          <Route
            path="/inventory/issues"
            element={
              <ProtectedRoute requiredPermission="PERM_INVENTORY_VIEW">
                <IssueListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/issues/new"
            element={
              <ProtectedRoute requiredPermission={['PERM_INVENTORY_MANAGE', 'PERM_INVENTORY_ISSUE']}>
                <IssueFormPage />
              </ProtectedRoute>
            }
          />
          <Route path="/issues" element={<Navigate to="/inventory/issues" replace />} />
          <Route path="/issues/new" element={<Navigate to="/inventory/issues/new" replace />} />

          {/* 3.7. Theo dõi tồn kho (Inventory Balance) */}
          <Route
            path="/inventory/balances"
            element={
              <ProtectedRoute requiredPermission="PERM_INVENTORY_VIEW">
                <InventoryBalancePage />
              </ProtectedRoute>
            }
          />
          <Route path="/balances" element={<Navigate to="/inventory/balances" replace />} />
          <Route path="/inventory" element={<Navigate to="/inventory/balances" replace />} />

          {/* Fallback routes */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
