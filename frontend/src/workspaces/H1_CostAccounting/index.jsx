import React, { useState } from 'react';
import {
  Calculator,
  Plus,
  Coins,
  TrendingUp,
  Building,
  DollarSign,
  FileText,
  Info,
  CheckCircle2,
  Layers,
  ShieldCheck,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Can } from '@/components/common/Can';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { MultiFarmExpenseSummary } from './components/MultiFarmExpenseSummary';
import { BudgetManagementTab } from './components/BudgetManagementTab';
import { UnitCostAnalysisTab } from './components/UnitCostAnalysisTab';
import { CreateExpenseModal } from './components/CreateExpenseModal';
import { AllocateCostModal } from './components/AllocateCostModal';

/**
 * Workspace H1: Quản Trị Giá Thành & Bảng Thống Kê Chi Phí (Điều 2.8 File 08)
 * Phân quyền phân cấp:
 * - isOwner === true: Bảng so sánh chi phí các trại, Phê duyệt trần ngân sách cấp vốn đầu kỳ.
 * - isFarmManager === true:
 *   + Ẩn nút khai báo chi phí / phân bổ (việc của Kế toán).
 *   + Tab 1: Sổ Chi Phí Thực Tế Của Trại (Read-Only)
 *   + Tab 2: Bảng Giá Thành Sản Xuất Đơn Vị (VNĐ/kg) & 5 nhóm chi phí
 *   + Tab 3: Theo Dõi Hạn Mức Ngân Sách Trại (budgets #69)
 * - Kế toán trại: Khai báo chi phí hóa đơn lẻ, phân bổ chi phí.
 */
export function CostAccountingWorkspace() {
  const { isOwner, isFarmManager } = useAuthStore();
  const { activeFarmId, activeFarm, notifyDataChanged } = useActiveFarmStore();
  const owner = isOwner();
  const manager = isFarmManager();

  // Tab điều hướng
  const [activeTab, setActiveTab] = useState('EXPENSES');

  // Modals state
  const [isCreateExpenseOpen, setIsCreateExpenseOpen] = useState(false);
  const [isAllocateCostOpen, setIsAllocateCostOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. HEADER KHÔNG GIAN LÀM VIỆC                            */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Chi Phí Sản Xuất & Quản Trị Giá Thành (WS-H1)
              </h1>
              {owner && (
                <span className="rounded-full bg-blue-100 text-blue-900 px-2.5 py-0.5 text-[10px] font-bold border border-blue-200">
                  Chủ Đầu Tư
                </span>
              )}
              {manager && (
                <span className="rounded-full bg-emerald-100 text-emerald-900 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-300">
                  Giám Đốc Trại
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi chi tiết chi phí vật tư đã dùng, chi phí nhân công và giá thành sản xuất (VNĐ/kg) theo từng vụ mùa / đàn nuôi.
            </p>
          </div>
        </div>

        {/* NÚT TÁC VỤ DÀNH CHO KẾ TOÁN VÀ QUẢN LÝ */}
        <div className="flex items-center gap-2">
          <Can permission="PERM_FINANCE_EXPENSE" role={["ROLE_ACCOUNTANT", "ROLE_FARM_MANAGER"]}>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setIsCreateExpenseOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold"
            >
              + Khai Báo Chi Phí
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Layers className="h-4 w-4" />}
              onClick={() => setIsAllocateCostOpen(true)}
              className="font-semibold text-xs"
            >
              Phân Bổ Chi Phí
            </Button>
          </Can>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. THANH ĐIỀU HƯỚNG 3 TABS TINH GỌN, TRỰC QUAN            */}
      {/* ======================================================== */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-2 no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('EXPENSES')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'EXPENSES'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/60 rounded-t-xl font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="h-4 w-4 text-emerald-600" />
          <span>Sổ Chi Phí Thực Tế</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('UNIT_COST')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'UNIT_COST'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/60 rounded-t-xl font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <span>Giá Thành Đơn Vị (VNĐ/kg)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BUDGETS')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'BUDGETS'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/60 rounded-t-xl font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="h-4 w-4 text-amber-600" />
          <span>Hạn Mức Ngân Sách</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 5. NỘI DUNG TƯƠNG ỨNG TỪNG TAB                          */}
      {/* ======================================================== */}
      {activeTab === 'EXPENSES' && <MultiFarmExpenseSummary />}
      {activeTab === 'UNIT_COST' && <UnitCostAnalysisTab />}
      {activeTab === 'BUDGETS' && <BudgetManagementTab />}

      {/* 6. MODAL KHAI BÁO CHI PHÍ & PHÂN BỔ CHI PHÍ */}
      <CreateExpenseModal
        isOpen={isCreateExpenseOpen}
        onClose={() => setIsCreateExpenseOpen(false)}
        initialFarmId={activeFarmId}
        onSuccess={() => notifyDataChanged?.('finance')}
      />

      <AllocateCostModal
        isOpen={isAllocateCostOpen}
        onClose={() => setIsAllocateCostOpen(false)}
        initialFarmId={activeFarmId}
        onSuccess={() => notifyDataChanged?.('finance')}
      />
    </div>
  );
}

export default CostAccountingWorkspace;
