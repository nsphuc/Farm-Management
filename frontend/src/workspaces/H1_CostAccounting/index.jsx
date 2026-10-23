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
  const { activeFarmId, activeFarm } = useActiveFarmStore();
  const owner = isOwner();
  const manager = isFarmManager();

  // Tab điều hướng
  const [activeTab, setActiveTab] = useState('EXPENSES');

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
                {manager
                  ? 'Giám Sát Chi Phí, Giá Thành & Ngân Sách Trang Trại'
                  : 'Quản Trị Giá Thành & Thống Kê Chi Phí'}
              </h1>
              {owner && (
                <span className="rounded-full bg-blue-100 text-blue-900 px-2.5 py-0.5 text-[10px] font-bold border border-blue-200">
                  Chủ Đầu Tư (Owner)
                </span>
              )}
              {manager && (
                <span className="rounded-full bg-emerald-100 text-emerald-900 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-300">
                  Giám Đốc Trại
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {manager
                ? 'Theo dõi sổ chi phí thực tế do Kế toán hạch toán, kiểm soát giá thành trên mỗi kg nông sản (VNĐ/kg) và giám sát giải ngân ngân sách'
                : 'Tập hợp 4 nguồn chi phí, so sánh giá thành thực tế giữa các trang trại và kiểm soát hạn mức ngân sách'}
            </p>
          </div>
        </div>

        {/* NÚT TÁC VỤ DÀNH RIÊNG CHO MAKER (ROLE_ACCOUNTANT) */}
        <div className="flex items-center gap-2">
          <Can permission="PERM_FINANCE_EXPENSE" role="ROLE_ACCOUNTANT">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => alert('Kế toán lập chứng từ chi phí mới (DRAFT)')}
            >
              + Khai Báo Chi Phí
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Layers className="h-4 w-4" />}
              onClick={() => alert('Kế toán phân bổ chi phí')}
            >
              Phân Bổ Chi Phí
            </Button>
          </Can>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. BANNER HƯỚNG DẪN DÀNH CHO OWNER                       */}
      {/* ======================================================== */}
      {owner && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 shadow-2xs animate-in fade-in">
          <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <strong className="block font-bold text-blue-950">
              Quy Trình Tài Chính Phân Cấp Dành Cho Chủ Đầu Tư:
            </strong>
            <p className="text-blue-800">
              Chi phí mua phân bón, thức ăn chăn nuôi, trả công thợ và điện nước do Kế toán từng trang trại quản lý, thanh toán và đính kèm hóa đơn. Chủ đầu tư theo dõi bảng so sánh chi phí giữa các trại, kiểm tra giá thành sản xuất thực tế (VNĐ/kg) và phê duyệt trần ngân sách cấp vốn đầu kỳ cho từng trại.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. BANNER HƯỚNG DẪN DÀNH CHO FARM MANAGER                */}
      {/* ======================================================== */}
      {manager && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 shadow-2xs animate-in fade-in">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <strong className="block font-bold text-emerald-950">
              Chế Độ Giám Sát Chi Phí & Định Mức Giá Thành Của Giám Đốc Trại:
            </strong>
            <p className="text-emerald-800">
              Kế toán trại (Role 5) chịu trách nhiệm hạch toán hóa đơn chứng từ hàng ngày. Bạn theo dõi <strong>Sổ Chi Phí Thực Tế</strong> (mua vật tư, lương, điện nước), kiểm soát <strong>Giá Thành Sản Xuất (VNĐ/kg)</strong> của từng Mùa vụ / Đàn nuôi và theo dõi <strong>Hạn Mức Ngân Sách</strong> do Chủ đầu tư phê duyệt để tránh thất thoát, vượt trần.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. THANH ĐIỀU HƯỚNG 3 TABS DÀNH CHO FARM MANAGER / OWNER */}
      {/* ======================================================== */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab('EXPENSES')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'EXPENSES'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>
            {manager ? 'Tab 1. Sổ Chi Phí Thực Tế Của Trại (Read-Only)' : 'Tab 1. Thống Kê & So Sánh Chi Phí'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('UNIT_COST')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'UNIT_COST'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Tab 2. Bảng Giá Thành Sản Xuất Đơn Vị (VNĐ/kg)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BUDGETS')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'BUDGETS'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>
            {manager ? 'Tab 3. Theo Dõi Hạn Mức Ngân Sách Trại (#69)' : 'Tab 3. Quản Trị & Phê Duyệt Ngân Sách'}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 5. NỘI DUNG TƯƠNG ỨNG TỪNG TAB                          */}
      {/* ======================================================== */}
      {activeTab === 'EXPENSES' && <MultiFarmExpenseSummary />}
      {activeTab === 'UNIT_COST' && <UnitCostAnalysisTab />}
      {activeTab === 'BUDGETS' && <BudgetManagementTab />}
    </div>
  );
}

export default CostAccountingWorkspace;
