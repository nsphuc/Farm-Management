import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Sparkles,
  DollarSign,
  Layers,
  Building,
  Building2,
  Syringe,
  Pill,
  Trash2,
  Edit2,
  History,
  TrendingDown,
  Info,
  Calendar,
  Check,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  FileText,
  Sliders,
  Scale,
  Receipt,
  Warehouse,
  Tag,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { masterDataService } from '@/services/modules/masterDataService';
import { inventoryService } from '@/services/modules/inventoryService';
import { barnBatchService } from '@/services/modules/barnBatchService';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { formatNumber, formatCurrency, formatDate } from '@/utils/formatters';

// ================= DỮ LIỆU MẪU CHUẨN THỰC CHIẾN FARMGO =================

const INITIAL_WAREHOUSES = [
  { id: 1, code: 'WH_FEED_A', name: 'Kho Cám Khu A (Gà)', location: 'Cạnh Chuồng A1' },
  { id: 2, code: 'WH_FEED_B', name: 'Kho Cám Khu B (Heo)', location: 'Cạnh Chuồng B1' },
  { id: 3, code: 'WH_MED', name: 'Kho Thuốc & Vắc-Xin', location: 'Phòng Kỹ Thuật Thú Y' },
  { id: 4, code: 'WH_SUPPLY', name: 'Kho Vật Tư & Sát Trùng', location: 'Cổng Khử Trùng Số 1' },
];

const INITIAL_INVENTORY_ITEMS = [
  {
    id: 1,
    sku: 'CAM-GA-01',
    name: 'Cám Gà Con GĐ1 (0-14 ngày)',
    category: 'FEED',
    categoryName: 'Thức ăn hỗn hợp',
    warehouseId: 1,
    warehouseName: 'Kho Cám Khu A',
    packUnit: 'Bao',
    baseUnit: 'Kg',
    conversionRatio: 25, // 1 bao = 25 kg
    stockPack: 50,
    stockBase: 1250,
    minThresholdPack: 20,
    costPricePerPack: 362500, // 14.500 đ/kg
    totalValue: 18125000,
    nearestExpiryDate: '2027-03-20',
    daysUntilExpiry: 490,
    withdrawalDays: 0,
    lots: [
      { id: 101, lotCode: 'LOT-CGA1-2610A', importDate: '2026-10-15', expiryDate: '2027-03-20', stockPack: 30, stockBase: 750, isPriority: true },
      { id: 102, lotCode: 'LOT-CGA1-2611B', importDate: '2026-11-02', expiryDate: '2027-04-10', stockPack: 20, stockBase: 500, isPriority: false },
    ],
    stockCardHistory: [
      { id: 1, time: '2026-11-15 07:15', type: 'OUT_AUTO', title: 'Tự động trừ kho từ Nhật ký Chuồng A1', qtyPack: -6, qtyBase: -150, balancePack: 50, ref: 'NK-A1-1511', user: 'Nguyễn Văn Công Nhân' },
      { id: 2, time: '2026-11-14 07:15', type: 'OUT_AUTO', title: 'Tự động trừ kho từ Nhật ký Chuồng A1', qtyPack: -6, qtyBase: -150, balancePack: 56, ref: 'NK-A1-1411', user: 'Nguyễn Văn Công Nhân' },
      { id: 3, time: '2026-11-02 09:30', type: 'IN_PURCHASE', title: 'Nhập hàng hóa đơn PO-261102', qtyPack: +40, qtyBase: +1000, balancePack: 62, ref: 'HĐ-DABACO-88', user: 'Lê Kế Toán Kho' },
    ],
  },
  {
    id: 2,
    sku: 'CAM-GA-02',
    name: 'Cám Gà Thịt Giai Đoạn 2 (15-28 ngày)',
    category: 'FEED',
    categoryName: 'Thức ăn hỗn hợp',
    warehouseId: 1,
    warehouseName: 'Kho Cám Khu A',
    packUnit: 'Bao',
    baseUnit: 'Kg',
    conversionRatio: 25,
    stockPack: 192,
    stockBase: 4800,
    minThresholdPack: 40,
    costPricePerPack: 345000,
    totalValue: 66240000,
    nearestExpiryDate: '2027-04-10',
    daysUntilExpiry: 511,
    withdrawalDays: 0,
    lots: [
      { id: 103, lotCode: 'LOT-CGA2-2610C', importDate: '2026-10-25', expiryDate: '2027-04-10', stockPack: 192, stockBase: 4800, isPriority: true },
    ],
    stockCardHistory: [
      { id: 4, time: '2026-11-15 07:15', type: 'OUT_AUTO', title: 'Tự động trừ kho từ Nhật ký Chuồng A1', qtyPack: -12, qtyBase: -300, balancePack: 192, ref: 'NK-A1-1511', user: 'Nguyễn Văn Công Nhân' },
      { id: 5, time: '2026-10-25 14:00', type: 'IN_PURCHASE', title: 'Nhập kho lô mới 200 bao', qtyPack: +200, qtyBase: +5000, balancePack: 204, ref: 'HĐ-CP-902', user: 'Lê Kế Toán Kho' },
    ],
  },
  {
    id: 3,
    sku: 'CAM-HEO-02',
    name: 'Cám Heo Choai Tăng Trọng (GĐ2)',
    category: 'FEED',
    categoryName: 'Thức ăn hỗn hợp',
    warehouseId: 2,
    warehouseName: 'Kho Cám Khu B',
    packUnit: 'Bao',
    baseUnit: 'Kg',
    conversionRatio: 25,
    stockPack: 8, // DƯỚI ĐỊNH MỨC TỐI THIỂU
    stockBase: 200,
    minThresholdPack: 20,
    costPricePerPack: 355000,
    totalValue: 2840000,
    nearestExpiryDate: '2027-02-15',
    daysUntilExpiry: 457,
    withdrawalDays: 0,
    lots: [
      { id: 104, lotCode: 'LOT-CH2-2609', importDate: '2026-09-18', expiryDate: '2027-02-15', stockPack: 8, stockBase: 200, isPriority: true },
    ],
    stockCardHistory: [
      { id: 6, time: '2026-11-15 08:00', type: 'OUT_AUTO', title: 'Tự động trừ kho từ Nhật ký Chuồng B1', qtyPack: -15, qtyBase: -375, balancePack: 8, ref: 'NK-B1-1511', user: 'Lê Văn Trại Trưởng' },
    ],
  },
  {
    id: 4,
    sku: 'VAC-GUM-01',
    name: 'Vắc-xin Gumboro chủng D78',
    category: 'VACCINE',
    categoryName: 'Vắc-xin',
    warehouseId: 3,
    warehouseName: 'Kho Thuốc & Vắc-Xin',
    packUnit: 'Lọ',
    baseUnit: 'Liều',
    conversionRatio: 1000,
    stockPack: 15,
    stockBase: 15000,
    minThresholdPack: 10,
    costPricePerPack: 180000,
    totalValue: 2700000,
    nearestExpiryDate: '2026-12-05', // CẬN HẠN DÙNG < 30 NGÀY
    daysUntilExpiry: 20,
    withdrawalDays: 0,
    lots: [
      { id: 105, lotCode: 'LOT-GUM-2512', importDate: '2025-12-10', expiryDate: '2026-12-05', stockPack: 15, stockBase: 15000, isPriority: true },
    ],
    stockCardHistory: [
      { id: 7, time: '2026-10-28 10:00', type: 'OUT_AUTO', title: 'Xuất sử dụng uống Chuồng A1', qtyPack: -2, qtyBase: -2000, balancePack: 15, ref: 'NK-A1-2810', user: 'Trần Kỹ Thuật Viên' },
    ],
  },
  {
    id: 5,
    sku: 'VAC-NDIB-01',
    name: 'Vắc-xin ND-IB Clon 30 + H120',
    category: 'VACCINE',
    categoryName: 'Vắc-xin',
    warehouseId: 3,
    warehouseName: 'Kho Thuốc & Vắc-Xin',
    packUnit: 'Lọ',
    baseUnit: 'Liều',
    conversionRatio: 1000,
    stockPack: 10,
    stockBase: 10000,
    minThresholdPack: 8,
    costPricePerPack: 140000,
    totalValue: 1400000,
    nearestExpiryDate: '2026-11-28', // CẬN HẠN DÙNG < 30 NGÀY (CÒN 13 NGÀY)
    daysUntilExpiry: 13,
    withdrawalDays: 0,
    lots: [
      { id: 106, lotCode: 'LOT-NDIB-2511', importDate: '2025-11-20', expiryDate: '2026-11-28', stockPack: 10, stockBase: 10000, isPriority: true },
    ],
    stockCardHistory: [
      { id: 8, time: '2026-10-22 09:00', type: 'OUT_AUTO', title: 'Xuất nhỏ mắt Chuồng A1', qtyPack: -2, qtyBase: -2000, balancePack: 10, ref: 'NK-A1-2210', user: 'Trần Kỹ Thuật Viên' },
    ],
  },
  {
    id: 6,
    sku: 'MED-AMOX-01',
    name: 'Kháng sinh Amox 50% bột hòa tan',
    category: 'MEDICINE',
    categoryName: 'Thuốc thú y',
    warehouseId: 3,
    warehouseName: 'Kho Thuốc & Vắc-Xin',
    packUnit: 'Gói',
    baseUnit: 'Gram',
    conversionRatio: 100,
    stockPack: 25,
    stockBase: 2500,
    minThresholdPack: 15,
    costPricePerPack: 120000,
    totalValue: 3000000,
    nearestExpiryDate: '2027-08-15',
    daysUntilExpiry: 638,
    withdrawalDays: 7, // NGƯNG THUỐC 7 NGÀY
    lots: [
      { id: 107, lotCode: 'LOT-AMX-2608', importDate: '2026-08-10', expiryDate: '2027-08-15', stockPack: 25, stockBase: 2500, isPriority: true },
    ],
    stockCardHistory: [
      { id: 9, time: '2026-11-05 11:30', type: 'OUT_AUTO', title: 'Xuất điều trị tiêu chảy Chuồng A1', qtyPack: -3, qtyBase: -300, balancePack: 25, ref: 'NK-A1-0511', user: 'Trần Kỹ Thuật Viên' },
    ],
  },
  {
    id: 7,
    sku: 'MED-PROBIO-01',
    name: 'Men tiêu hóa vi sinh Probio Active',
    category: 'MEDICINE',
    categoryName: 'Thuốc thú y',
    warehouseId: 3,
    warehouseName: 'Kho Thuốc & Vắc-Xin',
    packUnit: 'Gói',
    baseUnit: 'Kg',
    conversionRatio: 1,
    stockPack: 40,
    stockBase: 40,
    minThresholdPack: 20,
    costPricePerPack: 165000,
    totalValue: 6600000,
    nearestExpiryDate: '2027-11-10',
    daysUntilExpiry: 725,
    withdrawalDays: 0,
    lots: [
      { id: 108, lotCode: 'LOT-PRO-2610', importDate: '2026-10-05', expiryDate: '2027-11-10', stockPack: 40, stockBase: 40, isPriority: true },
    ],
    stockCardHistory: [
      { id: 10, time: '2026-11-15 11:00', type: 'OUT_AUTO', title: 'Xuất pha nước uống Chuồng A1', qtyPack: -2, qtyBase: -2, balancePack: 40, ref: 'NK-A1-1511', user: 'Trần Kỹ Thuật Viên' },
    ],
  },
  {
    id: 8,
    sku: 'SUP-VOI-01',
    name: 'Vôi bột sát trùng khử khuẩn lối đi',
    category: 'SUPPLIES',
    categoryName: 'Sát trùng & Dụng cụ',
    warehouseId: 4,
    warehouseName: 'Kho Vật Tư & Sát Trùng',
    packUnit: 'Bao',
    baseUnit: 'Kg',
    conversionRatio: 25,
    stockPack: 4, // DƯỚI ĐỊNH MỨC TỐI THIỂU
    stockBase: 100,
    minThresholdPack: 10,
    costPricePerPack: 65000,
    totalValue: 260000,
    nearestExpiryDate: '2028-12-31',
    daysUntilExpiry: 1142,
    withdrawalDays: 0,
    lots: [
      { id: 109, lotCode: 'LOT-VOI-2601', importDate: '2026-01-10', expiryDate: '2028-12-31', stockPack: 4, stockBase: 100, isPriority: true },
    ],
    stockCardHistory: [
      { id: 11, time: '2026-11-05 10:00', type: 'OUT_INTERNAL', title: 'Rắc lối đi cách ly Chuồng A1', qtyPack: -2, qtyBase: -50, balancePack: 4, ref: 'PX-SATTRUNG-01', user: 'Nguyễn Văn Công Nhân' },
    ],
  },
];

