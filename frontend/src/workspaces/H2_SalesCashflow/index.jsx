import React, { useState } from 'react';
import { 
  BadgeDollarSign, Plus, QrCode, Truck, CreditCard, 
  Receipt, ArrowLeftRight, Building, CheckCircle2, 
  TrendingUp, ShieldCheck, Info 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Can } from '@/components/common/Can';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';
import { CycleSettlementConsole } from './components/CycleSettlementConsole';
import { SalesOrderMonitorTab } from './components/SalesOrderMonitorTab';
import { SalesDeliveryMonitorTab } from './components/SalesDeliveryMonitorTab';
import { DebtMonitorTab } from './components/DebtMonitorTab';
import { PaymentMonitorTab } from './components/PaymentMonitorTab';
import { CreateSalesOrderModal } from './components/CreateSalesOrderModal';
import { CreateDeliveryModal } from './components/CreateDeliveryModal';
import { CreatePaymentModal } from './components/CreatePaymentModal';
import { AllocateOrOffsetDebtModal } from './components/AllocateOrOffsetDebtModal';

/**
 * Workspace H2: Trung Tâm Bán Hàng, Giao Hàng & Thu Phí VietQR (Điều 2.9 File 08)
 * Phân cấp vai trò:
 * - Khi isOwner === true (Chủ đầu tư / Owner):
 *   + Ẩn các nút tác vụ bán hàng lẻ của kế toán/thủ kho
 *   + Tab 1 (Trọng tâm): Bảng Kết Toán Lợi Nhuận Các Trang Trại (Cycle Profit Settlement & VietQR)
 *   + Tab 2: Theo Dõi Đơn Bán Hàng & Giao Hàng Các Trại (Read-Only)
 *   + Tab 3: Theo Dõi Sổ Cái Công Nợ 2 Chiều Các Trại (Read-Only)
 * - Khi isFarmManager === true (Giám đốc trang trại):
 *   + Ẩn các nút tác vụ bán hàng lẻ / thu chi lẻ của kế toán
 *   + Tab 1 (Trọng tâm): Duyệt Bảng Kết Toán Chu Kỳ Của Trại Trước Khi Chuyển Lợi Nhuận Cho Owner
 *   + Tab 2: Theo Dõi Bán Hàng & Giao Hàng Trại (Read-Only)
 *   + Tab 3: Theo Dõi Sổ Cái Công Nợ Hai Chiều (Read-Only)
 * - Khi là Kế toán / Thủ kho trại:
 *   + Lên đơn bán sỉ, lập đợt giao hàng, cấn trừ công nợ và thu chi lẻ.
 */
