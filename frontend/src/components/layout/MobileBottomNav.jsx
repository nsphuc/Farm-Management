import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Layers,
  ClipboardList,
  Package,
  BadgeDollarSign,
  Menu,
} from 'lucide-react';
import { cn } from '@/utils/formatters';

/**
 * MobileBottomNav Component
 * Thanh điều hướng đáy màn hình tối ưu cho smartphone & tablet (< 1024px)
 * Chuẩn hóa 5 nút thao tác nhanh ngoài trại: Khu nuôi, Nhật ký, Kho, Bán hàng, Menu
 */
export function MobileBottomNav({ onOpenMenu, onOpenScanner }) {
  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-30 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden select-none safe-area-pb"
    >
      {/* 1. Khu Nuôi */}
      <NavLink
        to="/app/barns"
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center justify-center gap-1 w-14 py-1 text-[10px] font-semibold transition-colors',
            isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          )
        }
      >
        {({ isActive }) => (
          <>
            <Layers className={cn('h-5 w-5', isActive ? 'text-emerald-700' : 'text-slate-400')} />
            <span className="truncate">Khu Nuôi</span>
          </>
        )}
      </NavLink>

      {/* 2. Ghi Nhật Ký */}
      <NavLink
        to="/app/daily-logs"
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center justify-center gap-1 w-14 py-1 text-[10px] font-semibold transition-colors',
            isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          )
        }
      >
        {({ isActive }) => (
          <>
            <ClipboardList className={cn('h-5 w-5', isActive ? 'text-emerald-700' : 'text-slate-400')} />
            <span className="truncate">Nhật Ký</span>
          </>
        )}
      </NavLink>

      {/* 3. Kho Hàng Hóa */}
      <NavLink
        to="/app/inventory"
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center justify-center gap-1 w-14 py-1 text-[10px] font-semibold transition-colors',
            isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          )
        }
      >
        {({ isActive }) => (
          <>
            <Package className={cn('h-5 w-5', isActive ? 'text-emerald-700' : 'text-slate-400')} />
            <span className="truncate">Kho Hàng</span>
          </>
        )}
      </NavLink>

      {/* 4. Quản Lý Bán Hàng */}
      <NavLink
        to="/app/sales"
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center justify-center gap-1 w-14 py-1 text-[10px] font-semibold transition-colors',
            isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          )
        }
      >
        {({ isActive }) => (
          <>
            <BadgeDollarSign className={cn('h-5 w-5', isActive ? 'text-emerald-700' : 'text-slate-400')} />
            <span className="truncate">Bán Hàng</span>
          </>
        )}
      </NavLink>

      {/* 5. Mở Menu Chức Năng (Drawer) */}
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Mở menu chức năng"
        className="flex flex-col items-center justify-center gap-1 w-14 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 active:text-emerald-700 transition-colors"
      >
        <Menu className="h-5 w-5 text-slate-400" />
        <span className="truncate">Menu</span>
      </button>
    </nav>
  );
}

export default MobileBottomNav;
