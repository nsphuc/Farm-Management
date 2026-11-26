import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TopBar } from '@/components/layout/TopBar';
import { DynamicSidebar } from '@/components/layout/DynamicSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { AlertCircle, Camera, CheckCircle2, ChevronRight, MapPin, Smartphone } from 'lucide-react';

/**
 * TenantAppShell - Khung Ứng Dụng Nghiệp Vụ Chính (Mục 1.1.3 File 08)
 * Nhận diện chính xác 6 Vai trò Vận hành thực tế (ADR-Role-Hierarchy):
 * 1. isOwner: Tuyệt đối không cần chấm công (ẩn toàn bộ giao diện chấm công cá nhân).
 * 2. isFarmManager: Khóa chặt activeFarmId vào trại phụ trách. Bắt buộc chấm công GPS + Selfie.
 * 3. isTechnicalLead: Phụ trách kỹ thuật & điểm danh hộ công nhân không có tài khoản.
 * 4. isWarehouseKeeper: Phụ trách kho bãi & điểm danh hộ bốc xếp kho không có tài khoản.
 * 5. isFarmAccountant: Kế toán trại, phụ trách chi phí, doanh thu VietQR và kết toán.
 * 6. isFieldWorker: Giao diện tinh gọn Mobile-First phục vụ chấm công và báo cáo tác nghiệp.
 */
export function TenantAppShell() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    userInfo,
    isOwner,
    isFarmManager,
    isZoneManager,
    isFieldWorker,
    isFarmLocked,
    getOperationalRoleInfo,
  } = useAuthStore();

  const { activeFarmId, activeFarm, setActiveFarmId } = useActiveFarmStore();
  const { currentBranchId, setBranches, setCurrentBranchId } = useActiveBranchStore();
  const roleInfo = getOperationalRoleInfo();

  // Đồng bộ activeFarmId và currentBranchId theo đúng trang trại & chi nhánh của user đăng nhập (SAAS-01)
  useEffect(() => {
    if (!userInfo) return;
    const accessibleFarms = userInfo.accessibleFarms || [];
    if (accessibleFarms.length > 0) {
      const validFarmIds = accessibleFarms.map((f) => Number(f.farmId || f.id));
      const isCurrentFarmValid = activeFarmId && activeFarmId !== 'ALL' && validFarmIds.includes(Number(activeFarmId));

      if (!isOwner() && (isFarmManager() || isFarmLocked())) {
        const appointedFarm =
          accessibleFarms.find(
            (f) =>
              f.isManager ||
              f.assignedRole === 'FARM_MANAGER' ||
              Number(f.managerUserId) === Number(userInfo.id)
          ) || accessibleFarms[0];
        const appointedId = Number(appointedFarm.farmId || appointedFarm.id);
        if (Number(activeFarmId) !== appointedId) {
          setActiveFarmId(appointedId, accessibleFarms);
        }
      } else if (!isCurrentFarmValid) {
        const firstFarmId = validFarmIds[0];
        if (firstFarmId) {
          setActiveFarmId(firstFarmId, accessibleFarms);
        }
      }
    }

    const userBranches = userInfo.branches || [];
    if (userBranches.length > 0) {
      const validBranchIds = userBranches.map((b) => Number(b.id));
      const isCurrentBranchValid =
        (isOwner() && currentBranchId === 'ALL') ||
        (currentBranchId && currentBranchId !== 'ALL' && validBranchIds.includes(Number(currentBranchId)));
      if (!isCurrentBranchValid) {
        setBranches(userBranches);
        setCurrentBranchId(userBranches[0].id);
      }
    }
  }, [userInfo, isFarmLocked, isFarmManager, isOwner, activeFarmId, currentBranchId, setActiveFarmId, setBranches, setCurrentBranchId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Dynamic Sidebar */}
      <DynamicSidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main View Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Universal TopBar */}
        <TopBar onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

        {/* Role 6A: Nhân viên hiện trường Mobile-First Banner */}
        {isFieldWorker() && !location.pathname.includes('/my-dashboard') && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-teal-200 bg-teal-50/90 px-3 sm:px-4 py-2 text-xs text-teal-900 gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 shrink-0 text-teal-600" />
              <span>
                <strong>Giao diện Tinh gọn Hiện trường:</strong> Bạn đang ở chế độ nhân viên nông vụ. Bàn làm việc chính là Bảng Tác Nghiệp Hàng Ngày.
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/my-dashboard')}
              className="flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 font-semibold text-white hover:bg-teal-700 transition-colors shrink-0 self-end sm:self-auto"
            >
              <span>Vào Bảng Tác Nghiệp</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Workspace Canvas Outlet được bảo vệ bởi ErrorBoundary */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <ErrorBoundary>
            <div key={location.pathname} className="animate-in fade-in duration-200 ease-out">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>

        {/* Mobile Bottom Navigation for handheld field devices */}
        <MobileBottomNav
          onOpenMenu={() => setIsMobileMenuOpen(true)}
          onOpenScanner={() => window.dispatchEvent(new CustomEvent('open-quick-scanner'))}
        />
      </div>
    </div>
  );
}

export const TenantAppLayout = TenantAppShell;
export { getSidebarMenuConfig, FARM_MENU_ITEMS, ALL_WORKSPACES, ALL_INDEPENDENT_MODULES } from './menuConfig';
export default TenantAppShell;
