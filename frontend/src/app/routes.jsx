import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Guards
import { AuthGuard } from './guards/AuthGuard';
import { MustChangePasswordGuard } from './guards/MustChangePasswordGuard';
import { RoleScopeGuard } from './guards/RoleScopeGuard';
import { AdminGuard } from './guards/AdminGuard';
import { PermissionGuard } from './guards/PermissionGuard';

// Layouts
import {
  AuthLayout,
  PlatformLayout,
  TenantAppLayout,
  PublicLayout,
} from '@/components/layout';

// Pages - Auth
import {
  LoginPage,
  RegisterPage,
  ForceChangePasswordPage,
} from '@/pages/auth';

// Pages - Super Admin Portal (/admin/*)
import {
  AdminLayout,
  AdminDashboardPage,
  AdminFarmsPage,
  AdminPackagesPage,
  AdminTransactionsPage,
} from '@/pages/admin';

// Pages - Platform & Public & Onboarding
import { PlatformDashboardPage } from '@/pages/platform';
import {
  HomePage,
  FeaturesPage,
  PlatformIntroPage,
  GuidesPage,
  ContactPage,
  LandingPage,
} from '@/pages/public';
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage';

// 10 Chức Năng Chuẩn FarmGo (Gia Súc & Gia Cầm)
import {
  DashboardPage,
  BarnsPage,
  DailyLogsPage,
  InventoryPage,
  InternalTransfersPage,
  PurchaseInvoicesPage,
  SalesPage,
  CashbookPage,
  WorkforcePage,
  LivestockSettingsPage,
  GeneralSettingsPage,
  BranchesPage,
  PayrollKpiPage,
  CustomRolesPage,
  BreedingLivestockPage,
  HatcheryPage,
  FeedProductionPage,
} from '@/pages/farm';

// Standalone Pages
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Bộ điều phối route /platform:
 * - Khi Super Admin đã đăng nhập -> Mở Bảng điều khiển quản trị nền tảng SaaS (PlatformLayout)
 * - Khi là Khách vãng lai / Chủ trang trại -> Mở Trang giới thiệu Nền tảng quản trị & Bảng giá
 */
function PlatformDispatcher() {
  const location = useLocation();
  const { isAuthenticated, isSuperAdmin } = useAuthStore();
  const isSuper = typeof isSuperAdmin === 'function' ? isSuperAdmin() : false;

  if (isAuthenticated && isSuper) {
    return (
      <MustChangePasswordGuard>
        <RoleScopeGuard scope="PLATFORM">
          <AdminLayout />
        </RoleScopeGuard>
      </MustChangePasswordGuard>
    );
  }

  // Chặn tài khoản trang trại (không phải Super Admin) truy cập chéo vào /platform/*
  if (isAuthenticated && !isSuper) {
    return <Navigate to="/app/dashboard" replace />;
  }

  // Các đường dẫn quản trị con (/platform/dashboard, /platform/tenants...) dùng AuthGuard
  // để tự động Silent Refresh Token khi tải lại trang (F5) trước khi chuyển hướng /login
  if (location.pathname !== '/platform' && location.pathname !== '/platform/') {
    return (
      <AuthGuard>
        <MustChangePasswordGuard>
          <RoleScopeGuard scope="PLATFORM">
            <AdminLayout />
          </RoleScopeGuard>
        </MustChangePasswordGuard>
      </AuthGuard>
    );
  }

  return (
    <PublicLayout>
      <PlatformIntroPage />
    </PublicLayout>
  );
}

/**
 * Điều hướng trang đích ban đầu cho người dùng trang trại chăn nuôi
 */
