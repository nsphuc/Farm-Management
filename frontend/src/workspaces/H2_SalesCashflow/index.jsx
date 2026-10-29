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
                {owner 
                  ? 'Trung Tâm Bán Hàng & Nhận Kết Toán Lợi Nhuận Chu Kỳ' 
                  : manager
                  ? 'Theo Dõi Doanh Thu & Ký Duyệt Bảng Kết Toán Chu Kỳ'
                  : warehouseKeeper
                  ? 'WS-H2: Điều Phối Xuất Kho Giao Hàng B2B & Chứng Từ POD'
                  : 'Trung Tâm Bán Hàng, Giao Hàng & Thu Phí VietQR'}
              </h1>
              {owner && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Chủ Đầu Tư (Owner)</span>
                </span>
              )}
              {manager && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-900 border border-blue-300">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Giám Đốc Trại</span>
                </span>
              )}
              {warehouseKeeper && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-900 border border-blue-300">
                  <Truck className="h-3 w-3 text-blue-700" />
                  <span>Bộ Phận Giao Vận Kho</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {owner
                ? 'Giám sát bán sỉ, công nợ hai chiều và nhận chuyển khoản lợi nhuận ròng trực tiếp từ các trang trại'
                : manager
                ? 'Kiểm tra đối soát doanh thu, chi phí, ký duyệt kết toán chu kỳ nội bộ trước khi Kế toán chuyển tiền cho Owner'
                : warehouseKeeper
                ? 'Theo dõi đơn hàng đã duyệt, lập phiếu xuất kho nhiều đợt, điều xe giao hàng và cập nhật ảnh chứng từ POD'
                : 'Lên đơn bán sỉ, giữ chỗ lô hàng, xuất giao nhiều đợt và cấn trừ công nợ hai chiều tại trang trại'}
            </p>
          </div>
        </div>

        {/* Action Buttons theo vai trò Maker-Checker */}
        <div className="flex items-center gap-2">
          {(activeTab === 'ORDERS' || activeTab === 'DELIVERIES') && (
            <>
              {!warehouseKeeper && (
                <Can permission="PERM_FINANCE_SALES_ORDER" role={["ROLE_ACCOUNTANT", "ROLE_FARM_MANAGER"]}>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => setIsCreateOrderOpen(true)}
                  >
                    + Tạo Đơn Bán Sỉ
                  </Button>
                </Can>
              )}

              <Can permission="PERM_DELIVERY_MANAGE" role={["ROLE_WAREHOUSE_STAFF", "ROLE_FARM_MANAGER"]}>
                <Button
                  variant={warehouseKeeper ? "primary" : "outline"}
                  size="sm"
                  icon={<Truck className="h-4 w-4" />}
                  onClick={() => setIsCreateDeliveryOpen(true)}
                  className={warehouseKeeper ? "bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs" : ""}
                >
                  + Lập Phiếu Giao Hàng
                </Button>
              </Can>
            </>
          )}

          {!warehouseKeeper && (activeTab === 'DEBT' || activeTab === 'PAYMENTS') && (
            <>
              <Can permission="PERM_FINANCE_PAYMENT" role={["ROLE_ACCOUNTANT", "ROLE_FARM_MANAGER"]}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsCreatePaymentOpen(true)}
                >
                  + Lập Phiếu Thu/Chi
                </Button>
              </Can>

              <Can permission="PERM_PAYMENT_ALLOCATE" role={["ROLE_ACCOUNTANT", "ROLE_FARM_MANAGER"]}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<CreditCard className="h-4 w-4" />}
                  onClick={() => setIsAllocateDebtOpen(true)}
                >
                  + Phân Bổ / Cấn Trừ Nợ
                </Button>
              </Can>
            </>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. BANNER THÔNG ĐIỆP DÀNH CHO FARM MANAGER & THỦ KHO     */}
      {/* ======================================================== */}
      {manager && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 shadow-2xs animate-in fade-in">
          <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <strong className="block font-bold text-blue-950">
              Quy Trình Ký Duyệt Bảng Kết Toán Chu Kỳ Của Giám Đốc Trại:
            </strong>
            <p className="text-blue-800">
              Kế toán trại (Role 5) thực hiện bán hàng và thanh toán chi phí hàng ngày. Cuối mỗi Chu kỳ vận hành (#16), bạn vào <strong>Tab Duyệt Bảng Kết Toán</strong> để thẩm định đối soát Tổng Doanh Thu, Tổng Chi Phí và Lợi Nhuận Ròng của trại. Bấm nút <strong>[✍️ Ký Duyệt Bảng Kết Toán]</strong> để phê duyệt nội bộ, cấp phép cho Kế toán trại quét VietQR chuyển phần lợi nhuận về tài khoản của Chủ đầu tư (Owner)!
            </p>
          </div>
        </div>
      )}

      {/* Banner Vận Hành Dành Riêng Cho Thủ Kho / Giao Vận */}
      {warehouseKeeper && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 shadow-2xs animate-in fade-in">
          <Truck className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <strong className="block font-bold text-blue-950">
              Quy Trình Giao Vận & Xuất Kho Nông Sản B2B:
            </strong>
            <p className="text-blue-800">
              Bạn đang ở chế độ giao vận kho. Chọn tab <strong>Đơn Hàng Đã Duyệt Chờ Giao</strong> để kiểm tra các đơn đã được Giám đốc trại phê duyệt (<span className="font-semibold text-emerald-700">CONFIRMED</span>). Bấm nút <strong>[+ Lập Phiếu Giao Hàng]</strong> để xuất hàng theo đợt từ các lô thành phẩm đã in tem QR, cập nhật biển số xe, tài xế và đối tác vận chuyển.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TAB ĐIỀU HƯỚNG                                        */}
      {/* ======================================================== */}
      <div className="flex space-x-2 border-b border-slate-200 text-xs font-semibold overflow-x-auto">
        {owner ? (
          // Tabs dành cho Chủ Đầu Tư (Owner)
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
              id: 'DELIVERIES', 
              label: 'Tiến Độ Giao Vận & POD', 
              icon: Truck 
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
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors whitespace-nowrap ${
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
        ) : manager ? (
          // Tabs dành cho Giám Đốc Trang Trại (Farm Manager)
          [
            { 
              id: 'SETTLEMENT', 
              label: 'Duyệt Bảng Kết Toán Chu Kỳ Của Trại', 
              icon: ShieldCheck, 
              badge: 'Trọng tâm Duyệt Lợi Nhuận' 
            },
            { 
              id: 'ORDERS', 
              label: 'Theo Dõi Đơn Bán Sỉ & Giao Hàng (Read-Only)', 
              icon: Receipt 
            },
            { 
              id: 'DELIVERIES', 
              label: 'Tiến Độ Giao Vận & POD', 
              icon: Truck 
            },
            { 
              id: 'DEBT', 
              label: 'Sổ Cái Công Nợ & Thu Chi (Read-Only)', 
              icon: CreditCard 
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 font-bold rounded-t-xl'
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
        ) : warehouseKeeper ? (
          // Tabs dành cho Thủ kho / Bộ phận giao vận (Bảo mật SoD: ẨN DEBT & PAYMENTS & SETTLEMENT)
          [
            { 
              id: 'DELIVERIES', 
              label: 'Xuất Giao Hàng Lên Xe & POD', 
              icon: Truck, 
              badge: 'Nhiệm vụ chính' 
            },
            { 
              id: 'ORDERS', 
              label: 'Đơn Hàng Đã Duyệt Chờ Giao (Read-Only)', 
              icon: Receipt 
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700 bg-blue-50/40 font-bold rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
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
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors whitespace-nowrap ${
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
          onOpenAllocateModal={() => setIsAllocateDebtOpen(true)}
          onOpenPaymentModal={() => setIsCreatePaymentOpen(true)}
        />
      )}

      {activeTab === 'DELIVERIES' && (
        <SalesDeliveryMonitorTab 
          farmId={activeFarmId} 
          onOpenCreateDelivery={() => setIsCreateDeliveryOpen(true)} 
        />
      )}

      {activeTab === 'PAYMENTS' && (
        <DebtMonitorTab 
          farmId={activeFarmId} 
          onOpenAllocateModal={() => setIsAllocateDebtOpen(true)}
          onOpenPaymentModal={() => setIsCreatePaymentOpen(true)}
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
        onClose={() => setIsCreatePaymentOpen(false)}
        activeFarmId={activeFarmId}
        onSuccess={() => notifyDataChanged?.('finance')}
      />

      <AllocateOrOffsetDebtModal
        isOpen={isAllocateDebtOpen}
        onClose={() => setIsAllocateDebtOpen(false)}
        activeFarmId={activeFarmId}
        onSuccess={() => notifyDataChanged?.('finance')}
      />
    </div>
  );
}

export default SalesCashflowWorkspace;