export function InventoryPage() {
  const { userInfo, hasPermission, isOwner, isSuperAdmin } = useAuthStore();
  const userRoles = (userInfo?.roles || []).map((r) => (typeof r === 'string' ? r : r?.code)).filter(Boolean);

  // ================= RBAC QUYỀN HẠN SỐ LIỆU TÀI CHÍNH KHO =================
  const isOwnerOrSuper = isOwner?.() || isSuperAdmin?.() || userRoles.includes('ROLE_FARM_OWNER');
  const isAccountant = userRoles.includes('ROLE_ACCOUNTANT');

  // Quyền xem giá vốn & tổng giá trị tồn kho (Chủ trại, Kế toán kho)
  const canViewCost =
    isOwnerOrSuper ||
    isAccountant ||
    hasPermission?.('financial.price.view') ||
    hasPermission?.('financial.view_cost');

  // Quyền tạo mới mặt hàng
  const canCreateItem =
    isOwnerOrSuper ||
    isAccountant ||
    hasPermission?.('inventory.create') ||
    hasPermission?.('inventory.manage');

  const rawFarmId = useActiveFarmStore((s) => s.activeFarmId);
  const defaultFarmId = Number(userInfo?.accessibleFarms?.[0]?.farmId || userInfo?.accessibleFarms?.[0]?.id || 1);
  const activeFarmId = (rawFarmId && rawFarmId !== 'ALL' && !isNaN(Number(rawFarmId))) ? Number(rawFarmId) : defaultFarmId;
  const currentBranchId = useActiveBranchStore((s) => s.currentBranchId);
  const dataVersion = useActiveBranchStore((s) => s.dataVersion);

  // Sync warehouseId with URL search params from sidebar
  const [searchParams, setSearchParams] = useSearchParams();
  const urlWarehouseId = searchParams.get('warehouseId');

  // ================= STATE DỮ LIỆU & BỘ LỌC =================
  const [warehouses, setWarehouses] = useState([]);
  const [zones, setZones] = useState([]);
  const [materialCategories, setMaterialCategories] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);

  // Tải danh sách Kho, Phân khu nuôi và Tồn kho thật từ Backend lọc theo Chi nhánh đang chọn
  React.useEffect(() => {
    let isMounted = true;
    const fetchRealData = async () => {
      try {
        const effectiveBranchId = currentBranchId === 'ALL' ? undefined : (currentBranchId || 1);
        const [whRes, invRes, zonesRes, catRes] = await Promise.all([
          masterDataService.getWarehouses(activeFarmId, { branchId: effectiveBranchId }),
          inventoryService.getInventory({ farmId: activeFarmId, branchId: effectiveBranchId, size: 100 }),
          barnBatchService.getZones({ farmId: activeFarmId, branchId: effectiveBranchId }).catch(() => []),
          masterDataService.getMaterialCategories({ size: 50 }).catch(() => []),
        ]);

        if (isMounted) {
          if (Array.isArray(whRes)) {
            setWarehouses(whRes);
          }
          if (Array.isArray(zonesRes)) {
            setZones(zonesRes);
          }
          const catList = Array.isArray(catRes) ? catRes : (catRes?.content || []);
          if (Array.isArray(catList)) {
            setMaterialCategories(catList);
          }
          const invContent = Array.isArray(invRes) ? invRes : (invRes?.content || []);
          if (invContent.length === 0) {
            setInventoryList([]);
          } else {
            setInventoryList(invContent.map((item) => {
              const rawRatio = Number(item.conversionFactor) || 1;
              const ratio = rawRatio > 0 && rawRatio < 1 ? Math.round(1 / rawRatio) : rawRatio;
              const stdUnit = item.standardUnit || 'Kg';
              const pUnit = item.packUnit || stdUnit;
              const bUnit = item.baseUnit || stdUnit;
              const rawQty = Number(item.quantityOnHand) || 0;

              let sPack = rawQty;
              let sBase = rawQty;
              if (ratio > 1 && pUnit.toLowerCase() !== bUnit.toLowerCase()) {
                if (stdUnit.toLowerCase() === bUnit.toLowerCase()) {
                  sBase = rawQty;
                  sPack = Number((rawQty / ratio).toFixed(2));
                } else {
                  sPack = rawQty;
                  sBase = Number((rawQty * ratio).toFixed(2));
                }
              }

              const costPerBase = Number(item.unitCost) || 0;
              const costPerPack = (ratio > 1 && stdUnit.toLowerCase() === bUnit.toLowerCase())
                ? costPerBase * ratio
                : costPerBase;

              return {
                id: item.id,
                materialId: item.materialId || item.id,
                sku: item.skuCode || item.materialSku || `VT-${item.id}`,
                name: item.materialName || item.name || 'Vật tư',
                category: item.materialCategoryCode || 'FEED',
                categoryName: item.materialCategoryName || 'Thức ăn & Dinh dưỡng',
                warehouseId: item.warehouseId || 1,
                warehouseName: item.warehouseName || 'Kho hàng',
                packUnit: pUnit,
                baseUnit: bUnit,
                conversionRatio: ratio,
                stockPack: sPack,
                stockBase: sBase,
                minThresholdPack: Number(item.minStockLevel) || 10,
                costPricePerPack: costPerPack,
                totalValue: rawQty * costPerBase,
                nearestExpiryDate: item.expiryDate || '2027-12-31',
                daysUntilExpiry: item.daysUntilExpiry ?? 300,
                withdrawalDays: item.defaultPhiDays || 0,
                lots: item.batchNumber ? [{
                  id: item.id,
                  lotCode: item.batchNumber,
                  importDate: item.inwardDate,
                  expiryDate: item.expiryDate,
                  stockPack: sPack,
                  stockBase: sBase,
                  isPriority: true,
                }] : [],
                stockCardHistory: [],
              };
            }));
          }
        }
      } catch (err) {
        console.warn('Could not load real inventory data, using defaults:', err);
      }
    };
    fetchRealData();
    return () => { isMounted = false; };
  }, [activeFarmId, currentBranchId, dataVersion]);

  // Bộ lọc
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(urlWarehouseId || 'ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // ALL, IN_STOCK, LOW_STOCK, OUT_OF_STOCK, NEAR_EXPIRY

  // Đồng bộ với URL Param khi user chọn kho hoặc bấm "+ Thêm kho mới" từ Sidebar
  React.useEffect(() => {
    if (urlWarehouseId) {
      setSelectedWarehouseId(urlWarehouseId);
    } else {
      setSelectedWarehouseId('ALL');
    }
    if (searchParams.get('action') === 'create-warehouse') {
      handleOpenWarehouseModal();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('action');
      setSearchParams(nextParams, { replace: true });
    }
  }, [urlWarehouseId, searchParams]);

  const handleSelectWarehouse = (whId) => {
    setSelectedWarehouseId(whId);
    const nextParams = new URLSearchParams(searchParams);
    if (whId === 'ALL') {
      nextParams.delete('warehouseId');
    } else {
      nextParams.set('warehouseId', String(whId));
    }
    setSearchParams(nextParams);
  };

  // SlideOverDrawer Chi tiết mặt hàng
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedItemForDrawer, setSelectedItemForDrawer] = useState(null);
  const [drawerActiveTab, setDrawerActiveTab] = useState('LOTS'); // LOTS, STOCK_CARD, CONVERSION_CONFIG

  // Modal Thêm mặt hàng mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    sku: '',
    name: '',
    category: 'FEED',
    warehouseId: 1,
    packUnit: 'Bao',
    baseUnit: 'Kg',
    conversionRatio: 25,
    minThresholdPack: 10,
    costPricePerPack: 350000,
    withdrawalDays: 0,
  });

  // Modal Quản lý danh mục kho bãi & liên kết khu nuôi
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isEditingWarehouse, setIsEditingWarehouse] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({
    id: null,
    code: '',
    name: '',
    warehouseType: 'FEED',
    zoneId: '',
    locationDesc: '',
    capacityM3: 500,
    floorAreaM2: 200,
  });

  // Modal Nhóm hàng hóa & Đơn vị tính
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isUnitsModalOpen, setIsUnitsModalOpen] = useState(false);

  // Modal Tạo đơn nhập hàng
  const [isCreateReceiptModalOpen, setIsCreateReceiptModalOpen] = useState(false);
  const [receiptForm, setReceiptForm] = useState({
    warehouseId: '',
    materialId: '',
    supplierName: 'Công ty Cổ phần Chăn nuôi C.P. Việt Nam',
    invoiceNumber: '',
    batchNumber: '',
    expiryDate: '2027-06-30',
    quantityPack: 50,
    unitPrice: 350000,
    notes: '',
  });

  // ================= TÍNH TOÁN 4 THẺ KPI TRÊN CÙNG THEO KHO ĐANG CHỌN =================
  const kpiStats = useMemo(() => {
    const targetItems = selectedWarehouseId !== 'ALL'
      ? inventoryList.filter((item) => item.warehouseId === Number(selectedWarehouseId))
      : inventoryList;

    const totalItems = targetItems.length;
    const totalValue = targetItems.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
    const lowStockCount = targetItems.filter((item) => item.stockPack <= item.minThresholdPack).length;
    const nearExpiryCount = targetItems.filter((item) => item.daysUntilExpiry <= 30).length;

    const activeWarehouseCount = selectedWarehouseId !== 'ALL'
      ? 1
      : warehouses.length;

    return {
      totalItems,
      totalValue,
      lowStockCount,
      nearExpiryCount,
      activeWarehouseCount,
    };
  }, [inventoryList, warehouses, selectedWarehouseId]);

  // ================= LỌC DANH SÁCH MẶT HÀNG =================
  const filteredInventory = useMemo(() => {
    return inventoryList.filter((item) => {
      // 1. Kho
      if (selectedWarehouseId !== 'ALL' && item.warehouseId !== Number(selectedWarehouseId)) {
        return false;
      }

      // 2. Nhóm hàng
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // 3. Trạng thái
      if (selectedStatus === 'LOW_STOCK' && item.stockPack > item.minThresholdPack) {
        return false;
      }
      if (selectedStatus === 'NEAR_EXPIRY' && item.daysUntilExpiry > 30) {
        return false;
      }
      if (selectedStatus === 'IN_STOCK' && item.stockPack <= 0) {
        return false;
      }
      if (selectedStatus === 'OUT_OF_STOCK' && item.stockPack > 0) {
        return false;
      }

      // 4. Tìm kiếm từ khóa
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchName = item.name.toLowerCase().includes(kw);
        const matchSku = item.sku.toLowerCase().includes(kw);
        if (!matchName && !matchSku) return false;
      }

      return true;
    });
  }, [inventoryList, selectedWarehouseId, selectedCategory, selectedStatus, searchKeyword]);

  // ================= HANDLERS =================
  const handleOpenDrawer = async (item) => {
    setSelectedItemForDrawer(item);
    setDrawerActiveTab('LOTS');
    setIsDrawerOpen(true);

    try {
      const targetFarmId = activeFarmId && activeFarmId !== 'ALL' ? Number(activeFarmId) : 1;
      const txRes = await inventoryService.getTransactions({
        farmId: targetFarmId,
        materialId: item.materialId || item.id,
        warehouseId: item.warehouseId || undefined,
        size: 50,
      });
      const txList = Array.isArray(txRes) ? txRes : (txRes?.content || []);
      const ratio = Number(item.conversionRatio) || 1;
      const mappedHistory = txList.map((tx) => {
        const rawQty = Number(tx.quantity) || 0;
        const isOut = String(tx.direction || '').toUpperCase() === 'OUT'
          || String(tx.transactionType || '').toUpperCase().includes('OUT')
          || String(tx.transactionType || '').toUpperCase().includes('ISSUE');
        const signedBase = isOut ? -Math.abs(rawQty) : Math.abs(rawQty);
        const signedPack = ratio > 1 ? Number((signedBase / ratio).toFixed(2)) : signedBase;
        const balAfterBase = Number(tx.balanceAfter ?? 0);
        const balAfterPack = ratio > 1 ? Number((balAfterBase / ratio).toFixed(2)) : balAfterBase;
        const timeStr = tx.createdAt
          ? String(tx.createdAt).replace('T', ' ').substring(0, 16)
          : (tx.transactionDate || '');
        return {
          id: tx.id,
          time: timeStr,
          type: tx.transactionType || (isOut ? 'OUT_AUTO' : 'IN_PURCHASE'),
          title: tx.notes || (isOut ? 'Xuất kho sử dụng / điều chuyển' : 'Nhập kho vật tư'),
          qtyPack: signedPack,
          qtyBase: signedBase,
          balancePack: balAfterPack,
          ref: tx.referenceDocType ? `${tx.referenceDocType}${tx.referenceDocId ? ` #${tx.referenceDocId}` : ''}` : (tx.batchNumber || '-'),
          user: tx.createdBy ? `User #${tx.createdBy}` : 'Hệ thống',
        };
      });
      setSelectedItemForDrawer((prev) =>
        prev && prev.id === item.id ? { ...prev, stockCardHistory: mappedHistory } : prev
      );
    } catch (err) {
      console.warn('Could not load stock card transactions:', err);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      toast.error('Vui lòng nhập tên hàng hóa');
      return;
    }
    if (!createForm.packUnit.trim() || !createForm.baseUnit.trim()) {
      toast.error('Vui lòng nhập đầy đủ Đơn vị nhập/đóng gói và Đơn vị sử dụng gốc');
      return;
    }
    const ratio = Number(createForm.conversionRatio) || 1;
    if (ratio <= 0) {
      toast.error('Hệ số quy đổi phải lớn hơn 0');
      return;
    }

    const wh = warehouses.find((w) => w.id === Number(createForm.warehouseId));
    const prefix = createForm.category === 'FEED' ? 'CAM' : createForm.category === 'VACCINE' ? 'VAC' : createForm.category === 'MEDICINE' ? 'MED' : 'SUP';
    const generatedSku = (createForm.sku.trim() || `${prefix}-${Date.now().toString().slice(-4)}`).toUpperCase();

    const matchedCat = materialCategories.find((c) => (c.code || '').toUpperCase() === createForm.category.toUpperCase())
      || materialCategories[0];

    let createdId = Date.now();
    if (matchedCat?.id) {
      try {
        const hasConv = createForm.packUnit.trim().toLowerCase() !== createForm.baseUnit.trim().toLowerCase();
        const createdMat = await masterDataService.createMaterial({
          categoryId: Number(matchedCat.id),
          skuCode: generatedSku,
          name: createForm.name.trim(),
          standardUnit: createForm.baseUnit.trim(),
          dispatchStrategy: 'FEFO',
          expiryAlertDays: 30,
          minStockLevel: Number(createForm.minThresholdPack) || 10,
          unitPriceStandard: Number(createForm.costPricePerPack) || 0,
          defaultPhiDays: Number(createForm.withdrawalDays) || 0,
          conversions: hasConv ? [{
            unitName: createForm.packUnit.trim(),
            conversionFactor: ratio,
            isPurchaseUnit: true,
            isDispatchUnit: false,
          }] : [],
        });
        if (createdMat?.id) createdId = createdMat.id;
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Không thể khai báo hàng hóa mới lên hệ thống');
        return;
      }
    }

    const newItem = {
      id: createdId,
      sku: generatedSku,
      name: createForm.name.trim(),
      category: createForm.category,
      categoryName: createForm.category === 'FEED' ? 'Thức ăn hỗn hợp' : createForm.category === 'VACCINE' ? 'Vắc-xin' : createForm.category === 'MEDICINE' ? 'Thuốc thú y' : 'Sát trùng & Dụng cụ',
      warehouseId: Number(createForm.warehouseId),
      warehouseName: wh ? wh.name : 'Kho chung',
      packUnit: createForm.packUnit.trim(),
      baseUnit: createForm.baseUnit.trim(),
      conversionRatio: ratio,
      stockPack: 0,
      stockBase: 0,
      minThresholdPack: Number(createForm.minThresholdPack) || 10,
      costPricePerPack: Number(createForm.costPricePerPack) || 0,
      totalValue: 0,
      nearestExpiryDate: '2027-12-31',
      daysUntilExpiry: 700,
      withdrawalDays: Number(createForm.withdrawalDays) || 0,
      lots: [],
      stockCardHistory: [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          type: 'INIT',
          title: 'Khai báo danh mục hàng hóa mới (Tồn đầu = 0)',
          qtyPack: 0,
          qtyBase: 0,
          balancePack: 0,
          ref: 'INIT-01',
          user: userInfo?.fullName || 'Quản lý kho',
        },
      ],
    };

    setInventoryList([newItem, ...inventoryList]);
    setIsCreateModalOpen(false);
    toast.success(`Đã khai báo hàng hóa "${newItem.name}" (${newItem.sku}) với tồn ban đầu = 0!`);
  };

  const handleExportStock = () => {
    toast.success('Đã xuất file báo cáo tồn kho Excel thành công!');
  };

  // Tự động sinh mã kho tuần tự tăng dần (VD: KHO-001, KHO-002...)
  const generateNextWarehouseCode = (whList = warehouses) => {
    let maxNum = 0;
    (whList || []).forEach((w) => {
      const match = String(w.code || '').toUpperCase().match(/^KHO-(\d+)$/);
      if (match) {
        const num = Number(match[1]);
        if (!Number.isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const nextNum = Math.max(maxNum + 1, (whList?.length || 0) + 1);
    return `KHO-${String(nextNum).padStart(3, '0')}`;
  };

  // Quản lý Danh mục Kho & Gắn Kho Cám với Khu nuôi
  const handleOpenWarehouseModal = () => {
    setIsEditingWarehouse(false);
    setWarehouseForm({
      id: null,
      code: generateNextWarehouseCode(warehouses),
      name: '',
      warehouseType: 'FEED',
      zoneId: zones[0]?.id || '',
      locationDesc: '',
      capacityM3: 500,
      floorAreaM2: 200,
    });
    setIsWarehouseModalOpen(true);
  };

  const handleEditWarehouseClick = (wh) => {
    setIsEditingWarehouse(true);
    setWarehouseForm({
      id: wh.id,
      code: wh.code || '',
      name: wh.name || '',
      warehouseType: wh.warehouseType || 'FEED',
      zoneId: wh.zoneId || '',
      locationDesc: wh.locationDesc || wh.location || '',
      capacityM3: wh.capacityM3 || 500,
      floorAreaM2: wh.floorAreaM2 || 200,
    });
  };

  const handleSaveWarehouse = async (e) => {
    e.preventDefault();
    if (!warehouseForm.name.trim() || !warehouseForm.code.trim()) {
      toast.error('Vui lòng điền mã và tên kho');
      return;
    }

    try {
      const isFeedType = warehouseForm.warehouseType === 'FEED' || warehouseForm.warehouseType === 'ANIMAL_FEED';
      const payload = {
        code: warehouseForm.code.trim().toUpperCase(),
        name: warehouseForm.name.trim(),
        warehouseType: warehouseForm.warehouseType,
        zoneId: isFeedType && warehouseForm.zoneId ? Number(warehouseForm.zoneId) : null,
        capacityM3: Number(warehouseForm.capacityM3) || 500,
        floorAreaM2: Number(warehouseForm.floorAreaM2) || 200,
      };

      if (isEditingWarehouse && warehouseForm.id) {
        await masterDataService.updateWarehouse(activeFarmId, warehouseForm.id, payload);
        toast.success(`Đã cập nhật kho "${payload.name}" thành công!`);
      } else {
        await masterDataService.createWarehouse(activeFarmId, payload);
        toast.success(`Đã tạo kho mới "${payload.name}" thành công!`);
      }

      // Reload real warehouses & sync Sidebar
      const effectiveBranchId = currentBranchId === 'ALL' ? undefined : (currentBranchId || 1);
      const whRes = await masterDataService.getWarehouses(activeFarmId, { branchId: effectiveBranchId });
      const latestWarehouses = Array.isArray(whRes) ? whRes : warehouses;
      if (Array.isArray(whRes)) {
        setWarehouses(whRes);
      }
      useActiveBranchStore.getState().triggerRefresh?.();
      setIsEditingWarehouse(false);
      setWarehouseForm({
        id: null,
        code: generateNextWarehouseCode(latestWarehouses),
        name: '',
        warehouseType: 'FEED',
        zoneId: zones[0]?.id || '',
        locationDesc: '',
        capacityM3: 500,
        floorAreaM2: 200,
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu thông tin kho');
    }
  };

  const handleDeleteWarehouse = async (warehouseId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kho này? Lưu ý chỉ có thể xóa kho không còn hàng tồn.')) {
      return;
    }
    try {
      await masterDataService.deleteWarehouse(activeFarmId, warehouseId);
      toast.success('Đã xóa kho thành công!');
      const effectiveBranchId = currentBranchId === 'ALL' ? undefined : (currentBranchId || 1);
      const whRes = await masterDataService.getWarehouses(activeFarmId, { branchId: effectiveBranchId });
      if (Array.isArray(whRes)) {
        setWarehouses(whRes);
      }
      useActiveBranchStore.getState().triggerRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể xóa kho còn tồn hàng');
    }
  };

  // Tạo Đơn Nhập Hàng Mới
  const handleOpenReceiptModal = () => {
    if (currentBranchId === 'ALL') {
      toast.warning('Vui lòng chọn một chi nhánh cụ thể trên Header trước khi tạo đơn nhập hàng!');
      return;
    }
    const defaultWhId = selectedWarehouseId !== 'ALL' ? selectedWarehouseId : (warehouses[0]?.id || 1);
    setReceiptForm({
      warehouseId: String(defaultWhId),
      materialId: inventoryList[0]?.id || '',
      supplierName: 'Công ty Cổ phần Chăn nuôi C.P. Việt Nam',
      invoiceNumber: `HĐ-CP-${Date.now().toString().slice(-4)}`,
      batchNumber: `LOT-${Date.now().toString().slice(-4)}`,
      expiryDate: '2027-06-30',
      quantityPack: 50,
      unitPrice: inventoryList[0]?.costPricePerPack || 350000,
      notes: 'Nhập bổ sung theo kế hoạch tuần',
    });
    setIsCreateReceiptModalOpen(true);
  };

  const handleSaveReceipt = (e) => {
    e.preventDefault();
    const targetWhId = Number(receiptForm.warehouseId || (selectedWarehouseId !== 'ALL' ? selectedWarehouseId : warehouses[0]?.id));
    const targetWh = warehouses.find((w) => w.id === targetWhId);

    const qty = Number(receiptForm.quantityPack) || 1;
    const price = Number(receiptForm.unitPrice) || 0;
    const total = qty * price;
    const batchNo = receiptForm.batchNumber.trim() || `LOT-${Date.now().toString().slice(-4)}`;

    const targetItem = inventoryList.find((i) => i.id === Number(receiptForm.materialId)) || inventoryList[0];

    const updatedItem = {
      ...targetItem,
      warehouseId: targetWhId,
      warehouseName: targetWh ? targetWh.name : targetItem.warehouseName,
      stockPack: targetItem.stockPack + qty,
      stockBase: targetItem.stockBase + (qty * (targetItem.conversionRatio || 1)),
      totalValue: (targetItem.stockPack + qty) * (targetItem.costPricePerPack || price),
      lots: [
        {
          id: Date.now(),
          lotCode: batchNo,
          importDate: new Date().toISOString().split('T')[0],
          expiryDate: receiptForm.expiryDate || '2027-06-30',
          stockPack: qty,
          stockBase: qty * (targetItem.conversionRatio || 1),
          isPriority: false,
        },
        ...targetItem.lots,
      ],
      stockCardHistory: [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          type: 'IN_PURCHASE',
          title: `Nhập kho từ NCC: ${receiptForm.supplierName || 'C.P. Việt Nam'}`,
          qtyPack: +qty,
          qtyBase: +(qty * (targetItem.conversionRatio || 1)),
          balancePack: targetItem.stockPack + qty,
          ref: receiptForm.invoiceNumber || `PO-${Date.now().toString().slice(-4)}`,
          user: userInfo?.fullName || 'Lê Kế Toán Kho',
        },
        ...targetItem.stockCardHistory,
      ],
    };

    setInventoryList((prev) => prev.map((i) => (i.id === targetItem.id ? updatedItem : i)));
    setIsCreateReceiptModalOpen(false);
    toast.success(`Đã tạo đơn nhập hàng ${qty} ${targetItem.packUnit} (${formatCurrency(total)}) vào "${targetWh?.name || 'Kho'}" thành công!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* THÔNG BÁO CHẾ ĐỘ XEM TỔNG HỢP TOÀN CHUỖI */}
      {currentBranchId === 'ALL' && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs shadow-2xs">
          <Info className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Chế độ xem Tổng hợp:</strong> Đang hiển thị toàn bộ kho bãi và tồn kho của mọi chi nhánh. Vui lòng chọn một chi nhánh cụ thể trên thanh Header để thực hiện tác vụ nhập hàng hoặc thêm kho mới.
          </span>
        </div>
      )}

      {/* 1. HEADER CHÍNH */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <Boxes className="h-4 w-4" />
            <span>Quản Lý Vật Tư, Cám & Dược Thú Y</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Kho Hàng Hóa & Tồn Kho</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {inventoryList.length} mặt hàng
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Tách riêng Kho Cám theo từng Khu nuôi & các kho chuyên môn dùng chung toàn chi nhánh. Kiểm soát hạn dùng theo từng lô (FEFO) và tự động trừ kho từ nhật ký chuồng trại.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />}
            onClick={handleExportStock}
            className="text-xs font-bold border-slate-300"
          >
            Xuất Excel
          </Button>

          {canCreateItem && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => {
                if (currentBranchId === 'ALL') {
                  toast.warning('Bạn đang ở chế độ xem Tổng hợp toàn chuỗi. Vui lòng chọn một chi nhánh cụ thể trên Header để khai báo hàng hóa mới!');
                  return;
                }
                setCreateForm({
                  sku: '',
                  name: '',
                  category: 'FEED',
                  warehouseId: warehouses[0]?.id || 1,
                  packUnit: 'Bao',
                  baseUnit: 'Kg',
                  conversionRatio: 25,
                  minThresholdPack: 10,
                  costPricePerPack: 350000,
                  withdrawalDays: 0,
                });
                setIsCreateModalOpen(true);
              }}
              className="text-xs font-bold"
            >
              Khai báo Hàng hóa mới
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* THANH CÔNG CỤ DANH MỤC NHANH (QUICK CATEGORY TOOLBAR)                      */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Sliders className="h-3.5 w-3.5 text-emerald-600" />
            Danh mục nhanh:
          </span>
          <button
            type="button"
            onClick={handleOpenWarehouseModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs transition-all cursor-pointer"
          >
            <Building2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Quản lý Danh mục Kho</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded-full font-bold">
              {warehouses.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-blue-700 hover:border-blue-300 shadow-2xs transition-all cursor-pointer"
          >
            <Boxes className="h-3.5 w-3.5 text-blue-600" />
            <span>Nhóm hàng hóa</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded-full font-bold">5 nhóm</span>
          </button>
          <button
            type="button"
            onClick={() => setIsUnitsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-purple-700 hover:border-purple-300 shadow-2xs transition-all cursor-pointer"
          >
            <Scale className="h-3.5 w-3.5 text-purple-600" />
            <span>Đơn vị tính</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-purple-50 text-purple-700 rounded-full font-bold">Quy đổi</span>
          </button>
        </div>

        {selectedWarehouseId !== 'ALL' && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
            <span>Đang xem kho:</span>
            <strong className="font-bold underline">
              {warehouses.find((w) => w.id === Number(selectedWarehouseId))?.name || `Kho #${selectedWarehouseId}`}
            </strong>
            <button
              type="button"
              onClick={() => handleSelectWarehouse('ALL')}
              className="ml-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-0.5 cursor-pointer shadow-2xs"
            >
              Xem tất cả kho
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. KHỐI THỐNG KÊ NHANH & CẢNH BÁO TỒN KHO (TOP 4 KPI CARDS)                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Tổng mặt hàng */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">Tổng Mặt Hàng Quản Lý</span>
            <Package className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {kpiStats.totalItems}
            </span>
            <span className="text-xs text-slate-400">mã SKU</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex justify-between">
            <span>Phân bổ trên:</span>
            <strong className="text-slate-800">{kpiStats.activeWarehouseCount} kho lưu trữ</strong>
          </div>
        </div>

        {/* Thẻ 2: Tổng giá trị tồn kho (CHỈ HIỂN THỊ NẾU CÓ QUYỀN VIEW COST) */}
        {canViewCost ? (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-bold">Tổng Giá Trị Tồn Kho</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700 font-mono">
                {formatNumber(kpiStats.totalValue)}
              </span>
              <span className="text-xs text-slate-400">VNĐ</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex justify-between">
              <span>Định giá vốn:</span>
              <strong className="text-emerald-800">Bình quân gia quyền</strong>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-bold">Số Kho Đang Hoạt Động</span>
              <Building className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-700 font-mono">
                {kpiStats.activeWarehouseCount}
              </span>
              <span className="text-xs text-slate-400">kho vận hành</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex justify-between">
              <span>Trạng thái:</span>
              <strong className="text-blue-800">Kho mở bình thường</strong>
            </div>
          </div>
        )}

        {/* Thẻ 3: Cảnh báo hàng sắp hết (MÀU CAM - CLICK ĐỂ LỌC) */}
        <div
          onClick={() => setSelectedStatus(selectedStatus === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs space-y-1.5 ${
            selectedStatus === 'LOW_STOCK'
              ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/30'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
          title="Bấm vào để lọc danh sách hàng sắp hết"
        >
          <div className="flex items-center justify-between text-amber-700 text-xs">
            <span className="font-bold flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-amber-600" />
              <span>Sắp Hết Tồn Tối Thiểu</span>
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">Lọc</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 font-mono">
              {kpiStats.lowStockCount}
            </span>
            <span className="text-xs text-slate-500">mặt hàng cần đặt</span>
          </div>
          <div className="text-[11px] text-amber-800 pt-1 border-t border-amber-100 flex justify-between font-medium">
            <span>Dưới định mức an toàn</span>
            <strong>Cần nhập thêm</strong>
          </div>
        </div>

        {/* Thẻ 4: Cảnh báo cận hạn sử dụng < 30 ngày (MÀU ĐỎ - CLICK ĐỂ LỌC) */}
        <div
          onClick={() => setSelectedStatus(selectedStatus === 'NEAR_EXPIRY' ? 'ALL' : 'NEAR_EXPIRY')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs space-y-1.5 ${
            selectedStatus === 'NEAR_EXPIRY'
              ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-500/30'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
          title="Bấm vào để lọc danh sách thuốc/vắc-xin cận hạn dùng"
        >
          <div className="flex items-center justify-between text-rose-700 text-xs">
            <span className="font-bold flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-rose-600" />
              <span>Cận Hạn Sử Dụng (&lt; 30 ngày)</span>
            </span>
            <span className="text-[10px] bg-rose-100 text-rose-900 px-1.5 py-0.2 rounded font-bold">Lọc</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700 font-mono">
              {kpiStats.nearExpiryCount}
            </span>
            <span className="text-xs text-slate-500">lô thuốc/vắc-xin</span>
          </div>
          <div className="text-[11px] text-rose-800 pt-1 border-t border-rose-100 flex justify-between font-medium">
            <span>Ưu tiên xuất trước</span>
            <strong className="text-rose-700">Nguyên tắc FEFO</strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THANH LỌC ĐA CHIỀU & TÁC VỤ NHANH (FILTER TOOLBAR)                      */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Tìm kiếm */}
        <div className="relative w-full lg:w-72">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hàng, mã SKU..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
          />
        </div>

        {/* Các Dropdown lọc */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc Kho */}
          <select
            value={selectedWarehouseId}
            onChange={(e) => handleSelectWarehouse(e.target.value)}
            className="text-xs font-semibold rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">Tất Cả Kho Lưu Trữ</option>
            {warehouses.map((w) => (
              <option key={w.id} value={String(w.id)}>
                {w.name}
              </option>
            ))}
          </select>

          {/* Lọc Nhóm hàng */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-semibold rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">Tất Cả Nhóm Hàng</option>
            <option value="FEED">Thức ăn hỗn hợp</option>
            <option value="VACCINE">Vắc-xin</option>
            <option value="MEDICINE">Thuốc thú y</option>
            <option value="SUPPLIES">Sát trùng & Dụng cụ</option>
          </select>

          {/* Lọc Trạng thái tồn */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-semibold rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">Tất Cả Trạng Thái</option>
            <option value="IN_STOCK">Còn hàng tồn</option>
            <option value="LOW_STOCK">Sắp hết (Dưới định mức)</option>
            <option value="NEAR_EXPIRY">Cận hạn dùng (&lt; 30 ngày)</option>
            <option value="OUT_OF_STOCK">Hết hàng (0 tồn)</option>
          </select>

          {(selectedWarehouseId !== 'ALL' || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || searchKeyword) && (
            <button
              type="button"
              onClick={() => {
                setSelectedWarehouseId('ALL');
                setSelectedCategory('ALL');
                setSelectedStatus('ALL');
                setSearchKeyword('');
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 underline px-1"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BẢNG DANH SÁCH TỒN KHO THÔNG MINH (INVENTORY DATA TABLE)                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-700 tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ảnh / Icon Nhóm Hàng & Hàng Hóa</th>
                <th className="py-3 px-3">Kho Lưu Trữ</th>
                <th className="py-3 px-4 text-right">Tồn Kho Đa Đơn Vị</th>
                <th className="py-3 px-4 text-center">Định Mức Tối Thiểu</th>
                {canViewCost && <th className="py-3 px-4 text-right">Đơn Giá Vốn</th>}
                {canViewCost && <th className="py-3 px-4 text-right">Tổng Giá Trị Tồn</th>}
                <th className="py-3 px-3 text-center">Hạn Sử Dụng (FEFO)</th>
                <th className="py-3 px-3 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={canViewCost ? 8 : 6} className="py-12 text-center text-slate-400 text-xs">
                    Không tìm thấy hàng hóa phù hợp với tiêu chí lọc
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLowStock = item.stockPack <= item.minThresholdPack;
                  const isNearExpiry = item.daysUntilExpiry <= 30;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleOpenDrawer(item)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Cột 1: Ảnh / Icon Nhóm Hàng & Tên hàng */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                              item.category === 'FEED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.category === 'VACCINE'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : item.category === 'MEDICINE'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {item.category === 'FEED' ? (
                              <Package className="h-4.5 w-4.5" />
                            ) : item.category === 'VACCINE' ? (
                              <Syringe className="h-4.5 w-4.5" />
                            ) : item.category === 'MEDICINE' ? (
                              <Pill className="h-4.5 w-4.5" />
                            ) : (
                              <ShieldCheck className="h-4.5 w-4.5" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                {item.sku}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  item.category === 'FEED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.category === 'VACCINE'
                                    ? 'bg-amber-100 text-amber-800'
                                    : item.category === 'MEDICINE'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {item.categoryName}
                              </span>
                              {item.withdrawalDays > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                  Ngưng: {item.withdrawalDays} ngày
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {item.name}
                            </h4>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Kho lưu trữ */}
                      <td className="py-3 px-3 font-semibold text-slate-700 text-xs">
                        {item.warehouseName}
                      </td>

                      {/* Cột 3: Tồn thực tế (Đa đơn vị) */}
                      <td className="py-3 px-4 text-right">
                        <div className="space-y-0.5">
                          <span
                            className={`text-sm font-black font-mono block ${
                              isLowStock ? 'text-amber-700' : 'text-slate-900'
                            }`}
                          >
                            {item.packUnit?.toLowerCase() !== item.baseUnit?.toLowerCase() || (item.conversionRatio || 1) > 1
                              ? `${formatNumber(item.stockPack)} ${item.packUnit} (${formatNumber(item.stockBase)} ${item.baseUnit})`
                              : `${formatNumber(item.stockPack)} ${item.packUnit}`}
                          </span>
                          {(item.packUnit?.toLowerCase() !== item.baseUnit?.toLowerCase() || (item.conversionRatio || 1) > 1) && (
                            <span className="text-[11px] text-slate-400 font-mono block">
                              (1 {item.packUnit} = {item.conversionRatio || 1} {item.baseUnit})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột 4: Định mức an toàn tối thiểu */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="font-mono text-xs font-bold text-slate-700">
                            {item.minThresholdPack} {item.packUnit}
                          </span>
                          {/* Thanh mức an toàn mini */}
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isLowStock
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{
                                width: `${Math.min(100, Math.round((item.stockPack / (item.minThresholdPack * 2 || 1)) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Cột 5: Giá vốn (Chỉ hiển thị nếu có quyền view cost) */}
                      {canViewCost && (
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                          {formatNumber(item.costPricePerPack)} đ / {item.packUnit}
                        </td>
                      )}

                      {/* Cột 6: Tổng giá trị tồn */}
                      {canViewCost && (
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                          {formatNumber(item.totalValue)} đ
                        </td>
                      )}

                      {/* Cột 7: Hạn sử dụng (FEFO) */}
                      <td className="py-3 px-3 text-center">
                        {isNearExpiry ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono text-xs font-black text-rose-600">
                              {formatDate(item.nearestExpiryDate)}
                            </span>
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              {item.daysUntilExpiry < 0
                                ? `⚠️ Đã quá hạn ${Math.abs(item.daysUntilExpiry)} ngày`
                                : `⚠️ Còn ${item.daysUntilExpiry} ngày`}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-slate-600">
                            {formatDate(item.nearestExpiryDate)}
                          </span>
                        )}
                      </td>

                      {/* Cột 8: Thao tác */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(item)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors"
                        >
                          Chi Tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. NGĂN KÉO CHI TIẾT MẶT HÀNG (SLIDE OVER DRAWER - 3 TABS)                 */}
      {/* ========================================================================= */}
      <SlideOverDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedItemForDrawer?.name || 'Chi Tiết Mặt Hàng'}
        subtitle={`Mã SKU: ${selectedItemForDrawer?.sku || ''} — Kho: ${selectedItemForDrawer?.warehouseName || ''}`}
        icon={<Boxes className="h-5 w-5 text-emerald-600" />}
        width="max-w-2xl"
      >
        {selectedItemForDrawer && (
          <div className="space-y-5 pb-8">
            {/* 3 Tab nhỏ bên trong Drawer */}
            <div className="flex border-b border-slate-200 text-xs gap-2">
              <button
                type="button"
                onClick={() => setDrawerActiveTab('LOTS')}
                className={`py-2 px-3 font-bold border-b-2 transition-all ${
                  drawerActiveTab === 'LOTS'
                    ? 'border-emerald-600 text-emerald-700 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Tồn Kho Theo Lô ({selectedItemForDrawer.lots.length})
              </button>

              <button
                type="button"
                onClick={() => setDrawerActiveTab('STOCK_CARD')}
                className={`py-2 px-3 font-bold border-b-2 transition-all ${
                  drawerActiveTab === 'STOCK_CARD'
                    ? 'border-emerald-600 text-emerald-700 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Thẻ Kho & Biến Động ({selectedItemForDrawer.stockCardHistory.length})
              </button>

              <button
                type="button"
                onClick={() => setDrawerActiveTab('CONVERSION_CONFIG')}
                className={`py-2 px-3 font-bold border-b-2 transition-all ${
                  drawerActiveTab === 'CONVERSION_CONFIG'
                    ? 'border-emerald-600 text-emerald-700 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Quy Đổi & Định Mức
              </button>
            </div>

            {/* TAB 1: TỒN KHO THEO LÔ & HẠN DÙNG (FEFO) */}
            {drawerActiveTab === 'LOTS' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span>Quy tắc xuất kho: <strong>Hết hạn trước xuất trước (FEFO)</strong></span>
                  <span className="font-mono font-bold text-slate-900">
                    Tổng tồn: {formatNumber(selectedItemForDrawer.stockPack)} {selectedItemForDrawer.packUnit}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Mã Lô NSX</th>
                        <th className="py-2.5 px-3">Ngày Nhập</th>
                        <th className="py-2.5 px-3">Hạn Sử Dụng</th>
                        <th className="py-2.5 px-3 text-right">Tồn Lô Đó</th>
                        <th className="py-2.5 px-3 text-center">Ưu Tiên</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedItemForDrawer.lots.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            Chưa có dữ liệu lô chi tiết
                          </td>
                        </tr>
                      ) : (
                        selectedItemForDrawer.lots.map((lot) => (
                          <tr key={lot.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {lot.lotCode}
                            </td>
                            <td className="py-2.5 px-3">{formatDate(lot.importDate)}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                              {formatDate(lot.expiryDate)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                              {lot.stockPack} {selectedItemForDrawer.packUnit}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {lot.isPriority ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Xuất trước
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">Lô sau</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: THẺ KHO (LỊCH SỬ BIẾN ĐỘNG) */}
            {drawerActiveTab === 'STOCK_CARD' && (
              <div className="space-y-4">
                <div className="text-xs text-slate-500">
                  Lịch sử truy vết mọi giao dịch nhập xuất kho của mặt hàng này
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Thời Gian</th>
                        <th className="py-2.5 px-3">Nội Dung Giao Dịch</th>
                        <th className="py-2.5 px-3 text-right">Biến Động</th>
                        <th className="py-2.5 px-3 text-right">Tồn Sau</th>
                        <th className="py-2.5 px-3">Người Tạo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedItemForDrawer.stockCardHistory.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{h.time}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-800 block">{h.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{h.ref}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            <span className={h.qtyPack > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                              {h.qtyPack > 0 ? `+${h.qtyPack}` : h.qtyPack} {selectedItemForDrawer.packUnit}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                            {h.balancePack}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">{h.user}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: CẤU HÌNH QUY ĐỔI & ĐỊNH MỨC TỒN */}
            {drawerActiveTab === 'CONVERSION_CONFIG' && (
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <h4 className="font-black text-slate-900 uppercase">Cấu Hình Quy Cách Đơn Vị Tính</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block">Đơn vị quy cách:</span>
                    <strong className="text-slate-900 font-mono text-sm">{selectedItemForDrawer.packUnit}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Đơn vị tính gốc:</span>
                    <strong className="text-slate-900 font-mono text-sm">{selectedItemForDrawer.baseUnit}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hệ số quy đổi:</span>
                    <strong className="text-emerald-700 font-mono text-sm">
                      1 {selectedItemForDrawer.packUnit} = {selectedItemForDrawer.conversionRatio} {selectedItemForDrawer.baseUnit}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Định mức an toàn tối thiểu:</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      {selectedItemForDrawer.minThresholdPack} {selectedItemForDrawer.packUnit}
                    </strong>
                  </div>
                </div>

                {selectedItemForDrawer.withdrawalDays > 0 && (
                  <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-900 space-y-1">
                    <strong className="block font-bold">Thời gian ngưng thuốc trước xuất bán:</strong>
                    <p className="text-[11px]">
                      Phải ngừng sử dụng thuốc này tối thiểu <strong>{selectedItemForDrawer.withdrawalDays} ngày</strong> trước ngày xuất bán thịt để bảo đảm an toàn thực phẩm.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </SlideOverDrawer>

      {/* ========================================================================= */}
      {/* 5. MODAL: + THÊM HÀNG HÓA MỚI                                             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Khai Báo Hàng Hóa Mới"
        subtitle="Khai báo danh mục sản phẩm, quy cách đơn vị nhập/sử dụng và định mức tối thiểu (tồn kho ban đầu = 0)"
        icon={<Plus className="h-5 w-5 text-emerald-600" />}
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Mã SKU (để trống tự sinh)">
              <Input
                placeholder="VD: CAM-GA-03, VAC-CUM..."
                value={createForm.sku}
                onChange={(e) => setCreateForm({ ...createForm, sku: e.target.value })}
              />
            </FormField>

            <FormField label="Nhóm hàng" required>
              <Select
                value={createForm.category}
                onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                options={[
                  { value: 'FEED', label: '🌾 Thức ăn hỗn hợp' },
                  { value: 'VACCINE', label: '💉 Vắc-xin phòng bệnh' },
                  { value: 'MEDICINE', label: '💊 Thuốc thú y' },
                  { value: 'SUPPLIES', label: '📦 Sát trùng & Dụng cụ' },
                ]}
              />
            </FormField>
          </div>

          <FormField label="Tên hàng hóa / vật tư" required>
            <Input
              placeholder="VD: Cám Gà Vỗ Béo Đạm 19%, Thuốc Kháng Sinh Amox..."
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            />
          </FormField>

          <FormField label="Kho lưu trữ mặc định" required>
            <Select
              value={createForm.warehouseId}
              onChange={(e) => setCreateForm({ ...createForm, warehouseId: e.target.value })}
              options={warehouses.map((w) => ({ value: String(w.id), label: `${w.name} (${w.location})` }))}
            />
          </FormField>

          {/* Quy cách đơn vị tính */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-black text-slate-800 uppercase block">Quy Cách & Tỷ Lệ Quy Đổi</span>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Đơn vị nhập / đóng gói" required hint="VD: Bao, Chai, Lọ">
                <Input
                  placeholder="Bao, Chai, Lọ..."
                  value={createForm.packUnit}
                  onChange={(e) => setCreateForm({ ...createForm, packUnit: e.target.value })}
                />
              </FormField>

              <FormField label="Hệ số quy đổi" required hint="1 ĐV nhập = ? ĐV gốc">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={createForm.conversionRatio}
                  onChange={(e) => setCreateForm({ ...createForm, conversionRatio: e.target.value })}
                />
              </FormField>

              <FormField label="Đơn vị sử dụng gốc" required hint="VD: Kg, Ml, Liều">
                <Input
                  placeholder="Kg, Ml, Liều..."
                  value={createForm.baseUnit}
                  onChange={(e) => setCreateForm({ ...createForm, baseUnit: e.target.value })}
                />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Định mức tồn tối thiểu" required hint="Dưới ngưỡng này sẽ báo cam">
              <Input
                type="number"
                value={createForm.minThresholdPack}
                onChange={(e) => setCreateForm({ ...createForm, minThresholdPack: e.target.value })}
              />
            </FormField>

            <FormField label="Đơn giá vốn ước tính (đ)">
              <Input
                type="number"
                value={createForm.costPricePerPack}
                onChange={(e) => setCreateForm({ ...createForm, costPricePerPack: e.target.value })}
              />
            </FormField>
          </div>

          {(createForm.category === 'MEDICINE' || createForm.category === 'VACCINE') && (
            <FormField label="Thời gian ngưng thuốc trước xuất bán (ngày)" hint="Số ngày tối thiểu phải dừng thuốc trước khi giết thịt">
              <Input
                type="number"
                value={createForm.withdrawalDays}
                onChange={(e) => setCreateForm({ ...createForm, withdrawalDays: e.target.value })}
              />
            </FormField>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Lưu Hàng Hóa Mới
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 1: QUẢN LÝ DANH MỤC KHO & PHÂN TÁCH KHO CÁM THEO KHU NUÔI           */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isWarehouseModalOpen}
        onClose={() => {
          setIsWarehouseModalOpen(false);
          setIsEditingWarehouse(false);
        }}
        title="Quản Lý Danh Mục Kho Bãi & Gắn Kho Cám Theo Khu Nuôi"
        subtitle="Mỗi Khu nuôi gắn với một Kho Cám riêng biệt. Kho Thuốc/Vắc-xin dùng chung toàn chi nhánh."
        icon={<Building2 className="h-5 w-5 text-emerald-600" />}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6">
          {/* Hướng dẫn nghiệp vụ */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2.5">
            <Info className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Quy tắc phân tách Kho Cám & Kho Dùng Chung (FarmGo Standard):</p>
              <ul className="list-disc list-inside space-y-0.5 text-emerald-800">
                <li><strong>Kho Cám theo Khu nuôi:</strong> Mỗi phân khu nuôi (Khu A, Khu B...) cần được gắn với 1 kho cám tương ứng để khi công nhân chuồng ghi nhật ký cho ăn, hệ thống tự động trừ kho cám của đúng khu đó.</li>
                <li><strong>Kho chuyên môn dùng chung:</strong> Kho Thuốc thú y, Vắc-xin, Hóa chất sát trùng phục vụ toàn bộ các khu trong chi nhánh.</li>
              </ul>
            </div>
          </div>

          {/* Form thêm/sửa kho */}
          <form onSubmit={handleSaveWarehouse} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Edit2 className="h-3.5 w-3.5 text-emerald-600" />
                {isEditingWarehouse ? `Chỉnh sửa kho: ${warehouseForm.name}` : '+ Thêm Kho Lưu Trữ Mới'}
              </span>
              {isEditingWarehouse && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingWarehouse(false);
                    setWarehouseForm({
                      id: null,
                      code: generateNextWarehouseCode(warehouses),
                      name: '',
                      warehouseType: 'FEED',
                      zoneId: zones[0]?.id || '',
                      locationDesc: '',
                      capacityM3: 500,
                      floorAreaM2: 200,
                    });
                  }}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  Hủy sửa / Tạo mới
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-4">
                <FormField label="Mã kho" required>
                  <Input
                    placeholder="KHO-001"
                    value={warehouseForm.code}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })}
                    disabled={isEditingWarehouse}
                    className="font-mono font-semibold"
                  />
                </FormField>
              </div>

              <div className="sm:col-span-8">
                <FormField label="Tên kho lưu trữ" required>
                  <Input
                    placeholder="VD: Kho Cám Khu A (Gà thịt)..."
                    value={warehouseForm.name}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                  />
                </FormField>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
              <div className={(warehouseForm.warehouseType === 'FEED' || warehouseForm.warehouseType === 'ANIMAL_FEED') ? '' : 'sm:col-span-2'}>
                <FormField label="Loại kho chuyên môn" required>
                  <Select
                    value={warehouseForm.warehouseType}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      const isFeed = nextType === 'FEED' || nextType === 'ANIMAL_FEED';
                      setWarehouseForm({
                        ...warehouseForm,
                        warehouseType: nextType,
                        zoneId: isFeed ? (warehouseForm.zoneId || zones[0]?.id || '') : '',
                      });
                    }}
                    options={[
                      { value: 'FEED', label: 'Kho Cám & Thức ăn (Gắn theo Khu)' },
                      { value: 'MEDICINE', label: 'Kho Thuốc thú y (Dùng chung)' },
                      { value: 'VACCINE', label: 'Kho Vắc-xin tủ lạnh (Dùng chung)' },
                      { value: 'CHEMICAL', label: 'Kho Hóa chất & Sát trùng' },
                      { value: 'SUPPLIES', label: 'Kho Vật tư & Trang thiết bị' },
                      { value: 'GENERAL', label: 'Kho Tổng hợp' },
                    ]}
                  />
                </FormField>
              </div>

              {(warehouseForm.warehouseType === 'FEED' || warehouseForm.warehouseType === 'ANIMAL_FEED') && (
                <div>
                  <FormField label="Gắn với Khu nuôi (Zone)" hint="Chỉ áp dụng cho Kho Cám theo khu">
                    <Select
                      value={warehouseForm.zoneId || ''}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, zoneId: e.target.value })}
                      options={[
                        { value: '', label: '-- Dùng chung chi nhánh (Không gắn khu) --' },
                        ...zones.map((z) => ({ value: String(z.id), label: `${z.name} (${z.code})` })),
                      ]}
                    />
                  </FormField>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="primary" size="sm" type="submit" className="w-full sm:w-auto px-6 text-xs font-bold py-2">
                {isEditingWarehouse ? 'Cập Nhật Kho' : '+ Thêm Kho Mới'}
              </Button>
            </div>
          </form>

          {/* Bảng danh sách kho hiện tại */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-700 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Mã Kho</th>
                  <th className="py-2.5 px-3">Tên Kho</th>
                  <th className="py-2.5 px-3">Loại Kho</th>
                  <th className="py-2.5 px-3">Khu Nuôi Gắn Kết</th>
                  <th className="py-2.5 px-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {warehouses.map((wh) => (
                  <tr key={wh.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{wh.code}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{wh.name}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        wh.warehouseType === 'FEED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : wh.warehouseType === 'VACCINE'
                          ? 'bg-amber-100 text-amber-800'
                          : wh.warehouseType === 'MEDICINE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {wh.warehouseType || 'FEED'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {wh.zoneName || wh.zoneId ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {wh.zoneName || `Khu #${wh.zoneId}`}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Dùng chung</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditWarehouseClick(wh)}
                          className="px-2 py-0.5 text-[11px] font-bold text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWarehouse(wh.id)}
                          className="px-2 py-0.5 text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: NHÓM HÀNG HÓA VẬT TƯ (MATERIAL CATEGORIES)                        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Danh Mục Nhóm Hàng Hóa FarmGo"
        subtitle="5 phân nhóm vật tư chuẩn hóa giúp kiểm soát xuất nhập tồn và định mức tiêu hao chính xác"
        icon={<Boxes className="h-5 w-5 text-blue-600" />}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Nhóm 1: Thức ăn chăn nuôi */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Thức Ăn Chăn Nuôi (FEED)</h4>
                    <span className="text-[10px] text-emerald-700 font-bold">Tách kho theo từng Khu</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-emerald-200 text-emerald-800">
                  {inventoryList.filter((i) => i.category === 'FEED').length} mặt hàng
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Cám viên hỗn hợp, cám đậm đặc, bột bắp, cám tập ăn. Tự động trừ kho theo định mức khẩu phần khi công nhân ghi nhật ký cho ăn hàng ngày.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('FEED');
                  setIsCategoryModalOpen(false);
                }}
                className="text-[11px] font-bold text-emerald-700 hover:underline pt-1 inline-block"
              >
                → Lọc xem mặt hàng nhóm Cám
              </button>
            </div>

            {/* Nhóm 2: Thuốc thú y */}
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <Pill className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Thuốc Thú Y (MEDICINE)</h4>
                    <span className="text-[10px] text-blue-700 font-bold">Dùng chung toàn trại</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-blue-200 text-blue-800">
                  {inventoryList.filter((i) => i.category === 'MEDICINE').length} mặt hàng
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Kháng sinh điều trị, men tiêu hóa, vitamin bổ sung, hạ sốt, chất điện giải. Theo dõi thời gian ngưng thuốc trước xuất bán (Withdrawal Days).
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('MEDICINE');
                  setIsCategoryModalOpen(false);
                }}
                className="text-[11px] font-bold text-blue-700 hover:underline pt-1 inline-block"
              >
                → Lọc xem mặt hàng nhóm Thuốc
              </button>
            </div>

            {/* Nhóm 3: Vắc-xin */}
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Syringe className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Vắc-xin Thú Y (VACCINE)</h4>
                    <span className="text-[10px] text-amber-700 font-bold">Bảo quản lạnh 2-8°C</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-amber-200 text-amber-800">
                  {inventoryList.filter((i) => i.category === 'VACCINE').length} mặt hàng
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Vắc-xin phòng bệnh theo lịch quy trình. Giám sát nghiêm ngặt số lô, hạn dùng và cảnh báo cận hạn theo nguyên tắc FEFO.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('VACCINE');
                  setIsCategoryModalOpen(false);
                }}
                className="text-[11px] font-bold text-amber-700 hover:underline pt-1 inline-block"
              >
                → Lọc xem mặt hàng nhóm Vắc-xin
              </button>
            </div>

            {/* Nhóm 4: Hóa chất & Sát trùng */}
            <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Sát Trùng & Hóa Chất (CHEMICAL)</h4>
                    <span className="text-[10px] text-purple-700 font-bold">An toàn sinh học</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-purple-200 text-purple-800">
                  {inventoryList.filter((i) => i.category === 'SUPPLIES' || i.category === 'CHEMICAL').length} mặt hàng
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Thuốc khử trùng chuồng trại, vôi bột, men rải chuồng, hóa chất xử lý nước giếng và bồn sát trùng phương tiện vận chuyển.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('SUPPLIES');
                  setIsCategoryModalOpen(false);
                }}
                className="text-[11px] font-bold text-purple-700 hover:underline pt-1 inline-block"
              >
                → Lọc xem mặt hàng nhóm Sát trùng
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: QUẢN LÝ ĐƠN VỊ TÍNH & HỆ SỐ QUY ĐỔI ĐA ĐƠN VỊ                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isUnitsModalOpen}
        onClose={() => setIsUnitsModalOpen(false)}
        title="Đơn Vị Tính & Hệ Số Quy Đổi Đa Đơn Vị (Multi-unit)"
        subtitle="Cho phép nhập mua theo Bao/Thùng/Lọ nhưng xuất kho & cho ăn chi tiết đến Kg/Gram/Liều"
        icon={<Scale className="h-5 w-5 text-purple-600" />}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900">
            <strong>Nguyên tắc Đa đơn vị tính:</strong> Hệ thống tự động quy đổi giữa Đơn vị đóng gói (Pack Unit) và Đơn vị gốc chuẩn (Base Unit) để tránh sai lệch hao hụt khi ghi nhận cho ăn thực tế.
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Nhóm Vật Tư</th>
                  <th className="py-2.5 px-3">Đơn Vị Đóng Gói (Pack)</th>
                  <th className="py-2.5 px-3">Đơn Vị Gốc (Base)</th>
                  <th className="py-2.5 px-3">Tỷ Lệ Quy Đổi Chuẩn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-emerald-800">Cám & Thức ăn</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">Bao</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">Kg</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">1 Bao = 25 Kg (hoặc 40 Kg)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-amber-800">Vắc-xin</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">Lọ / Chai</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">Liều</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">1 Lọ = 1.000 Liều (hoặc 500 Liều)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-blue-800">Thuốc bột / Kháng sinh</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">Gói</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">Gram / Kg</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">1 Gói = 100 Gram (hoặc 1 Kg)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-purple-800">Thuốc nước / Sát trùng</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">Chai / Can</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">Ml / Lít</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">1 Chai = 1.000 Ml; 1 Can = 5 Lít</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: TẠO ĐƠN NHẬP HÀNG MỚI (WAREHOUSE RECEIPT)                         */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateReceiptModalOpen}
        onClose={() => setIsCreateReceiptModalOpen(false)}
        title="Tạo Đơn Nhập Hàng Mới (Nhập Kho)"
        subtitle="Ghi nhận nhập hàng vào kho lưu trữ, tự động cộng tồn kho và cấp mã số lô FEFO"
        icon={<Receipt className="h-5 w-5 text-blue-600" />}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveReceipt} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kho nhập hàng" required>
              <Select
                value={receiptForm.warehouseId}
                onChange={(e) => setReceiptForm({ ...receiptForm, warehouseId: e.target.value })}
                options={warehouses.map((w) => ({ value: String(w.id), label: `${w.name} (${w.warehouseType || 'KHO'})` }))}
              />
            </FormField>

            <FormField label="Mã phiếu / Số hóa đơn" required>
              <Input
                placeholder="VD: HĐ-CP-2611, PO-001..."
                value={receiptForm.invoiceNumber}
                onChange={(e) => setReceiptForm({ ...receiptForm, invoiceNumber: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Mặt hàng cần nhập" required>
            <Select
              value={receiptForm.materialId}
              onChange={(e) => {
                const sel = inventoryList.find((i) => i.id === Number(e.target.value));
                setReceiptForm({
                  ...receiptForm,
                  materialId: e.target.value,
                  unitPrice: sel ? sel.costPricePerPack : receiptForm.unitPrice,
                });
              }}
              options={inventoryList.map((i) => ({ value: String(i.id), label: `[${i.sku}] ${i.name} (${i.packUnit})` }))}
            />
          </FormField>

          <FormField label="Nhà cung cấp / Đối tác" required>
            <Input
              placeholder="VD: Công ty C.P. Việt Nam, Dabaco, GreenVet..."
              value={receiptForm.supplierName}
              onChange={(e) => setReceiptForm({ ...receiptForm, supplierName: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Số lô sản xuất (Batch No.)" required hint="Quản lý FEFO">
              <Input
                placeholder="LOT-..."
                value={receiptForm.batchNumber}
                onChange={(e) => setReceiptForm({ ...receiptForm, batchNumber: e.target.value })}
              />
            </FormField>

            <FormField label="Hạn sử dụng (Expiry Date)" required>
              <Input
                type="date"
                value={receiptForm.expiryDate}
                onChange={(e) => setReceiptForm({ ...receiptForm, expiryDate: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <FormField label="Số lượng nhập" required>
              <Input
                type="number"
                min="1"
                value={receiptForm.quantityPack}
                onChange={(e) => setReceiptForm({ ...receiptForm, quantityPack: e.target.value })}
              />
            </FormField>

            <FormField label="Đơn giá nhập (VNĐ)" required>
              <Input
                type="number"
                step="1000"
                value={receiptForm.unitPrice}
                onChange={(e) => setReceiptForm({ ...receiptForm, unitPrice: e.target.value })}
              />
            </FormField>
          </div>

          {/* Thành tiền ước tính */}
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs">
            <span className="font-bold text-blue-900">Tổng giá trị đơn nhập:</span>
            <span className="font-mono font-black text-sm text-blue-900">
              {formatCurrency((Number(receiptForm.quantityPack) || 0) * (Number(receiptForm.unitPrice) || 0))}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateReceiptModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Xác Nhận Nhập Hàng
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default InventoryPage;
