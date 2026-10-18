import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout/AppLayout';
import PlatformShell from '../layouts/PlatformLayout/PlatformShell';
import DashboardPage from '../pages/dashboard/DashboardPage';
import NotFoundPage from '../pages/errors/NotFoundPage';
import LoginPage from '../pages/auth/LoginPage';
import ProtectedRoute from './ProtectedRoute';

// 6 Không Gian Làm Việc Hợp Nhất (Workspaces - RULE-UI-001)
import ProductionWorkspace from '../workspaces/production/ProductionWorkspace';
import PersonnelWorkspace from '../workspaces/personnel/PersonnelWorkspace';
import InventoryHub from '../workspaces/inventory/InventoryHub';
import PartnerDirectory from '../workspaces/partners/PartnerDirectory';
import FarmingExecution from '../workspaces/farming/FarmingExecution';
import QaPipeline from '../workspaces/quality/QaPipeline';
import SystemSettings from '../workspaces/settings/SystemSettings';

// Trang chức năng chuyên sâu (Table + Form trực tiếp)
import FarmDetailPage from '../pages/organization/farms/FarmDetailPage';
import OperationalCyclePage from '../pages/organization/cycles/OperationalCyclePage';
import WarehouseListPage from '../pages/inventory/warehouses/WarehouseListPage';
import MaterialListPage from '../pages/inventory/materials/MaterialListPage';
import { ReceiptListPage } from '../pages/inventory/receipts/ReceiptListPage';
import { ReceiptFormPage } from '../pages/inventory/receipts/ReceiptFormPage';
import { IssueListPage } from '../pages/inventory/issues/IssueListPage';
import { IssueFormPage } from '../pages/inventory/issues/IssueFormPage';
import { InventoryBalancePage } from '../pages/inventory/balances/InventoryBalancePage';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Platform Shell dành riêng cho ROLE_SUPER_ADMIN (SYSTEM Scope) */}
        <Route
          path="/platform"
          element={
            <ProtectedRoute requiredRole="ROLE_SUPER_ADMIN">
              <PlatformShell />
            </ProtectedRoute>
          }
        />

        {/* Protected Application Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* 1. Tổng quan Dashboard */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/system-status" element={<DashboardPage />} />

          {/* 2. Workspace A: Không Gian Sản Xuất & Hiện Trường */}
          <Route
            path="/production"
            element={
              <ProtectedRoute requiredPermission={['PERM_FARM_VIEW', 'PERM_ZONE_MANAGE']}>
                <ProductionWorkspace />
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

          {/* 3. Workspace B: Hồ Sơ Nhân Sự 360 Độ */}
          <Route
            path="/personnel"
            element={
              <ProtectedRoute requiredPermission="PERM_HR_EMPLOYEE_MANAGE">
                <PersonnelWorkspace />
              </ProtectedRoute>
            }
          />

          {/* 4. Workspace C: Trung Tâm Kho Bãi & Quản Trị Vật Tư (3.1, 3.2) */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute requiredPermission={['PERM_INVENTORY_VIEW', 'PERM_INVENTORY_RECEIPT', 'PERM_INVENTORY_ISSUE', 'PERM_FARM_VIEW']}>
                <InventoryHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/warehouses"
            element={
              <ProtectedRoute requiredPermission={['PERM_INVENTORY_VIEW', 'PERM_FARM_VIEW']}>
                <WarehouseListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warehouses"
            element={
              <ProtectedRoute requiredPermission={['PERM_INVENTORY_VIEW', 'PERM_FARM_VIEW']}>
                <WarehouseListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/materials"
            element={
              <ProtectedRoute requiredPermission={['PERM_INVENTORY_VIEW', 'PERM_FARM_VIEW']}>
                <MaterialListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/materials"
            element={
              <ProtectedRoute requiredPermission={['PERM_INVENTORY_VIEW', 'PERM_FARM_VIEW']}>
                <MaterialListPage />
              </ProtectedRoute>
            }
          />

          {/* Giao dịch Nhập/Xuất/Tồn kho chi tiết (RULE-DB-UI-SYNC-001) */}
          <Route
            path="/inventory/receipts"
            element={
              <ProtectedRoute requiredPermission={['PERM_INVENTORY_VIEW', 'PERM_INVENTORY_RECEIPT', 'PERM_FARM_VIEW']}>
                <ReceiptListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/receipts/new"
            element={
              <ProtectedRoute requiredPermission={['PERM_INVENTORY_RECEIPT', 'PERM_FARM_VIEW']}>
                <ReceiptFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/issues"
            element={
              <ProtectedRoute requiredPermission={['PERM_INVENTORY_VIEW', 'PERM_INVENTORY_ISSUE', 'PERM_FARM_VIEW']}>
                <IssueListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/issues/new"
            element={
              <ProtectedRoute requiredPermission={['PERM_INVENTORY_ISSUE', 'PERM_FARM_VIEW']}>
                <IssueFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/balances"
            element={
              <ProtectedRoute requiredPermission={['PERM_INVENTORY_VIEW', 'PERM_FARM_VIEW']}>
                <InventoryBalancePage />
              </ProtectedRoute>
            }
          />

          {/* 5. Workspace D: Sổ Danh Bạ Đối Tác (1.6) */}
          <Route
            path="/partners"
            element={
              <ProtectedRoute requiredPermission={['PERM_INVENTORY_VIEW', 'PERM_FINANCE_REPORT', 'PERM_FARM_VIEW']}>
                <PartnerDirectory />
              </ProtectedRoute>
            }
          />

          {/* 6. Workspace E: Canh Tác & Hiện Trường */}
          <Route
            path="/farming"
            element={
              <ProtectedRoute requiredPermission={['PERM_CROP_VIEW', 'PERM_CROP_LOG', 'PERM_LIVESTOCK_VIEW', 'PERM_FARM_VIEW']}>
                <FarmingExecution />
              </ProtectedRoute>
            }
          />

          {/* 7. Workspace F: Đường Ống QA & Truy Xuất Nguồn Gốc */}
          <Route
            path="/quality"
            element={
              <ProtectedRoute requiredPermission={['PERM_QC_INSPECT', 'PERM_QC_APPROVE', 'PERM_LABEL_PRINT']}>
                <QaPipeline />
              </ProtectedRoute>
            }
          />

          {/* 8. Cấu Hình & Hệ Thống & Chu Kỳ Vận Hành (1.5) */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute requiredPermission={['PERM_TENANT_MANAGE', 'PERM_FARM_UPDATE', 'PERM_FARM_VIEW', 'PERM_FINANCE_REPORT']}>
                <SystemSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/cycles"
            element={
              <ProtectedRoute requiredPermission={['PERM_FARM_VIEW', 'PERM_FINANCE_REPORT', 'PERM_FARM_UPDATE']}>
                <OperationalCyclePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cycles"
            element={
              <ProtectedRoute requiredPermission={['PERM_FARM_VIEW', 'PERM_FINANCE_REPORT', 'PERM_FARM_UPDATE']}>
                <OperationalCyclePage />
              </ProtectedRoute>
            }
          />

          {/* Backward Compatibility Redirects (Điều hướng URL cũ) */}
          <Route path="/farms" element={<Navigate to="/production" replace />} />
          <Route path="/assignments" element={<Navigate to="/production" replace />} />
          <Route path="/organization" element={<Navigate to="/production" replace />} />
          <Route path="/organization/*" element={<Navigate to="/production" replace />} />

          <Route path="/employees" element={<Navigate to="/personnel" replace />} />
          <Route path="/hr" element={<Navigate to="/personnel" replace />} />
          <Route path="/hr/*" element={<Navigate to="/personnel" replace />} />

          <Route path="/receipts" element={<Navigate to="/inventory?tab=receipts" replace />} />
          <Route path="/issues" element={<Navigate to="/inventory?tab=issues" replace />} />
          <Route path="/balances" element={<Navigate to="/inventory?tab=balances" replace />} />
          <Route path="/transfers" element={<Navigate to="/inventory?tab=transfers" replace />} />
          <Route path="/stocktakes" element={<Navigate to="/inventory?tab=stocktakes" replace />} />

          <Route path="/crop" element={<Navigate to="/farming" replace />} />
          <Route path="/crop/*" element={<Navigate to="/farming" replace />} />
          <Route path="/livestock" element={<Navigate to="/farming" replace />} />
          <Route path="/livestock/*" element={<Navigate to="/farming" replace />} />

          {/* Fallback routes */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
