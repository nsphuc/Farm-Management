import React, { useState } from 'react';
import { 
  BadgeDollarSign, Plus, QrCode, Truck, CreditCard, 
  Receipt, ArrowLeftRight, Building, CheckCircle2, 
  TrendingUp, ShieldCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Can } from '@/components/common/Can';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';
import { CycleSettlementConsole } from './components/CycleSettlementConsole';
import { SalesOrderMonitorTab } from './components/SalesOrderMonitorTab';
import { DebtMonitorTab } from './components/DebtMonitorTab';

/**
 * Workspace H2: Trung Tâm Bán Hàng, Giao Hàng & Thu Phí VietQR (Điều 2.9 File 08)
 * Phân cấp vai trò:
 * - Khi isOwner === true (Chủ đầu tư / Owner):
 *   + Ẩn các nút tác vụ bán hàng lẻ của kế toán/thủ kho (+ Tạo đơn, + Lập giao hàng, + Thu chi lẻ)
 *   + Tab 1 (Trọng tâm): Bảng Kết Toán Lợi Nhuận Các Trang Trại (Cycle Profit Settlement & VietQR)
 *   + Tab 2: Theo Dõi Đơn Bán Hàng & Giao Hàng Các Trại (Read-Only)
 *   + Tab 3: Theo Dõi Sổ Cái Công Nợ 2 Chiều Các Trại (Read-Only)
 * - Khi isOwner === false (Kế toán / Thủ kho / Farm Manager):
 *   + Thực hiện quy trình bán hàng, xuất giao hàng và thu chi thực tế tại trại
 */
export function SalesCashflowWorkspace() {
  const { activeFarmId } = useActiveFarmStore();
  const { isOwner } = useAuthStore();
  const owner = isOwner();

  // Mặc định cho Owner là tab SETTLEMENT, cho nhân sự trại là tab ORDERS
  const [activeTab, setActiveTab] = useState(owner ? 'SETTLEMENT' : 'ORDERS');

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. HEADER KHÔNG GIAN LÀM VIỆC                            */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
            <BadgeDollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {owner 
                  ? 'Trung Tâm Bán Hàng & Nhận Kết Toán Lợi Nhuận Chu Kỳ' 
                  : 'Trung Tâm Bán Hàng, Giao Hàng & Thu Phí VietQR'}
              </h1>
              {owner && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Dành Riêng Cho Chủ Đầu Tư</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {owner
                ? 'Giám sát bán sỉ, công nợ hai chiều và nhận chuyển khoản lợi nhuận ròng trực tiếp từ các trang trại'
                : 'Lên đơn bán sỉ, giữ chỗ lô hàng, xuất giao nhiều đợt và cấn trừ công nợ hai chiều tại trang trại'}
            </p>
          </div>
        </div>

        {/* Action Buttons: Ẩn hoàn toàn với Owner, chỉ hiện với Kế toán / Thủ kho */}
        {!owner && (
          <div className="flex items-center gap-2">
            {activeTab === 'ORDERS' && (
              <Can permission="PERM_FINANCE_SALES_ORDER">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => alert('Tạo đơn bán sỉ mới')}
                >
                  + Tạo Đơn Bán Sỉ
                </Button>
              </Can>
            )}

            {activeTab === 'DELIVERIES' && (
              <Can permission="PERM_DELIVERY_MANAGE">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Truck className="h-4 w-4" />}
                  onClick={() => alert('Tạo đợt xuất giao hàng')}
                >
                  + Lập Đợt Giao Hàng
                </Button>
              </Can>
            )}

            {activeTab === 'DEBT' && (
              <Can permission="PERM_PAYMENT_ALLOCATE">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<CreditCard className="h-4 w-4" />}
                  onClick={() => alert('Cấn trừ công nợ đối tác 2 chiều')}
                >
                  + Cấn Trừ Công Nợ
                </Button>
              </Can>
            )}

            {activeTab === 'PAYMENTS' && (
              <Can permission="PERM_FINANCE_PAYMENT">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => alert('Tạo giao dịch thanh toán / thu tiền')}
                >
                  + Ghi Nhận Thanh Toán
                </Button>
              </Can>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. TAB ĐIỀU HƯỚNG                                        */}
      {/* ======================================================== */}
      <div className="flex space-x-2 border-b border-slate-200 text-xs font-semibold">
        {owner ? (
          // Tabs danh cho Chủ Đầu Tư (Owner)
          [
            { 
              id: 'SETTLEMENT', 
              label: 'Bảng Kết Toán Lợi Nhuận Chu Kỳ', 
              icon: ShieldCheck, 
              badge: 'Trọng tâm Owner' 
            },
            { 
              id: 'ORDERS', 
              label: 'Theo Dõi Đơn Bán Hàng & Giao Hàng', 
              icon: Receipt 
            },
            { 
              id: 'DEBT', 
              label: 'Sổ Cái Công Nợ Hai Chiều Các Trại', 
              icon: CreditCard 
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {tab.badge}
                </span>
              )}
            </button>
          ))
        ) : (
          // Tabs dành cho Kế toán / Nhân viên trại
          [
            { id: 'ORDERS', label: 'Đơn Hàng Bán Sỉ', icon: Receipt },
            { id: 'DELIVERIES', label: 'Giao Hàng (Split Shipments)', icon: Truck },
            { id: 'DEBT', label: 'Sổ Cái Công Nợ Hai Chiều', icon: CreditCard },
            { id: 'PAYMENTS', label: 'Thu Chi & VietQR', icon: ArrowLeftRight },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. NỘI DUNG TỪNG TAB                                     */}
      {/* ======================================================== */}
      {activeTab === 'SETTLEMENT' && (
        <CycleSettlementConsole farmId={activeFarmId} />
      )}

      {activeTab === 'ORDERS' && (
        <SalesOrderMonitorTab farmId={activeFarmId} />
      )}

      {activeTab === 'DEBT' && (
        <DebtMonitorTab farmId={activeFarmId} />
      )}

      {/* Cho Kế toán / Nhân viên trại khi mở tab DELIVERIES hoặc PAYMENTS */}
      {!owner && activeTab === 'DELIVERIES' && (
        <SalesOrderMonitorTab farmId={activeFarmId} />
      )}

      {!owner && activeTab === 'PAYMENTS' && (
        <DebtMonitorTab farmId={activeFarmId} />
      )}
    </div>
  );
}

export default SalesCashflowWorkspace;
