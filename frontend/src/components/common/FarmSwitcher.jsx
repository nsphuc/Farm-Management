import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sprout, ChevronDown, Check, Building2 } from 'lucide-react';
import { useFarmStore } from '../../stores/useFarmStore';
import { farmService } from '../../services/farmService';
import { toast } from 'sonner';

export const FarmSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();

  const currentFarm = useFarmStore((state) => state.currentFarm);
  const setCurrentFarm = useFarmStore((state) => state.setCurrentFarm);
  const setAccessibleFarms = useFarmStore((state) => state.setAccessibleFarms);

  const { data: farms = [], isLoading } = useQuery({
    queryKey: ['my-accessible-farms'],
    queryFn: async () => {
      const data = await farmService.getMyAccessibleFarms();
      setAccessibleFarms(data);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectFarm = (farm) => {
    if (currentFarm?.id === farm.id) {
      setIsOpen(false);
      return;
    }

    setCurrentFarm(farm);
    setIsOpen(false);
    toast.success(`Đã chuyển sang trang trại: ${farm.name}`);

    // Invalidate TanStack Query caches to re-fetch farm-specific data under 300ms
    queryClient.invalidateQueries({ queryKey: ['farm-detail'] });
    queryClient.invalidateQueries({ queryKey: ['zones'] });
    queryClient.invalidateQueries({ queryKey: ['cycles'] });
  };

  const getFarmTypeBadge = (type) => {
    switch (type) {
      case 'TRONG_TROT':
        return { label: 'Trồng trọt', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' };
      case 'CHAN_NUOI':
        return { label: 'Chăn nuôi', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' };
      default:
        return { label: 'Hỗn hợp', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800' };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || farms.length === 0}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all min-h-[44px] text-left shadow-xs"
        aria-label="Chọn cơ sở trang trại"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
          <Sprout className="w-4 h-4" />
        </div>

        <div className="hidden sm:block">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Trang trại hoạt động
          </div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[130px]">
            {currentFarm ? currentFarm.name : isLoading ? 'Đang tải...' : 'Chưa có cơ sở'}
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Chọn cơ sở trang trại
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
              {farms.length} cơ sở
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {farms.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                Không tìm thấy trang trại được phân quyền.
              </div>
            ) : (
              farms.map((farm) => {
                const isSelected = currentFarm?.id === farm.id;
                const typeInfo = getFarmTypeBadge(farm.farmType);

                return (
                  <button
                    key={farm.id}
                    onClick={() => handleSelectFarm(farm)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors min-h-[44px] ${
                      isSelected
                        ? 'bg-primary-50 text-primary-900 dark:bg-primary-950/30 dark:text-primary-200 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <div className="truncate">
                        <div className="truncate font-medium">{farm.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {farm.code}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded border font-medium ${typeInfo.bg}`}
                          >
                            {typeInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
