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
import { NotificationsPage } from '../pages/NotificationsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { SelectTenantPage } from '../pages/SelectTenantPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

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

            <Route path="/farms" element={<FarmsPage />} />
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
