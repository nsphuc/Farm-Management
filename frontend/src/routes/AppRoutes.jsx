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

// Phase 4 Pages
import { EmployeeListPage } from '../features/hr/EmployeeListPage';
import { WorkShiftPage } from '../features/hr/WorkShiftPage';
import { GpsAttendancePage } from '../features/hr/GpsAttendancePage';
import { LeaveOvertimePage } from '../features/hr/LeaveOvertimePage';
import { TaskKanbanBoardPage } from '../features/tasks/TaskKanbanBoardPage';
import { ExpenseListPage } from '../features/finance/ExpenseListPage';
import { UnitCostCalculatorPage } from '../features/finance/UnitCostCalculatorPage';
import { SalesOrderListPage } from '../features/finance/SalesOrderListPage';
import { DebtAgingReportPage } from '../features/finance/DebtAgingReportPage';
import { BudgetVsActualPage } from '../features/finance/BudgetVsActualPage';
import { CostCategoryPage } from '../features/finance/CostCategoryPage';

// Phase 5 Pages
import { AnalyticsDashboardPage } from '../features/analytics/AnalyticsDashboardPage';
import { TermsPage } from '../pages/legal/TermsPage';
import { PrivacyPage } from '../pages/legal/PrivacyPage';

// Role & State
import { useAuthStore, normalizeRole } from '../stores/useAuthStore';

/**
 * Router điều hướng thông minh cho trang Root/Dashboard theo Role
 * - FIELD_STAFF: Mobile-first, điều hướng thẳng tới Danh sách việc cần làm /tasks
 * - WAREHOUSE_STAFF: Điều hướng thẳng tới Quản lý Kho vật tư /inventory
 * - ACCOUNTANT: Điều hướng thẳng tới Tính giá thành /finance/unit-cost
 * - SUPER_ADMIN, FARM_OWNER, TECHNICAL_STAFF: Xem Dashboard tổng quan
 */
