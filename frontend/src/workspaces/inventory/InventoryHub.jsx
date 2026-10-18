import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Boxes,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  ClipboardCheck,
  Layers,
  Plus,
  Calendar,
  Building2,
  FileText,
} from 'lucide-react';
import WarehouseListPage from '../../pages/inventory/warehouses/WarehouseListPage';
import MaterialListPage from '../../pages/inventory/materials/MaterialListPage';
import { ReceiptListPage } from '../../pages/inventory/receipts/ReceiptListPage';
import { IssueListPage } from '../../pages/inventory/issues/IssueListPage';
import { InventoryBalancePage } from '../../pages/inventory/balances/InventoryBalancePage';

/**
 * Workspace C: Trung Tâm Kho Bãi & Giao Dịch Vật Tư (RULE-UI-001 & RULE-DB-UI-SYNC-001).
 * Hợp nhất 7 phân hệ nghiệp vụ kho bãi chuẩn hóa theo DDL MySQL V1_0 - V1_5:
 * - 3.1: warehouses (Quản lý kho bãi)
 * - 3.2: materials (Danh mục vật tư nông nghiệp)
 * - 3.3: warehouse_receipts (Phiếu nhập kho & nhập mua NCC)
 * - 3.4: warehouse_issues (Phiếu xuất kho & xuất tiêu hao production_backflush)
 * - 3.5: warehouse_transfers (Phiếu điều chuyển kho nội bộ)
 * - 3.6: stocktakes (Biên bản kiểm kê kho & cân bằng thẻ kho)
 * - 3.7: warehouse_inventory (Sổ kho & Tồn kho theo lô FEFO)
 */
export const InventoryHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentTab = searchParams.get('tab') || 'warehouses';

  const [activeTab, setActiveTab] = useState(currentTab);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const tabs = [
    {
      id: 'warehouses',
      label: '3.1. Kho Bãi',
      table: 'warehouses',
      icon: Boxes,
      badge: 'Kho Trang Trại',
    },
    {
      id: 'materials',
      label: '3.2. Vật Tư',
      table: 'materials',
      icon: Package,
      badge: 'SKU & Định Mức',
    },
    {
      id: 'receipts',
      label: '3.3. Nhập Kho',
      table: 'warehouse_receipts',
      icon: ArrowDownToLine,
      badge: 'Nhập Mua / Điều Chuyển',
    },
    {
      id: 'issues',
      label: '3.4. Xuất Kho',
      table: 'warehouse_issues',
      icon: ArrowUpFromLine,
      badge: 'Xuất Dùng / Backflush',
    },
    {
      id: 'transfers',
      label: '3.5. Điều Chuyển',
      table: 'warehouse_transfers',
      icon: ArrowLeftRight,
      badge: 'Nội Bộ',
    },
    {
      id: 'stocktakes',
      label: '3.6. Kiểm Kê',
      table: 'stocktakes',
      icon: ClipboardCheck,
      badge: 'Cân Bằng Kho',
    },
    {
      id: 'balances',
      label: '3.7. Sổ Thẻ Kho',
      table: 'warehouse_inventory',
      icon: Layers,
      badge: 'Lô & HSD FEFO',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Workspace C Navigation Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                WORKSPACE C
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                RULE-DB-UI-SYNC-001
              </span>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">
                Trung Tâm Giao Dịch Kho Bãi & Quản Trị Vật Tư
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Hợp nhất quản lý mạng lưới kho (3.1), danh mục vật tư (3.2), chứng từ xuất/nhập/chuyển/kiểm (3.3 - 3.6) và sổ thẻ kho thời gian thực (3.7)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/inventory/receipts/new')}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm transition-all"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>+ Lập Phiếu Nhập</span>
            </button>
            <button
              onClick={() => navigate('/inventory/issues/new')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900 shadow-sm transition-all"
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              <span>+ Lập Phiếu Xuất</span>
            </button>
          </div>
        </div>

        {/* 7 Tab Switcher Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pt-3 scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-slate-800 text-amber-300 font-bold' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content Pane */}
      <div className="transition-all duration-200">
        {activeTab === 'warehouses' && <WarehouseListPage />}
        {activeTab === 'materials' && <MaterialListPage />}
        {activeTab === 'receipts' && <ReceiptListPage />}
        {activeTab === 'issues' && <IssueListPage />}
        {activeTab === 'balances' && <InventoryBalancePage />}

        {/* Tab 3.5: Điều chuyển kho (warehouse_transfers) */}
        {activeTab === 'transfers' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <ArrowLeftRight className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-800">
                Phiếu Điều Chuyển Kho Nội Bộ (warehouse_transfers)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Theo dõi việc luân chuyển vật tư và nông sản giữa các kho trong cùng hoặc khác trang trại. Bút toán xuất chuyển tự động ghi sổ thẻ kho loại <code className="font-mono text-amber-600">TRANSFER_OUT</code> và kho nhận xác nhận ghi <code className="font-mono text-emerald-600">TRANSFER_IN</code>.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleTabChange('balances')}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Xem Sổ Tồn Kho Theo Lô (3.7)
              </button>
              <button
                onClick={() => navigate('/inventory/issues/new')}
                className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-semibold transition"
              >
                + Lập Phiếu Xuất Chuyển Kho
              </button>
            </div>
          </div>
        )}

        {/* Tab 3.6: Kiểm kê kho (stocktakes) */}
        {activeTab === 'stocktakes' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <ClipboardCheck className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-800">
                Đợt Kiểm Kê Kho & Đối Soát Thẻ Kho (stocktakes)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Ghi nhận số lượng kiểm đếm thực tế của từng lô hàng so với tồn sổ sách trong <code className="font-mono text-slate-700">warehouse_inventory</code>. Khi duyệt đợt kiểm kê, hệ thống tự động sinh bút toán <code className="font-mono text-indigo-600">ADJUSTMENT</code> để cân bằng số liệu.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleTabChange('balances')}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Xem Thẻ Kho Hiện Tại (3.7)
              </button>
              <button
                onClick={() => navigate('/inventory/receipts/new')}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-semibold transition"
              >
                + Nhập Điều Chỉnh Kiểm Kê
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryHub;
