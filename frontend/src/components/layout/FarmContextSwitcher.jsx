import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Building2, Check, MapPin, Lock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { cn } from '@/utils/formatters';

const FARM_TYPE_LABELS = {
  CROP: 'Trồng trọt',
  LIVESTOCK: 'Chăn nuôi',
  AQUACULTURE: 'Thủy sản',
  MIXED: 'Hỗn hợp',
};

/**
 * FarmContextSwitcher Component (Mục 1.1.3 File 08 & Tiêu chí 7 File 10)
 * Dropdown chọn trang trại đang tác nghiệp trên TopBar toàn cục.
 * - Role 1 (isOwner): Tự do chuyển đổi toàn bộ chuỗi trang trại của doanh nghiệp.
 * - Role 2 (isFarmManager): Khóa cứng vào đúng trang trại mình phụ trách.
 * Tự động đồng bộ vào useActiveFarmStore và URL search param ?farmId=...
 */
export function FarmContextSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, isOwner, isFarmLocked, isFarmManager } = useAuthStore();
  const {
    activeFarmId,
    activeFarm,
    setActiveFarmId,
    farms: storeFarms,
    dataVersion,
    fetchFarms,
  } = useActiveFarmStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const accessibleFarms = storeFarms && storeFarms.length > 0 ? storeFarms : (userInfo?.accessibleFarms || []);
  const locked = isFarmLocked();

  // Tự động tải/cập nhật danh sách trang trại khi dataVersion thay đổi (tạo/sửa farm/zone ở WS-A)
  useEffect(() => {
    fetchFarms();
  }, [dataVersion]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectFarm = (farm) => {
    const isAll = farm.farmId === 'ALL' || farm.id === 'ALL';
    const fId = isAll ? 'ALL' : Number(farm.farmId || farm.id);
    setActiveFarmId(fId, accessibleFarms);
    setIsOpen(false);

    // Đồng bộ lên query param ?farmId=... trên URL hiện tại
    const searchParams = new URLSearchParams(location.search);
    if (isAll) {
      searchParams.set('farmId', 'ALL');
    } else {
      searchParams.set('farmId', fId);
    }
    navigate({
      pathname: location.pathname,
      search: searchParams.toString(),
    }, { replace: true });
  };

  if (!accessibleFarms || accessibleFarms.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
        <Building2 className="h-4 w-4 text-slate-400" />
        <span>Chưa gán trang trại</span>
      </div>
    );
  }

  const isAllSelected = activeFarmId === 'ALL';
  const currentFarm = isAllSelected
    ? { farmName: 'Tất cả trang trại toàn chuỗi', name: 'Tất cả trang trại toàn chuỗi', id: 'ALL' }
    : activeFarm ||
      accessibleFarms.find((f) => Number(f.farmId || f.id) === Number(activeFarmId)) ||
      accessibleFarms[0];

  // 1. Role 2: Giám Đốc Trang Trại (FARM_MANAGER) - KHÓA CỐ ĐỊNH 100% VÀO TRẠI PHỤ TRÁCH
  if (isFarmManager()) {
    const fmFarm =
      accessibleFarms.find(
        (f) =>
          f.isManager ||
          f.assignedRole === 'FARM_MANAGER' ||
          Number(f.managerUserId) === Number(userInfo?.id)
      ) ||
      (activeFarm && activeFarm.id !== 'ALL' && activeFarm.id ? activeFarm : accessibleFarms[0]);

    const farmDisplayName =
      fmFarm?.farmName ||
      fmFarm?.name ||
      activeFarm?.farmName ||
      activeFarm?.name ||
      'Trang Trại';

    return (
      <div
        className="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/80 px-3.5 py-1.5 text-left text-xs shadow-2xs select-none"
        title={`📍 Giám Đốc Trang Trại: Đã khóa cố định dữ liệu vào ${farmDisplayName}`}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs shrink-0">
          <MapPin className="h-4 w-4" />
        </div>
        <div className="flex flex-col pr-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">
              Trại Phụ Trách
            </span>
            <span className="rounded bg-blue-200/90 px-1.5 py-0.2 text-[9px] font-bold text-blue-900 border border-blue-300">
              Cố Định
            </span>
          </div>
          <span className="truncate font-extrabold text-slate-900 text-xs sm:max-w-[320px]">
            📍 {farmDisplayName} - Giám Đốc Trại
          </span>
        </div>
      </div>
    );
  }

  // 2. Các Role nhân sự bị khóa chặt khác (Kỹ thuật, Thủ kho, Kế toán trại, Nông vụ)
  if (locked) {
    const assignedFarm =
      (activeFarm && activeFarm.id !== 'ALL' ? activeFarm : null) ||
      accessibleFarms[0];
    const farmDisplayName = assignedFarm?.farmName || assignedFarm?.name || 'Trang Trại';

    return (
      <div
        className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-1.5 text-left text-xs shadow-2xs select-none"
        title="Trang trại phân công (Cố định, không thể chuyển đổi)"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 text-slate-700 ring-1 ring-slate-300 shrink-0">
          <Lock className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col pr-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Trang trại
            </span>
            <span className="rounded bg-slate-200 px-1 py-0.2 text-[9px] font-bold text-slate-700">
              Cố định
            </span>
          </div>
          <span className="max-w-[180px] truncate font-bold text-slate-900 text-xs sm:max-w-[240px]">
            📍 {farmDisplayName}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-left text-xs shadow-2xs transition-all focus:outline-none focus:ring-2',
          isAllSelected
            ? 'border-amber-300 bg-amber-50/60 hover:bg-amber-100/50 focus:ring-amber-500/20'
            : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-slate-50/80 focus:ring-emerald-500/20'
        )}
      >
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg ring-1',
            isAllSelected
              ? 'bg-amber-100 text-amber-800 ring-amber-300'
              : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
          )}
        >
          <Building2 className="h-4 w-4" />
        </div>

        <div className="flex flex-col pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
              Trang trại tác nghiệp
            </span>
            {isOwner() && (
              <span
                className={cn(
                  'rounded px-1 py-0.2 text-[9px] font-bold',
                  isAllSelected
                    ? 'bg-amber-200 text-amber-900 border border-amber-300'
                    : 'bg-amber-100 text-amber-800'
                )}
              >
                {isAllSelected ? 'Toàn chuỗi (ALL)' : 'Toàn chuỗi'}
              </span>
            )}
          </div>
          <span className="max-w-[160px] truncate font-bold text-slate-900 text-xs sm:max-w-[200px]">
            {currentFarm?.farmName || currentFarm?.name || 'Chọn trang trại'}
          </span>
        </div>

        <ChevronDown
          className={cn(
            'h-4 w-4 text-slate-400 transition-transform duration-200',
            isOpen && (isAllSelected ? 'rotate-180 text-amber-600' : 'rotate-180 text-emerald-600')
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600">
              Danh sách được cấp quyền ({accessibleFarms.length})
            </span>
            {isOwner() && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                Owner Mode
              </span>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1">
            {/* Tùy chọn ALL - Dành riêng cho Chủ đầu tư (isOwner) */}
            {isOwner() && (
              <button
                type="button"
                onClick={() =>
                  handleSelectFarm({
                    id: 'ALL',
                    farmId: 'ALL',
                    name: 'Tất cả trang trại toàn chuỗi',
                    farmName: 'Tất cả trang trại toàn chuỗi',
                  })
                }
                className={cn(
                  'w-full flex items-center justify-between rounded-xl p-2.5 text-left text-xs transition-colors border-b border-slate-100 mb-1',
                  isAllSelected
                    ? 'bg-amber-50 text-amber-950 font-bold border border-amber-300 shadow-2xs'
                    : 'hover:bg-amber-50/50 text-slate-700'
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg text-xs shrink-0',
                      isAllSelected ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
                    )}
                  >
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="truncate font-bold">Tất cả trang trại toàn chuỗi</span>
                    <span className="text-[10px] text-amber-700 font-normal">
                      Xem bức tranh tổng hợp toàn công ty
                    </span>
                  </div>
                </div>

                {isAllSelected && <Check className="h-4 w-4 text-amber-600 shrink-0 ml-2" />}
              </button>
            )}

            {accessibleFarms.map((farm) => {
              const fId = Number(farm.farmId || farm.id);
              const isSelected = !isAllSelected && fId === Number(currentFarm?.farmId || currentFarm?.id);
              const typeLabel = FARM_TYPE_LABELS[farm.farmType] || farm.farmType || 'Nông nghiệp';

              return (
                <button
                  key={fId}
                  type="button"
                  onClick={() => handleSelectFarm(farm)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl p-2.5 text-left text-xs transition-colors',
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-lg text-xs shrink-0',
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="truncate">{farm.farmName || farm.name}</span>
                      <span className="text-[10px] text-slate-600 font-normal">
                        Mã: {farm.farmCode || farm.code || '—'} • {typeLabel}
                      </span>
                    </div>
                  </div>

                  {isSelected && <Check className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default FarmContextSwitcher;