const RoleBasedDashboard = () => {
  const currentUser = useAuthStore((state) => state.currentUser || state.user);
  const role = normalizeRole(currentUser?.role);

  switch (role) {
    case 'FIELD_STAFF':
      return <Navigate to="/tasks" replace />;
    case 'WAREHOUSE_STAFF':
      return <Navigate to="/inventory" replace />;
    case 'ACCOUNTANT':
      return <Navigate to="/finance/unit-cost" replace />;
    default:
      return <DashboardOverviewPage />;
  }
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Public Routes (Khách vãng lai quét mã QR tem chống giả & Pháp lý) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/traceability/:code" element={<PublicTraceabilityPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* 2. Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Lựa chọn Tenant */}
        <Route path="/select-tenant" element={<SelectTenantPage />} />

        {/* Các route yêu cầu đã kích hoạt Tenant */}
        <Route element={<TenantGuard />}>
          <Route element={<DashboardLayout />}>
            {/* Trang chủ điều hướng thông minh theo từng vai trò */}
            <Route index element={<RoleBasedDashboard />} />
            <Route path="/dashboard" element={<RoleBasedDashboard />} />

            {/* ========================================================
                1. PHÂN HỆ QUẢN TRỊ HỆ THỐNG (CHỈ SUPER_ADMIN)
                - SUPER ADMIN: Quản trị tài khoản, phân quyền, Doanh nghiệp HTX
                - Tuyệt đối ẩn với Farm Owner và các nhân viên
               ======================================================== */}
            <Route
              path="/users"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN']}>
                  <UsersManagementPage />
                </RoleGuard>
              }
            />
            <Route
              path="/enterprise"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN']}>
                  <EnterpriseManagementPage />
                </RoleGuard>
              }
            />
            <Route
              path="/farms"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'FARM_OWNER']}>
                  <FarmsPage />
                </RoleGuard>
              }
            />
            <Route
              path="/farms/:farmId"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'FARM_OWNER']}>
                  <FarmDetailPage />
                </RoleGuard>
              }
            />

            {/* ========================================================
                2. PHÂN HỆ SẢN XUẤT (TRỒNG TRỌT & CHĂN NUÔI)
                - Quyền: FARM_OWNER (quản lý), TECHNICAL_STAFF (kỹ thuật, phác đồ), SUPER_ADMIN (view)
                - Cấm hoàn toàn: FIELD_STAFF, WAREHOUSE_STAFF, ACCOUNTANT
               ======================================================== */}
            <Route
              path="/crops"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'FARM_OWNER', 'TECHNICAL_STAFF']}>
                  <CropsPage />
                </RoleGuard>
              }
            />
            <Route
              path="/livestock"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'FARM_OWNER', 'TECHNICAL_STAFF']}>
                  <LivestockPage />
                </RoleGuard>
              }
            />

            {/* ========================================================
                3. PHÂN HỆ KHO VẬT TƯ & TỒN KHO
                - Quyền: FARM_OWNER, WAREHOUSE_STAFF (thao tác xuất/nhập/kiểm kê),
                  ACCOUNTANT (tính giá vốn), TECHNICAL_STAFF (chỉ xem tồn), SUPER_ADMIN (view)
                - Cấm hoàn toàn: FIELD_STAFF
               ======================================================== */}
            <Route
              path="/inventory"
              element={
                <RoleGuard
                  allowedRoles={[
                    'SUPER_ADMIN',
                    'FARM_OWNER',
                    'WAREHOUSE_STAFF',
                    'TECHNICAL_STAFF',
                    'ACCOUNTANT',
                  ]}
                >
                  <InventoryPage />
                </RoleGuard>
              }
            />

            {/* ========================================================
                4. PHÂN HỆ LÔ THÀNH PHẨM & TEM QR TRUY XUẤT NGUỒN GỐC
                - Quyền: FARM_OWNER (Cổng duyệt QR, thu hồi), WAREHOUSE_STAFF (in tem nhiệt, tạo lô), SUPER_ADMIN (view)
                - Cấm hoàn toàn: FIELD_STAFF, ACCOUNTANT, TECHNICAL_STAFF
               ======================================================== */}
            <Route
              path="/traceability"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'FARM_OWNER', 'WAREHOUSE_STAFF']}>
                  <ProductBatchListPage />
                </RoleGuard>
              }
            />

            {/* ========================================================
                5. PHÂN HỆ NHÂN SỰ & CHẤM CÔNG GPS
                - Danh sách nhân sự & Phân ca: SUPER_ADMIN, FARM_OWNER
                - Chấm công GPS: Tất cả nhân viên thực địa và quản lý
                - Nghỉ phép & Tăng ca: FARM_OWNER, SUPER_ADMIN
               ======================================================== */}
            <Route
              path="/hr/employees"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'FARM_OWNER']}>
                  <EmployeeListPage />
                </RoleGuard>
              }
            />
            <Route
              path="/hr/shifts"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'FARM_OWNER']}>
                  <WorkShiftPage />
                </RoleGuard>
              }
            />
            <Route
              path="/hr/attendance"
              element={
                <RoleGuard
                  allowedRoles={[
                    'SUPER_ADMIN',
                    'FARM_OWNER',
                    'FIELD_STAFF',
                    'WAREHOUSE_STAFF',
                    'TECHNICAL_STAFF',
                    'ACCOUNTANT',
                  ]}
                >
                  <GpsAttendancePage />
                </RoleGuard>
              }
            />
            <Route
              path="/hr/leave-overtime"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'FARM_OWNER']}>
                  <LeaveOvertimePage />
                </RoleGuard>
              }
            />

            {/* ========================================================
                6. ĐIỀU PHỐI CÔNG VIỆC HIỆN TRƯỜNG (KANBAN & MY TASKS)
                - Quyền: FIELD_STAFF (My tasks), FARM_OWNER (Giao việc), TECHNICAL_STAFF
                - Cấm hoàn toàn: ACCOUNTANT, WAREHOUSE_STAFF
               ======================================================== */}
            <Route
              path="/tasks"
              element={
                <RoleGuard allowedRoles={['FIELD_STAFF', 'FARM_OWNER', 'TECHNICAL_STAFF']}>
                  <TaskKanbanBoardPage />
                </RoleGuard>
              }
            />

            {/* ========================================================
                7. PHÂN HỆ TÀI CHÍNH & GIÁ THÀNH NÔNG SẢN
                - Quyền: FARM_OWNER, ACCOUNTANT (Kế toán)
                - Cấm hoàn toàn: FIELD_STAFF, TECHNICAL_STAFF, WAREHOUSE_STAFF
               ======================================================== */}
            <Route
              path="/finance/expenses"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'FARM_OWNER', 'ACCOUNTANT']}>
                  <ExpenseListPage />
                </RoleGuard>
              }
            />
            <Route
              path="/finance/unit-cost"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'FARM_OWNER', 'ACCOUNTANT']}>
                  <UnitCostCalculatorPage />
                </RoleGuard>
              }
            />
            <Route
              path="/finance/sales-orders"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'FARM_OWNER', 'ACCOUNTANT']}>
                  <SalesOrderListPage />
                </RoleGuard>
              }
            />
            <Route
              path="/finance/debts"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'FARM_OWNER', 'ACCOUNTANT']}>
                  <DebtAgingReportPage />
                </RoleGuard>
              }
            />
            <Route
              path="/finance/budgets"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'FARM_OWNER', 'ACCOUNTANT']}>
                  <BudgetVsActualPage />
                </RoleGuard>
              }
            />
            <Route
              path="/finance/cost-categories"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'FARM_OWNER', 'ACCOUNTANT']}>
                  <CostCategoryPage />
                </RoleGuard>
              }
            />

            {/* ========================================================
                8. ĐỐI TÁC, BÁO CÁO & CÀI ĐẶT
               ======================================================== */}
            <Route
              path="/partners"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'FARM_OWNER']}>
                  <PartnersPage />
                </RoleGuard>
              }
            />
            <Route
              path="/analytics"
              element={
                <RoleGuard
                  allowedRoles={['SUPER_ADMIN', 'FARM_OWNER', 'TECHNICAL_STAFF', 'ACCOUNTANT']}
                >
                  <AnalyticsDashboardPage />
                </RoleGuard>
              }
            />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route
              path="/settings"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'FARM_OWNER']}>
                  <SettingsPage />
                </RoleGuard>
              }
            />
          </Route>
        </Route>
      </Route>

      {/* Fallback điều hướng an toàn */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
