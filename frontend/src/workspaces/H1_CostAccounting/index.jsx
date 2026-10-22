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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Can } from '@/components/common/Can';
import { useAuthStore } from '@/store/useAuthStore';
import { MultiFarmExpenseSummary } from './components/MultiFarmExpenseSummary';
import { BudgetManagementTab } from './components/BudgetManagementTab';

/**
 * Workspace H1: Quản Trị Giá Thành & Bảng Thống Kê Chi Phí Đa Trang Trại (Điều 2.8 File 08)
 * Phân quyền phân cấp:
 * - isOwner === true: Ẩn nút nhập hóa đơn lẻ, hiển thị Bảng thống kê so sánh chi phí & Bàn duyệt ngân sách
 * - Kế toán trại: Khai báo chi phí hóa đơn lẻ, thực hiện phân bổ giá thành
 */
export function CostAccountingWorkspace() {
  const { isOwner } = useAuthStore();
  const owner = isOwner();

  // Tab điều hướng: 2 tab chính theo quy chuẩn Role 1 Owner
  const [activeTab, setActiveTab] = useState('EXPENSE_SUMMARY');

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. HEADER KHÔNG GIAN LÀM VIỆC                            */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Quản Trị Giá Thành & Thống Kê Chi Phí
              </h1>
              {owner && (
                <span className="rounded-full bg-blue-100 text-blue-900 px-2.5 py-0.5 text-[10px] font-bold border border-blue-200">
                  Chủ Đầu Tư (Owner)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tập hợp 4 nguồn chi phí, so sánh giá thành thực tế giữa các trang trại và kiểm soát hạn mức ngân sách
            </p>
          </div>
        </div>

        {/* ẨN TOÀN BỘ NÚT NHẬP HÓA ĐƠN LẺ NẾU LÀ OWNER */}
        {!owner && (
          <div className="flex items-center gap-2">
            <Can permission="PERM_FINANCE_EXPENSE">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => alert('Kế toán trại lập hóa đơn lẻ')}
              >
                + Khai Báo Chi Phí
              </Button>
            </Can>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. BANNER HƯỚNG DẪN DÀNH RIÊNG CHO OWNER                 */}
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
      {/* 3. THANH ĐIỀU HƯỚNG TABS                                */}
      {/* ======================================================== */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab('EXPENSE_SUMMARY')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'EXPENSE_SUMMARY'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Tab 1. Bảng Thống Kê & So Sánh Chi Phí Từng Trang Trại</span>
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
          <span>Tab 2. Quản Trị & Phê Duyệt Ngân Sách Cấp Vốn Chu Kỳ</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 4. NỘI DUNG TƯƠNG ỨNG TỪNG TAB                          */}
      {/* ======================================================== */}
      {activeTab === 'EXPENSE_SUMMARY' && <MultiFarmExpenseSummary />}
      {activeTab === 'BUDGETS' && <BudgetManagementTab />}
    </div>
  );
}

export default CostAccountingWorkspace;
