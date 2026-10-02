import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';
import { TenantGuard } from './TenantGuard';
import { RoleGuard } from './RoleGuard';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { DashboardOverviewPage } from '../pages/DashboardOverviewPage';
import { UsersManagementPage } from '../pages/UsersManagementPage';
import { FarmsPage } from '../pages/FarmsPage';
import { FarmDetailPage } from '../pages/FarmDetailPage';
import { EnterpriseManagementPage } from '../pages/EnterpriseManagementPage';
import { PartnersPage } from '../pages/PartnersPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { SelectTenantPage } from '../pages/SelectTenantPage';

// Phase 3 Pages
import { CropsPage } from '../features/crops/CropsPage';
import { LivestockPage } from '../features/livestock/LivestockPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { ProductBatchListPage } from '../features/traceability/ProductBatchListPage';
import { PublicTraceabilityPage } from '../features/traceability/PublicTraceabilityPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes - Khách vãng lai quét mã QR tem chống giả VietGAP */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/traceability/:code" element={<PublicTraceabilityPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Tenant selection if not selected */}
        <Route path="/select-tenant" element={<SelectTenantPage />} />

        {/* Routes requiring active Tenant */}
        <Route element={<TenantGuard />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardOverviewPage />} />
            
            {/* RBAC Protected: Only SUPER_ADMIN and FARM_OWNER */}
            <Route
              path="/users"
              element={
                <RoleGuard allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER']}>
                  <UsersManagementPage />
                </RoleGuard>
              }
            />

            {/* Phase 2: Core SaaS Module 1 Routes */}
            <Route path="/enterprise" element={<EnterpriseManagementPage />} />
            <Route path="/farms" element={<FarmsPage />} />
            <Route path="/farms/:farmId" element={<FarmDetailPage />} />
            <Route path="/partners" element={<PartnersPage />} />

            {/* Phase 3: Core Production & Inventory & Traceability Routes */}
            <Route path="/crops" element={<CropsPage />} />
            <Route path="/livestock" element={<LivestockPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/traceability" element={<ProductBatchListPage />} />

            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

