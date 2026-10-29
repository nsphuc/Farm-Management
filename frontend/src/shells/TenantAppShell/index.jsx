import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TopBar } from '@/components/layout/TopBar';
import { DynamicSidebar } from '@/components/layout/DynamicSidebar';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
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
  const roleInfo = getOperationalRoleInfo();

  // Khóa chặt activeFarmId vào đúng trang trại phụ trách đối với Role 2 (FarmManager) và các Role bị khóa
  useEffect(() => {
    if (!userInfo || isOwner()) return;

    if (isFarmManager() || isFarmLocked()) {
      const accessibleFarms = userInfo.accessibleFarms || [];
      if (accessibleFarms.length > 0) {
        // Tìm trại mà user được bổ nhiệm làm quản lý (isManager = true hoặc assignedRole = 'FARM_MANAGER')
        const appointedFarm =
          accessibleFarms.find(
            (f) =>
              f.isManager ||
              f.assignedRole === 'FARM_MANAGER' ||
              Number(f.managerUserId) === Number(userInfo.id)
          ) || accessibleFarms[0];

        if (appointedFarm) {
          const appointedId = Number(appointedFarm.farmId || appointedFarm.id);
          if (Number(activeFarmId) !== appointedId) {
            setActiveFarmId(appointedId, accessibleFarms);
          }
        }
      }
    }
  }, [userInfo, isFarmLocked, isFarmManager, isOwner, activeFarmId, setActiveFarmId]);

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

        {/* Banner Vận Hành Dành Riêng Cho Từng Nhóm Role */}
        {/* Role 2: Giám Đốc / Quản lý 1 Trang trại (Bắt buộc chấm công GPS + Selfie) */}
        {isFarmManager() && !location.pathname.includes('/my-dashboard') && (
          <div className="flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 text-xs text-blue-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                <Camera className="h-3 w-3" />
              </span>
              <span>
                <strong className="font-semibold">Nhiệm vụ Quản lý Trang trại:</strong> Bạn được phân công điều hành{' '}
                <span className="font-bold underline">{activeFarm?.farmName || activeFarm?.name || 'Trang trại'}</span>. Bắt buộc chấm công GPS + Chụp ảnh Selfie hàng ngày.
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/my-dashboard')}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 font-semibold text-white hover:bg-blue-700 transition-colors shadow-2xs"
            >
              <span>Chấm công GPS</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Role 3B: Trưởng Phân Khu / Tổ Trưởng Hiện Trường Banner */}
        {isZoneManager && isZoneManager() && !location.pathname.includes('/my-dashboard') && (
          <div className="flex items-center justify-between border-b border-sky-200 bg-sky-50 px-4 py-2 text-xs text-sky-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white">
                <MapPin className="h-3 w-3" />
              </span>
              <span>
                <strong className="font-semibold">Bàn Chỉ Huy Phân Khu:</strong> Bạn đang phụ trách phân khu tại{' '}
                <span className="font-bold underline">{activeFarm?.farmName || activeFarm?.name || 'Trang trại'}</span>. Thực hiện chấm công tổ và giám sát sản xuất tại WS-G & WS-A.
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/my-dashboard')}
              className="flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1 font-semibold text-white hover:bg-sky-700 transition-colors shadow-2xs"
            >
              <span>Vào Điểm Danh Tổ</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Role 6A: Nhân viên hiện trường Mobile-First Banner */}
        {isFieldWorker() && !location.pathname.includes('/my-dashboard') && (
          <div className="flex items-center justify-between border-b border-teal-200 bg-teal-50/90 px-4 py-2 text-xs text-teal-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-teal-600" />
              <span>
                <strong>Giao diện Tinh gọn Hiện trường:</strong> Bạn đang ở chế độ nhân viên nông vụ. Bàn làm việc chính là Bảng Tác Nghiệp Hàng Ngày.
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/my-dashboard')}
              className="flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 font-semibold text-white hover:bg-teal-700 transition-colors"
            >
              <span>Vào Bảng Tác Nghiệp</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Workspace Canvas Outlet được bảo vệ bởi ErrorBoundary */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <ErrorBoundary>
            <div key={location.pathname} className="animate-in fade-in duration-200 ease-out">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export { getSidebarMenuConfig, ALL_WORKSPACES, ALL_INDEPENDENT_MODULES } from './menuConfig';
export default TenantAppShell;
