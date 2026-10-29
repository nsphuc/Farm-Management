import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Guards
import { AuthGuard } from './guards/AuthGuard';
import { MustChangePasswordGuard } from './guards/MustChangePasswordGuard';
import { RoleScopeGuard } from './guards/RoleScopeGuard';
import { PermissionGuard } from './guards/PermissionGuard';
import { OwnerRestrictedGuard } from './guards/OwnerRestrictedGuard';

// Shells
import { AuthShell } from '@/shells/AuthShell';
import { LoginPage } from '@/shells/AuthShell/LoginPage';
import { ForceChangePasswordPage } from '@/shells/AuthShell/ForceChangePasswordPage';

import { PlatformShell } from '@/shells/PlatformShell';
import { PlatformDashboardPage } from '@/pages/platform';

import { TenantAppShell } from '@/shells/TenantAppShell';
import { PublicTraceShell } from '@/shells/PublicTraceShell';
import { TraceabilityDetailPage } from '@/pages/public/TraceabilityDetailPage';

// 9 Workspaces
import { GeographyWorkspace } from '@/workspaces/A_Geography';
import { Personnel360Workspace } from '@/workspaces/B_Personnel360';
import { InventoryHubWorkspace } from '@/workspaces/C_InventoryHub';
import { PartnersWorkspace } from '@/workspaces/D_Partners';
import { FarmingOpsWorkspace } from '@/workspaces/E_FarmingOps';
import { QaTraceabilityWorkspace } from '@/workspaces/F_QaTraceability';
import { EmployeeDailyOpsWorkspace } from '@/workspaces/G_EmployeeDailyOps';
import { CostAccountingWorkspace } from '@/workspaces/H1_CostAccounting';
import { SalesCashflowWorkspace } from '@/workspaces/H2_SalesCashflow';

// Standalone Pages
import { SettingsPage } from '@/pages/settings';
import { ReportsPage } from '@/pages/reports';
import { SystemPage } from '@/pages/system';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Điều hướng trang đích ban đầu dựa theo 6 Vai trò Vận hành thực tế
 */
function TenantIndexRedirect() {
  const { isOwner, isFarmManager, isZoneManager, isFieldWorker, isWarehouseKeeper, isFarmAccountant, isTechnicalLead } = useAuthStore();
  if (isFarmManager()) {
    return <Navigate to="/app/my-dashboard" replace />;
  }
  if (isZoneManager && isZoneManager()) {
    return <Navigate to="/app/my-dashboard" replace />;
  }
  if (isOwner()) {
    return <Navigate to="/app/geography" replace />;
  }
  if (isFieldWorker()) {
    return <Navigate to="/app/my-dashboard" replace />;
  }
  if (isWarehouseKeeper()) {
    return <Navigate to="/app/inventory" replace />;
  }
  if (isFarmAccountant()) {
    return <Navigate to="/app/sales-cashflow" replace />;
  }
  if (isTechnicalLead()) {
    return <Navigate to="/app/farming" replace />;
  }
  return <Navigate to="/app/geography" replace />;
}

