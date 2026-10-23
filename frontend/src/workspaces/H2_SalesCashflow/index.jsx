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
import { DebtMonitorTab } from './components/DebtMonitorTab';

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
  const { activeFarmId, activeFarm } = useActiveFarmStore();
  const { isOwner, isFarmManager } = useAuthStore();
  const owner = isOwner();
  const manager = isFarmManager();

  // Mặc định cho Owner & Farm Manager là tab SETTLEMENT, cho nhân sự trại là tab ORDERS
  const [activeTab, setActiveTab] = useState(owner || manager ? 'SETTLEMENT' : 'ORDERS');

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
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {owner
                ? 'Giám sát bán sỉ, công nợ hai chiều và nhận chuyển khoản lợi nhuận ròng trực tiếp từ các trang trại'
                : manager
                ? 'Kiểm tra đối soát doanh thu, chi phí, ký duyệt kết toán chu kỳ nội bộ trước khi Kế toán chuyển tiền cho Owner'
                : 'Lên đơn bán sỉ, giữ chỗ lô hàng, xuất giao nhiều đợt và cấn trừ công nợ hai chiều tại trang trại'}
            </p>
          </div>
        </div>

        {/* Action Buttons theo vai trò Maker-Checker */}
        <div className="flex items-center gap-2">
          {activeTab === 'ORDERS' && (
            <Can permission="PERM_FINANCE_SALES_ORDER" role="ROLE_ACCOUNTANT">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => alert('Kế toán lập đơn bán sỉ mới (PENDING)')}
              >
                + Tạo Đơn Bán Sỉ
              </Button>
            </Can>
          )}

          {activeTab === 'DELIVERIES' && (
            <Can permission="PERM_DELIVERY_MANAGE" role="ROLE_WAREHOUSE_STAFF">
              <Button
                variant="primary"
                size="sm"
                icon={<Truck className="h-4 w-4" />}
                onClick={() => alert('Thủ kho lập phiếu giao hàng mới')}
              >
                + Lập Phiếu Giao Hàng
              </Button>
            </Can>
          )}

          {activeTab === 'DEBT' && (
            <Can permission="PERM_PAYMENT_ALLOCATE" role="ROLE_ACCOUNTANT">
              <Button
                variant="primary"
                size="sm"
                icon={<CreditCard className="h-4 w-4" />}
                onClick={() => alert('Kế toán phân bổ / cấn trừ công nợ đối tác 2 chiều')}
              >
                + Phân Bổ / Cấn Trừ Nợ
              </Button>
            </Can>
          )}

          {activeTab === 'PAYMENTS' && (
            <Can permission="PERM_FINANCE_PAYMENT" role="ROLE_ACCOUNTANT">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => alert('Kế toán lập phiếu thu/chi mới (PENDING)')}
              >
                + Lập Phiếu Thu/Chi
              </Button>
            </Can>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. BANNER THÔNG ĐIỆP DÀNH CHO FARM MANAGER               */}
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
        <DebtMonitorTab farmId={activeFarmId} />
      )}

      {/* Cho Kế toán / Nhân viên trại khi mở tab DELIVERIES hoặc PAYMENTS */}
      {!owner && !manager && activeTab === 'DELIVERIES' && (
        <SalesOrderMonitorTab farmId={activeFarmId} />
      )}

      {!owner && !manager && activeTab === 'PAYMENTS' && (
        <DebtMonitorTab farmId={activeFarmId} />
      )}
    </div>
  );
}

export default SalesCashflowWorkspace;
