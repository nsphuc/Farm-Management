import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Building2, Layers, Lock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { cn } from '@/utils/formatters';

const LIVESTOCK_ICONS = {
  LIVESTOCK_MEAT: '🐷',
  POULTRY_MEAT: '🐔',
  AQUACULTURE: '🐟',
  MIXED: '🏢',
};

const LIVESTOCK_BADGES = {
  LIVESTOCK_MEAT: '[Gia súc]',
  POULTRY_MEAT: '[Gia cầm]',
  AQUACULTURE: '[Thủy sản]',
  MIXED: '[Toàn chuỗi]',
};

export function BranchContextSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = useAuthStore((s) => s.userInfo);
  const isOwner = useAuthStore((s) => s.isOwner);
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const canSwitchBranches =
    (typeof isOwner === 'function' && isOwner()) ||
    (typeof isSuperAdmin === 'function' && isSuperAdmin());

  const activeFarmId = useActiveFarmStore((s) => s.activeFarmId);
  const farmBranches = useActiveFarmStore((s) => s.branches);
  const farmActiveBranchId = useActiveFarmStore((s) => s.activeBranchId);
  const farmActiveBranch = useActiveFarmStore((s) => s.activeBranch);
  const setActiveBranchId = useActiveFarmStore((s) => s.setActiveBranchId);
  const fetchBranches = useActiveFarmStore((s) => s.fetchBranches);

  const branchStoreBranches = useActiveBranchStore((s) => s.branches);
  const currentBranchId = useActiveBranchStore((s) => s.currentBranchId);
  const currentBranchFromStore = useActiveBranchStore((s) => s.currentBranch);
  const setCurrentBranchId = useActiveBranchStore((s) => s.setCurrentBranchId);

  const branches = (branchStoreBranches && branchStoreBranches.length > 0)
    ? branchStoreBranches
    : (farmBranches || []);
  const activeBranchId = currentBranchId || farmActiveBranchId;
  const activeBranch = currentBranchFromStore || farmActiveBranch;

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (activeFarmId && activeFarmId !== 'ALL') {
      fetchBranches(activeFarmId);
    }
  }, [activeFarmId]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const assignedBranchId = !canSwitchBranches
    ? (userInfo?.assignedBranchId || branches[0]?.id || 1)
    : null;

  useEffect(() => {
    if (!canSwitchBranches && assignedBranchId && Number(activeBranchId) !== Number(assignedBranchId)) {
      setCurrentBranchId(assignedBranchId);
      setActiveBranchId(assignedBranchId);
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get('branchId') && Number(searchParams.get('branchId')) !== Number(assignedBranchId)) {
        searchParams.set('branchId', String(assignedBranchId));
        navigate({ pathname: location.pathname, search: searchParams.toString() }, { replace: true });
      }
    }
  }, [canSwitchBranches, assignedBranchId, activeBranchId, location.pathname, location.search]);

  if (!activeFarmId || activeFarmId === 'ALL' || !branches || branches.length === 0) {
    return null;
  }

  // Nhân viên (không phải Chủ trại): Khóa cố định vào đúng 1 chi nhánh được Chủ trại phân công
  if (!canSwitchBranches) {
    const lockedBranch =
      branches.find((b) => Number(b.id) === Number(assignedBranchId)) || branches[0];
    const lockedType = lockedBranch?.livestockType || 'LIVESTOCK_MEAT';
    const lockedIcon = LIVESTOCK_ICONS[lockedType] || '🐾';
    const lockedBadge = LIVESTOCK_BADGES[lockedType] || `[${lockedType}]`;

    return (
      <div
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/90 px-2.5 py-1.5 text-left text-xs shadow-2xs select-none"
        title={`Chi nhánh phân công cố định: ${lockedBranch?.name || 'Chi nhánh 1'}`}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-200 text-xs shrink-0">
          <span>{lockedIcon}</span>
        </div>
        <div className="flex flex-col pr-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
              {lockedBadge}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded bg-slate-200 px-1 py-0.2 text-[8px] font-bold text-slate-700">
              <Lock className="h-2.5 w-2.5" />
              Cố định
            </span>
          </div>
          <span className="max-w-[160px] truncate font-bold text-slate-800 text-xs">
            {lockedBranch?.name || 'Chi nhánh'}
          </span>
        </div>
      </div>
    );
  }

  const isAllSelected = activeBranchId === 'ALL';
  const currentBranch = isAllSelected
    ? {
        id: 'ALL',
        name: 'Cơ sở chính (Tổng hợp toàn hệ thống)',
        livestockType: 'MIXED',
        isDefault: true,
      }
    : activeBranch || branches.find((b) => Number(b.id) === Number(activeBranchId)) || branches[0];

  const typeKey = currentBranch?.livestockType || 'LIVESTOCK_MEAT';
  const icon = LIVESTOCK_ICONS[typeKey] || '🐾';
  const badgeLabel = LIVESTOCK_BADGES[typeKey] || `[${typeKey}]`;

  const handleSelectBranch = (b) => {
    setCurrentBranchId(b.id);
    setActiveBranchId(b.id);
    setIsOpen(false);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('farmgo_active_branch_id', String(b.id));
      } catch (e) {
        // safe ignore
      }
    }

    const searchParams = new URLSearchParams(location.search);
    searchParams.set('branchId', b.id);
    navigate(
      {
        pathname: location.pathname,
        search: searchParams.toString(),
      },
      { replace: true }
    );
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-2.5 py-1.5 text-left text-xs shadow-2xs hover:bg-emerald-50/50 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        title="Chọn chi nhánh tác nghiệp"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-xs shadow-2xs shrink-0">
          <span>{icon}</span>
        </div>
        <div className="flex flex-col pr-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
              {badgeLabel}
            </span>
            {currentBranch?.isDefault && (
              <span className="rounded bg-emerald-100 px-1 py-0.2 text-[8px] font-bold text-emerald-700">
                Chính
              </span>
            )}
          </div>
          <span className="max-w-[150px] truncate font-bold text-slate-800 text-xs">
            {currentBranch?.name || 'Chi nhánh'}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-slate-400 transition-transform duration-150',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-50">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
            <span>Chuyển đổi Chi nhánh</span>
            <span className="text-[10px] text-slate-400 font-normal">FarmGo Multi-Branch</span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {/* Tùy chọn 1: Cơ sở chính (Tổng hợp toàn hệ thống) */}
            <button
              type="button"
              onClick={() =>
                handleSelectBranch({
                  id: 'ALL',
                  name: 'Cơ sở chính (Tổng hợp toàn hệ thống)',
                  livestockType: 'MIXED',
                  isDefault: true,
                })
              }
              className={cn(
                'flex w-full items-center justify-between px-3 py-2.5 text-left text-xs transition-colors hover:bg-slate-50',
                isAllSelected && 'bg-emerald-50 text-emerald-900 font-bold'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-lg">🏢</span>
                <div className="truncate">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>Cơ sở chính (Tổng hợp toàn hệ thống)</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 rounded px-1 font-bold">
                      Toàn chuỗi
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Hợp nhất dữ liệu tất cả chi nhánh trực thuộc
                  </div>
                </div>
              </div>
              {isAllSelected && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
            </button>

            {/* Danh sách các chi nhánh trực thuộc */}
            {branches.map((b) => {
              const bType = b.livestockType || 'LIVESTOCK_MEAT';
              const isSelected = !isAllSelected && Number(b.id) === Number(currentBranch?.id);
              const badge = LIVESTOCK_BADGES[bType] || `[${bType}]`;

              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelectBranch(b)}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2.5 text-left text-xs transition-colors hover:bg-slate-50',
                    isSelected && 'bg-emerald-50 text-emerald-900 font-bold'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base">{LIVESTOCK_ICONS[bType] || '🐾'}</span>
                    <div className="truncate">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>{b.name}</span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1 rounded">
                          {badge}
                        </span>
                        {b.isDefault && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 rounded px-1">
                            Gốc
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {b.code} {b.address ? `• ${b.address}` : ''}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