/**
 * Master Application Routing System v2.0 (Khớp Điều 1 File 08 & Mục 3 File 11)
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* 1. Root Redirection */}
      <Route path="/" element={<Navigate to="/app" replace />} />

      {/* 2. Public Traceability Shell (Cổng QR Không cần đăng nhập) */}
      <Route element={<PublicTraceShell />}>
        <Route path="/trace/:traceabilityCode" element={<TraceabilityDetailPage />} />
      </Route>

      {/* 3. Auth Shell (/login, /force-change-password) */}
      <Route element={<AuthShell />}>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/force-change-password"
          element={
            <AuthGuard>
              <MustChangePasswordGuard>
                <ForceChangePasswordPage />
              </MustChangePasswordGuard>
            </AuthGuard>
          }
        />
      </Route>

      {/* 4. Platform Shell (/platform/* - Super Admin) */}
      <Route
        path="/platform"
        element={
          <AuthGuard>
            <MustChangePasswordGuard>
              <RoleScopeGuard scope="PLATFORM">
                <PlatformShell />
              </RoleScopeGuard>
            </MustChangePasswordGuard>
          </AuthGuard>
        }
      >
        <Route index element={<PlatformDashboardPage />} />
        <Route path="tenants" element={<PlatformDashboardPage />} />
        <Route path="subscriptions" element={<PlatformDashboardPage />} />
        <Route path="users" element={<PlatformDashboardPage />} />
        <Route path="audit-logs" element={<PlatformDashboardPage />} />
        <Route path="health" element={<PlatformDashboardPage />} />
      </Route>

      {/* 5. Tenant App Shell (/app/* - 9 Workspaces & 3 Standalone Modules) */}
      <Route
        path="/app"
        element={
          <AuthGuard>
            <MustChangePasswordGuard>
              <RoleScopeGuard scope="TENANT">
                <TenantAppShell />
              </RoleScopeGuard>
            </MustChangePasswordGuard>
          </AuthGuard>
        }
      >
        <Route index element={<TenantIndexRedirect />} />

        {/* 9 Workspaces */}
        <Route
          path="geography"
          element={
            <PermissionGuard anyPermissions={['PERM_FARM_UPDATE', 'PERM_ZONE_MANAGE', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE', 'PERM_TASK_ASSIGN']}>
              <GeographyWorkspace />
            </PermissionGuard>
          }
        />
        <Route
          path="hr"
          element={
            <PermissionGuard anyPermissions={['PERM_HR_EMPLOYEE_MANAGE', 'PERM_FINANCE_EXPENSE']}>
              <Personnel360Workspace />
            </PermissionGuard>
          }
        />
        <Route
          path="inventory"
          element={
            <PermissionGuard permission="PERM_INVENTORY_VIEW">
              <InventoryHubWorkspace />
            </PermissionGuard>
          }
        />
        <Route
          path="partners"
          element={
            <PermissionGuard anyPermissions={['PERM_FINANCE_SALES_ORDER', 'PERM_FINANCE_PAYMENT', 'PERM_FINANCE_REPORT', 'PERM_INVENTORY_RECEIPT', 'PERM_FARM_UPDATE']}>
              <PartnersWorkspace />
            </PermissionGuard>
          }
        />
        <Route
          path="farming"
          element={
            <OwnerRestrictedGuard>
              <PermissionGuard anyPermissions={['PERM_CROP_VIEW', 'PERM_LIVESTOCK_VIEW', 'PERM_CROP_LOG']}>
                <FarmingOpsWorkspace />
              </PermissionGuard>
            </OwnerRestrictedGuard>
          }
        />
        <Route
          path="farming/*"
          element={
            <OwnerRestrictedGuard>
              <PermissionGuard anyPermissions={['PERM_CROP_VIEW', 'PERM_LIVESTOCK_VIEW', 'PERM_CROP_LOG']}>
                <FarmingOpsWorkspace />
              </PermissionGuard>
            </OwnerRestrictedGuard>
          }
        />
        <Route
          path="farming-ops"
          element={
            <OwnerRestrictedGuard>
              <PermissionGuard anyPermissions={['PERM_CROP_VIEW', 'PERM_LIVESTOCK_VIEW', 'PERM_CROP_LOG']}>
                <FarmingOpsWorkspace />
              </PermissionGuard>
            </OwnerRestrictedGuard>
          }
        />
        <Route
          path="farming-ops/*"
          element={
            <OwnerRestrictedGuard>
              <PermissionGuard anyPermissions={['PERM_CROP_VIEW', 'PERM_LIVESTOCK_VIEW', 'PERM_CROP_LOG']}>
                <FarmingOpsWorkspace />
              </PermissionGuard>
            </OwnerRestrictedGuard>
          }
        />
        <Route
          path="qa-traceability"
          element={
            <PermissionGuard anyPermissions={['PERM_QC_INSPECT', 'PERM_QC_APPROVE', 'PERM_LABEL_PRINT', 'PERM_HARVEST_MANAGE']}>
              <QaTraceabilityWorkspace />
            </PermissionGuard>
          }
        />
        <Route
          path="my-dashboard"
          element={
            <OwnerRestrictedGuard>
              <PermissionGuard anyPermissions={['PERM_HR_ATTENDANCE', 'PERM_TASK_ASSIGN', 'PERM_INVENTORY_VIEW', 'PERM_FINANCE_EXPENSE', 'PERM_CROP_LOG', 'PERM_FARM_VIEW']}>
                <EmployeeDailyOpsWorkspace />
              </PermissionGuard>
            </OwnerRestrictedGuard>
          }
        />
        <Route
          path="daily-ops"
          element={
            <OwnerRestrictedGuard>
              <PermissionGuard anyPermissions={['PERM_HR_ATTENDANCE', 'PERM_TASK_ASSIGN', 'PERM_INVENTORY_VIEW', 'PERM_FINANCE_EXPENSE', 'PERM_CROP_LOG', 'PERM_FARM_VIEW']}>
                <EmployeeDailyOpsWorkspace />
              </PermissionGuard>
            </OwnerRestrictedGuard>
          }
        />
        <Route
          path="cost-accounting"
          element={
            <PermissionGuard permission="PERM_FINANCE_EXPENSE">
              <CostAccountingWorkspace />
            </PermissionGuard>
          }
        />
        <Route
          path="sales-cashflow"
          element={
            <PermissionGuard anyPermissions={['PERM_FINANCE_SALES_ORDER', 'PERM_DELIVERY_MANAGE', 'PERM_FINANCE_PAYMENT']}>
              <SalesCashflowWorkspace />
            </PermissionGuard>
          }
        />

        {/* 3 Standalone Modules */}
        <Route
          path="settings"
          element={
            <PermissionGuard anyPermissions={['PERM_TENANT_MANAGE', 'PERM_FARM_UPDATE', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE', 'PERM_INVENTORY_RECEIPT', 'PERM_FINANCE_EXPENSE']}>
              <SettingsPage />
            </PermissionGuard>
          }
        />
        <Route
          path="reports"
          element={
            <PermissionGuard permission="PERM_FINANCE_REPORT">
              <ReportsPage />
            </PermissionGuard>
          }
        />
        <Route
          path="system"
          element={
            <PermissionGuard permission="PERM_TENANT_MANAGE">
              <SystemPage />
            </PermissionGuard>
          }
        />
      </Route>

      {/* 6. Error Pages & Fallbacks */}
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