function TenantIndexRedirect() {
  const { userInfo } = useAuthStore();

  // Nếu người dùng chưa có trang trại chăn nuôi nào -> sang Onboarding
  if (!userInfo?.accessibleFarms || userInfo.accessibleFarms.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  // Mặc định vào Trang Tổng quan (Dashboard)
  return <Navigate to="/app/dashboard" replace />;
}

/**
 * Master Application Routing System (Farm SaaS v2.0)
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Portal Shell (Trang chủ, Tính năng, Hướng dẫn, Liên hệ, Nền tảng) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/guide" element={<GuidesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/platform-intro" element={<PlatformIntroPage />} />
      </Route>

      {/* 2. Auth Shell (/login, /register, /force-change-password) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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

      {/* 3. Onboarding Shell (Khi chưa có trang trại) */}
      <Route
        path="/onboarding"
        element={
          <AuthGuard>
            <OnboardingPage />
          </AuthGuard>
        }
      />

      {/* 4. Super Admin Portal Shell (/admin/*) - Bảo vệ nghiêm ngặt bằng AuthGuard + AdminGuard */}
      <Route
        path="/admin"
        element={
          <AuthGuard>
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="farms" element={<AdminFarmsPage />} />
        <Route path="packages" element={<AdminPackagesPage />} />
        <Route path="transactions" element={<AdminTransactionsPage />} />
      </Route>

      {/* 5. Platform Shell (/platform/* - Đồng bộ hoàn toàn sang Super Admin Portal mới) */}
      <Route
        path="/platform"
        element={<PlatformDispatcher />}
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="tenants" element={<AdminFarmsPage />} />
        <Route path="farms" element={<AdminFarmsPage />} />
        <Route path="subscriptions" element={<AdminPackagesPage />} />
        <Route path="packages" element={<AdminPackagesPage />} />
        <Route path="transactions" element={<AdminTransactionsPage />} />
        <Route path="users" element={<AdminFarmsPage />} />
        <Route path="audit-logs" element={<AdminTransactionsPage />} />
        <Route path="health" element={<AdminDashboardPage />} />
      </Route>

      {/* 5. Tenant App Shell (/app/* - 10 Chức Năng Chuẩn FarmGo) */}
      <Route
        path="/app"
        element={
          <AuthGuard>
            <MustChangePasswordGuard>
              <RoleScopeGuard scope="TENANT">
                <TenantAppLayout />
              </RoleScopeGuard>
            </MustChangePasswordGuard>
          </AuthGuard>
        }
      >
        <Route index element={<TenantIndexRedirect />} />

        {/* 10 Chức Năng Chính — Bảo vệ bằng PermissionGuard chống vượt URL trực tiếp */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="barns" element={<PermissionGuard permission="barns.view"><BarnsPage /></PermissionGuard>} />
        <Route path="barns/:barnId" element={<PermissionGuard permission="barns.view"><BarnsPage /></PermissionGuard>} />
        <Route path="barns/:barnId/batch/:batchId" element={<PermissionGuard permission="barns.view"><BarnsPage /></PermissionGuard>} />
        <Route path="daily-logs" element={<PermissionGuard permission="daily_logs.view"><DailyLogsPage /></PermissionGuard>} />
        <Route path="inventory" element={<PermissionGuard permission="inventory.view"><InventoryPage /></PermissionGuard>} />
        <Route path="internal-transfers" element={<PermissionGuard anyPermissions={['internal_transfers.view', 'inventory.view', 'transfers.view']}><InternalTransfersPage /></PermissionGuard>} />
        <Route path="purchase-invoices" element={<PermissionGuard permission="purchase_invoices.view"><PurchaseInvoicesPage /></PermissionGuard>} />
        <Route path="sales" element={<PermissionGuard permission="sales.view"><SalesPage /></PermissionGuard>} />
        <Route path="cashbook" element={<PermissionGuard permission="cashbook.view"><CashbookPage /></PermissionGuard>} />
        <Route path="workforce" element={<PermissionGuard permission="workforce.view"><WorkforcePage /></PermissionGuard>} />
        <Route path="livestock-settings" element={<PermissionGuard permission="livestock_settings.view"><LivestockSettingsPage /></PermissionGuard>} />
        <Route path="general-settings" element={<PermissionGuard permission="general_settings.view"><GeneralSettingsPage /></PermissionGuard>} />
        <Route path="branches" element={<PermissionGuard permission="branches.view" addonCode="MULTI_BRANCH"><BranchesPage /></PermissionGuard>} />

        {/* 5 Phân hệ mở rộng Add-ons — Bảo vệ bằng PermissionGuard + Addon Feature Gating */}
        <Route path="payroll-kpi" element={<PermissionGuard permission="payroll.view" addonCode="PAYROLL"><PayrollKpiPage /></PermissionGuard>} />
        <Route path="payroll" element={<Navigate to="/app/payroll-kpi" replace />} />

        <Route path="custom-roles" element={<PermissionGuard permission="roles.view" addonCode="CUSTOM_ROLES"><CustomRolesPage /></PermissionGuard>} />
        <Route path="roles" element={<Navigate to="/app/custom-roles" replace />} />

        <Route path="breeding-livestock" element={<PermissionGuard permission="breeding.view" addonCode="BREEDING"><BreedingLivestockPage /></PermissionGuard>} />
        <Route path="breeding" element={<Navigate to="/app/breeding-livestock" replace />} />

        <Route path="hatchery" element={<PermissionGuard permission="poultry_hatchery.view" addonCode="HATCHERY"><HatcheryPage /></PermissionGuard>} />
        <Route path="poultry-hatchery" element={<Navigate to="/app/hatchery" replace />} />

        <Route path="feed-production" element={<PermissionGuard permission="feed_mill.view" addonCode="FEED_MILL"><FeedProductionPage /></PermissionGuard>} />
        <Route path="feed-mill" element={<Navigate to="/app/feed-production" replace />} />

        {/* Chuyển hướng tương thích ngược từ các đường dẫn cũ */}
        <Route path="geography" element={<Navigate to="/app/barns" replace />} />
        <Route path="farming" element={<Navigate to="/app/daily-logs" replace />} />
        <Route path="farming/*" element={<Navigate to="/app/daily-logs" replace />} />
        <Route path="farming-ops" element={<Navigate to="/app/daily-logs" replace />} />
        <Route path="farming-ops/*" element={<Navigate to="/app/daily-logs" replace />} />
        <Route path="my-dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="daily-ops" element={<Navigate to="/app/daily-logs" replace />} />
        <Route path="hr" element={<Navigate to="/app/workforce" replace />} />
        <Route path="cost-accounting" element={<Navigate to="/app/cashbook" replace />} />
        <Route path="sales-cashflow" element={<Navigate to="/app/sales" replace />} />
        <Route path="qa-traceability" element={<Navigate to="/app/sales" replace />} />
        <Route path="partners" element={<Navigate to="/app/general-settings" replace />} />
        <Route path="settings" element={<Navigate to="/app/general-settings" replace />} />
        <Route path="reports" element={<Navigate to="/app/cashbook" replace />} />
        <Route path="system" element={<Navigate to="/app/general-settings" replace />} />
      </Route>

      {/* 6. Error Pages & Fallbacks */}
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