export function SalesCashflowWorkspace() {
  const { activeFarmId, activeFarm, notifyDataChanged } = useActiveFarmStore();
  const { isOwner, isFarmManager, isWarehouseKeeper, hasPermission } = useAuthStore();
  const owner = isOwner();
  const manager = isFarmManager();
  const warehouseKeeper = isWarehouseKeeper() || (!hasPermission('PERM_FINANCE_SALES_ORDER') && hasPermission('PERM_DELIVERY_MANAGE'));

  // Mặc định cho Owner & Farm Manager là tab SETTLEMENT, Thủ kho là DELIVERIES, Kế toán là ORDERS
  const [activeTab, setActiveTab] = useState(
    owner || manager ? 'SETTLEMENT' : warehouseKeeper ? 'DELIVERIES' : 'ORDERS'
  );

  // Bảo vệ SoD: Ngăn Thủ kho truy cập các tab tài chính qua state hoặc URL
  React.useEffect(() => {
    if (warehouseKeeper && !['DELIVERIES', 'ORDERS'].includes(activeTab)) {
      setActiveTab('DELIVERIES');
    }
  }, [warehouseKeeper, activeTab]);

  // Modal states
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isCreateDeliveryOpen, setIsCreateDeliveryOpen] = useState(false);
  const [isCreatePaymentOpen, setIsCreatePaymentOpen] = useState(false);
  const [isAllocateDebtOpen, setIsAllocateDebtOpen] = useState(false);

  // Selected debt states for context-aware modals
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState(null);
  const [selectedDebtForAllocate, setSelectedDebtForAllocate] = useState(null);

  const handleOpenPayment = (debtRow = null) => {
    setSelectedDebtForPayment(debtRow);
    setIsCreatePaymentOpen(true);
  };

  const handleOpenAllocate = (debtRow = null) => {
    setSelectedDebtForAllocate(debtRow);
    setIsAllocateDebtOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. HEADER KHÔNG GIAN LÀM VIỆC                            */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
            <BadgeDollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Bán Hàng, Giao Vận & Lợi Nhuận Chu Kỳ (WS-H2)
              </h1>
              {owner && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Chủ Đầu Tư</span>
                </span>
              )}
              {manager && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-900 border border-blue-300">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Giám Đốc Trại</span>
                </span>
              )}
              {warehouseKeeper && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-300">
                  <Truck className="h-3 w-3 text-amber-700" />
                  <span>Bộ Phận Giao Vận</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý đơn hàng bán buôn, tiến độ điều xe giao hàng và bảng kết toán lợi nhuận ròng P&L theo từng vụ mùa.
            </p>
          </div>
        </div>

        {/* Action Buttons theo vai trò */}
        <div className="flex flex-wrap items-center gap-2">
          {!warehouseKeeper && (
            <Can permission="PERM_FINANCE_SALES_ORDER" role={["ROLE_ACCOUNTANT", "ROLE_FARM_MANAGER"]}>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setIsCreateOrderOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-xs text-xs"
              >
                + Tạo Đơn Bán Sỉ
              </Button>
            </Can>
          )}

          <Can permission="PERM_DELIVERY_MANAGE" role={["ROLE_WAREHOUSE_STAFF", "ROLE_FARM_MANAGER"]}>
            <Button
              variant={warehouseKeeper ? "primary" : "outline"}
              size="sm"
              icon={<Truck className="h-4 w-4 text-blue-600" />}
              onClick={() => setIsCreateDeliveryOpen(true)}
              className={warehouseKeeper ? "bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs text-xs" : "font-semibold text-xs border-slate-300 hover:bg-slate-50"}
            >
              + Lập Phiếu Giao Hàng
            </Button>
          </Can>

          {!warehouseKeeper && (
            <>
              <Can permission="PERM_FINANCE_PAYMENT" role="ROLE_ACCOUNTANT">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Receipt className="h-4 w-4 text-emerald-600" />}
                  onClick={() => handleOpenPayment(null)}
                  className="font-semibold text-xs border-slate-300 hover:bg-slate-50"
                >
                  + Lập Phiếu Thu/Chi
                </Button>
              </Can>

              <Can permission="PERM_PAYMENT_ALLOCATE" role="ROLE_ACCOUNTANT">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<CreditCard className="h-4 w-4 text-purple-600" />}
                  onClick={() => handleOpenAllocate(null)}
                  className="font-semibold text-xs border-slate-300 hover:bg-slate-50"
                >
                  + Phân Bổ / Cấn Trừ Nợ
                </Button>
              </Can>
            </>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TAB ĐIỀU HƯỚNG TINH GỌN, TRỰC QUAN                    */}
      {/* ======================================================== */}
      <div className="flex space-x-2 border-b border-slate-200 text-xs font-semibold overflow-x-auto no-scrollbar">
        {warehouseKeeper ? (
          // Tabs dành cho Thủ kho / Bộ phận giao vận
          [
            { 
              id: 'DELIVERIES', 
              label: 'Giao Hàng & Vận Chuyển', 
              icon: Truck, 
              badge: 'Nhiệm vụ chính' 
            },
            { 
              id: 'ORDERS', 
              label: 'Đơn Hàng Chờ Giao', 
              icon: Receipt 
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-all whitespace-nowrap font-bold ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-800 bg-blue-50/60 rounded-t-xl font-black'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="h-4 w-4 text-blue-600" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="rounded-full bg-blue-100 px-2 py-0.2 text-[10px] font-black text-blue-800">
                  {tab.badge}
                </span>
              )}
            </button>
          ))
        ) : (
          // Tabs dành cho Quản lý trại, Chủ đầu tư & Kế toán
          [
            { 
              id: 'SETTLEMENT', 
              label: 'Kết Toán Lợi Nhuận & P&L', 
              icon: ShieldCheck, 
              badge: 'P&L' 
            },
            { 
              id: 'ORDERS', 
              label: 'Đơn Hàng Bán Sỉ', 
              icon: Receipt 
            },
            { 
              id: 'DELIVERIES', 
              label: 'Giao Hàng & Vận Chuyển', 
              icon: Truck 
            },
            { 
              id: 'DEBT', 
              label: 'Sổ Nợ & Đối Soát', 
              icon: CreditCard 
            },
            { 
              id: 'PAYMENTS', 
              label: 'Phiếu Thu Chi & VietQR', 
              icon: ArrowLeftRight 
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-all whitespace-nowrap font-bold ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-800 bg-emerald-50/60 rounded-t-xl font-black'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="h-4 w-4 text-emerald-600" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-black text-emerald-800">
                  {tab.badge}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. NỘI DUNG TỪNG TAB                                     */}
      {/* ======================================================== */}
      {activeTab === 'SETTLEMENT' && (
        <CycleSettlementConsole farmId={activeFarmId} />
      )}

      {activeTab === 'ORDERS' && (
        <SalesOrderMonitorTab farmId={activeFarmId} />
      )}

      {activeTab === 'DEBT' && (
        <DebtMonitorTab 
          farmId={activeFarmId} 
          onOpenAllocateModal={(debt) => handleOpenAllocate(debt)}
          onOpenPaymentModal={(debt) => handleOpenPayment(debt)}
        />
      )}

      {activeTab === 'DELIVERIES' && (
        <SalesDeliveryMonitorTab 
          farmId={activeFarmId} 
          onOpenCreateDelivery={() => setIsCreateDeliveryOpen(true)} 
        />
      )}

      {activeTab === 'PAYMENTS' && (
        <PaymentMonitorTab 
          farmId={activeFarmId} 
          onOpenCreatePayment={() => handleOpenPayment(null)}
          onOpenAllocateModal={(debt) => handleOpenAllocate(debt)}
        />
      )}

      {/* ======================================================== */}
      {/* 5. GIAO DIỆN CÁC MODAL THỰC TẾ                            */}
      {/* ======================================================== */}
      <CreateSalesOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        activeFarmId={activeFarmId}
        onSuccess={() => notifyDataChanged?.('finance')}
      />

      <CreateDeliveryModal
        isOpen={isCreateDeliveryOpen}
        onClose={() => setIsCreateDeliveryOpen(false)}
        activeFarmId={activeFarmId}
        onSuccess={() => notifyDataChanged?.('finance')}
      />

      <CreatePaymentModal
        isOpen={isCreatePaymentOpen}
        onClose={() => {
          setIsCreatePaymentOpen(false);
          setSelectedDebtForPayment(null);
        }}
        activeFarmId={activeFarmId}
        initialDebt={selectedDebtForPayment}
        onSuccess={() => notifyDataChanged?.('finance')}
      />

      <AllocateOrOffsetDebtModal
        isOpen={isAllocateDebtOpen}
        onClose={() => {
          setIsAllocateDebtOpen(false);
          setSelectedDebtForAllocate(null);
        }}
        activeFarmId={activeFarmId}
        initialDebt={selectedDebtForAllocate}
        preselectedDebtId={selectedDebtForAllocate?.id}
        onSuccess={() => notifyDataChanged?.('finance')}
      />
    </div>
  );
}

export default SalesCashflowWorkspace;
