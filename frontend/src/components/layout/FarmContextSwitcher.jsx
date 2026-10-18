import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Building2, Check, MapPin } from 'lucide-react';
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
 * Chỉ liệt kê các trang trại mà user hiện tại được cấp quyền (user_farm_access #12).
 * Tự động đồng bộ vào useActiveFarmStore và URL search param ?farmId=...
 */
export function FarmContextSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo } = useAuthStore();
  const { activeFarmId, activeFarm, setActiveFarmId } = useActiveFarmStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const accessibleFarms = userInfo?.accessibleFarms || [];

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
    const fId = Number(farm.farmId || farm.id);
    setActiveFarmId(fId, accessibleFarms);
    setIsOpen(false);

    // Đồng bộ lên query param ?farmId=... trên URL hiện tại
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('farmId', fId);
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

  const currentFarm =
    activeFarm ||
    accessibleFarms.find((f) => Number(f.farmId || f.id) === Number(activeFarmId)) ||
    accessibleFarms[0];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-left text-xs shadow-2xs hover:border-emerald-400 hover:bg-slate-50/80 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
          <Building2 className="h-4 w-4" />
        </div>

        <div className="flex flex-col pr-1">
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
            Trang trại tác nghiệp
          </span>
          <span className="max-w-[160px] truncate font-bold text-slate-900 text-xs sm:max-w-[200px]">
            {currentFarm?.farmName || currentFarm?.name || 'Chọn trang trại'}
          </span>
        </div>

        <ChevronDown
          className={cn(
            'h-4 w-4 text-slate-400 transition-transform duration-200',
            isOpen && 'rotate-180 text-emerald-600'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
            <span className="text-[11px] font-semibold text-slate-600">
              Danh sách được cấp quyền ({accessibleFarms.length})
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {accessibleFarms.map((farm) => {
              const fId = Number(farm.farmId || farm.id);
              const isSelected = fId === Number(currentFarm?.farmId || currentFarm?.id);
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
                        'flex h-6 w-6 items-center justify-center rounded-lg text-xs',
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
