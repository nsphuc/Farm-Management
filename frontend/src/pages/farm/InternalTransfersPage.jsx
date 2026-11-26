import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Filter,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Check,
  RotateCcw,
  ClipboardCheck,
  Building,
  Warehouse,
  Boxes,
  Trash2,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  Info,
  AlertTriangle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { inventoryService } from '@/services/modules/inventoryService';
import { masterDataService } from '@/services/modules/masterDataService';
import { barnBatchService } from '@/services/modules/barnBatchService';
import { toast } from '@/store/useToastStore';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';

// ================= DỮ LIỆU DANH MỤC MẪU CHUẨN THỰC TẾ FARMGO =================

export const MOCK_WAREHOUSES = [
  { id: 1, code: 'WH_FEED_A', name: 'Kho Cám Khu A (Gà)' },
  { id: 2, code: 'WH_FEED_B', name: 'Kho Cám Khu B (Heo)' },
  { id: 3, code: 'WH_MED', name: 'Kho Thuốc & Vắc-Xin' },
  { id: 4, code: 'WH_SUPPLY', name: 'Kho Vật Tư & Sát Trùng' },
];

export const MOCK_BARNS_AND_BATCHES = [
  { id: 1, barnName: 'Chuồng Gà A1', batchName: 'Lứa Gà Thịt T11 (3.000 con)', status: 'ACTIVE' },
  { id: 2, barnName: 'Chuồng Gà A2', batchName: 'Lứa Gà Thịt T10 (Chuẩn bị thả)', status: 'PREPARING' },
  { id: 3, barnName: 'Chuồng Heo B1', batchName: 'Lứa Heo Thịt H09 (120 con)', status: 'ACTIVE' },
  { id: 4, barnName: 'Chuồng Heo B2', batchName: 'Lứa Heo Thịt H08 (Đã xuất chuồng)', status: 'CLOSED' },
];

export const MOCK_CATALOG_ITEMS = [
  { id: 1, sku: 'SUP-VOI-01', name: 'Vôi bột sát trùng khử khuẩn lối đi', warehouseId: 4, unit: 'Bao', baseUnit: 'Kg', ratio: 25, stock: 15, cost: 65000, lotCode: 'LOT-VOI-2601' },
  { id: 2, sku: 'SUP-SUOI-01', name: 'Bóng đèn sưởi hồng ngoại 175W', warehouseId: 4, unit: 'Cái', baseUnit: 'Cái', ratio: 1, stock: 24, cost: 75000, lotCode: 'LOT-DEN-2605' },
  { id: 3, sku: 'CAM-GA-01', name: 'Cám Gà Con GĐ1 (0-14 ngày)', warehouseId: 1, unit: 'Bao', baseUnit: 'Kg', ratio: 25, stock: 50, cost: 362500, lotCode: 'LOT-CGA1-2610A' },
  { id: 4, sku: 'CAM-GA-02', name: 'Cám Gà Thịt Giai Đoạn 2', warehouseId: 1, unit: 'Bao', baseUnit: 'Kg', ratio: 25, stock: 192, cost: 345000, lotCode: 'LOT-CGA2-2610B' },
  { id: 5, sku: 'CAM-HEO-03', name: 'Cám Heo Thịt Vỗ Béo Cao Cấp', warehouseId: 2, unit: 'Bao', baseUnit: 'Kg', ratio: 25, stock: 80, cost: 370000, lotCode: 'LOT-CHB-2611A' },
  { id: 6, sku: 'MED-AMOX-01', name: 'Kháng sinh Amox 50% đặc trị tiêu chảy', warehouseId: 3, unit: 'Lọ', baseUnit: 'Lọ', ratio: 1, stock: 35, cost: 185000, lotCode: 'LOT-AMX-2609' },
  { id: 7, sku: 'VAC-TA-01', name: 'Vắc-xin Dịch Tả Heo Cổ Điển', warehouseId: 3, unit: 'Lọ', baseUnit: 'Liều', ratio: 20, stock: 20, cost: 240000, lotCode: 'LOT-VAC-2608' },
  { id: 8, sku: 'SUP-BENKO-01', name: 'Thuốc sát trùng Benkocid', warehouseId: 4, unit: 'Can', baseUnit: 'Lít', ratio: 1, stock: 18, cost: 145000, lotCode: 'LOT-BKC-2607' },
  { id: 9, sku: 'MED-PROBIO-01', name: 'Men tiêu hóa vi sinh Probio Active', warehouseId: 3, unit: 'Gói', baseUnit: 'Gói', ratio: 1, stock: 40, cost: 165000, lotCode: 'LOT-PRO-2610' },
];

export const INITIAL_TRANSFERS = [
  {
    id: 1,
    slipCode: 'XNB-2026-001',
    slipType: 'ISSUE_INTERNAL', // Xuất dùng nội bộ
    date: '2026-11-14',
    fromLocation: 'Kho Vật Tư & Sát Trùng',
    fromWarehouseId: 4,
    toLocation: 'Chuồng Gà A1 - Lứa Gà Thịt T11',
    toType: 'BARN',
    barnId: 1,
    reason: 'Rắc vôi sát trùng lối đi hành lang chuồng A1 định kỳ tuần thứ 4',
    totalItems: 2,
    totalValue: 550000,
    creatorName: 'Trần Kỹ Thuật Viên',
    approverName: 'Lê Kế Toán Kho',
    approvedAt: '2026-11-14 08:30',
    status: 'COMPLETED',
    items: [
      { id: 1, itemId: 1, name: 'Vôi bột sát trùng khử khuẩn lối đi', sku: 'SUP-VOI-01', lotCode: 'LOT-VOI-2601', unit: 'Bao', quantity: 4, costPrice: 65000, amount: 260000 },
      { id: 2, itemId: 8, name: 'Thuốc sát trùng Benkocid', sku: 'SUP-BENKO-01', lotCode: 'LOT-BKC-2607', unit: 'Can', quantity: 2, costPrice: 145000, amount: 290000 },
    ],
  },
  {
    id: 2,
    slipCode: 'XNB-2026-002',
    slipType: 'RETURN_SURPLUS', // Nhập trả thừa từ chuồng
    date: '2026-11-13',
    fromLocation: 'Chuồng Heo B2 - Lứa Heo Thịt H08 (Đã xuất chuồng)',
    toLocation: 'Kho Cám Khu B (Heo)',
    toType: 'WAREHOUSE',
    toWarehouseId: 2,
    barnId: 4,
    reason: 'Xuất bán hết toàn bộ heo chuồng B2, hoàn trả 5 bao cám vỗ béo chưa bóc về kho cám B',
    totalItems: 1,
    totalValue: 1850000,
    creatorName: 'Nguyễn Văn Nam (Tổ trưởng)',
    approverName: 'Lê Kế Toán Kho',
    approvedAt: '2026-11-13 16:45',
    status: 'COMPLETED',
    items: [
      { id: 3, itemId: 5, name: 'Cám Heo Thịt Vỗ Béo Cao Cấp', sku: 'CAM-HEO-03', lotCode: 'LOT-CHB-2611A', unit: 'Bao', quantity: 5, costPrice: 370000, amount: 1850000 },
    ],
  },
  {
    id: 3,
    slipCode: 'XNB-2026-003',
    slipType: 'TRANSFER_WAREHOUSE', // Điều chuyển kho
    date: '2026-11-15',
    fromLocation: 'Kho Cám Khu A (Gà)',
    fromWarehouseId: 1,
    toLocation: 'Kho Cám Khu B (Heo)',
    toType: 'WAREHOUSE',
    toWarehouseId: 2,
    reason: 'Hỗ trợ 10 bao cám gà con cho khu B bổ sung dinh dưỡng heo con cai sữa',
    totalItems: 1,
    totalValue: 3625000,
    creatorName: 'Trần Kỹ Thuật Viên',
    approverName: null,
    approvedAt: null,
    status: 'PENDING', // Đang chờ duyệt
    items: [
      { id: 4, itemId: 3, name: 'Cám Gà Con GĐ1 (0-14 ngày)', sku: 'CAM-GA-01', lotCode: 'LOT-CGA1-2610A', unit: 'Bao', quantity: 10, costPrice: 362500, amount: 3625000 },
    ],
  },
  {
    id: 4,
    slipCode: 'XNB-2026-004',
    slipType: 'STOCKTAKE', // Kiểm kê cân bằng kho
    date: '2026-11-10',
    fromLocation: 'Kho Thuốc & Vắc-Xin',
    fromWarehouseId: 3,
    toLocation: 'Kiểm kê định kỳ tháng 11',
    toType: 'STOCKTAKE',
    reason: 'Biên bản kiểm kê cân bằng kho thuốc tháng 11 định kỳ, điều chỉnh hao hụt',
    totalItems: 1,
    totalValue: -330000,
    creatorName: 'Lê Kế Toán Kho',
    approverName: 'Nguyễn Văn Chủ',
    approvedAt: '2026-11-10 17:00',
    status: 'COMPLETED',
    items: [
      { id: 5, itemId: 9, name: 'Men tiêu hóa vi sinh Probio Active', sku: 'MED-PROBIO-01', lotCode: 'LOT-PRO-2610', unit: 'Gói', bookStock: 42, actualStock: 40, difference: -2, costPrice: 165000, amount: -330000, reasonNote: 'Rách vỡ 2 gói do va chạm khi bốc xếp' },
    ],
  },
  {
    id: 5,
    slipCode: 'XNB-2026-005',
    slipType: 'ISSUE_INTERNAL', // Xuất dùng nội bộ
    date: '2026-11-15',
    fromLocation: 'Kho Vật Tư & Sát Trùng',
    fromWarehouseId: 4,
    toLocation: 'Chuồng Gà A2 - Lứa Gà Thịt T10',
    toType: 'BARN',
    barnId: 2,
    reason: 'Thay thế 6 bóng sưởi bị đứt tim tại ô úm gà con chuồng A2 trước khi đón gà',
    totalItems: 1,
    totalValue: 450000,
    creatorName: 'Nguyễn Văn Nam (Tổ trưởng)',
    approverName: null,
    approvedAt: null,
    status: 'PENDING', // Đang chờ duyệt
    items: [
      { id: 6, itemId: 2, name: 'Bóng đèn sưởi hồng ngoại 175W', sku: 'SUP-SUOI-01', lotCode: 'LOT-DEN-2605', unit: 'Cái', quantity: 6, costPrice: 75000, amount: 450000 },
    ],
  },
];

// Định nghĩa Badge cấu hình theo Loại nghiệp vụ
export const SLIP_TYPES_CONFIG = {
  ISSUE_INTERNAL: {
    key: 'ISSUE_INTERNAL',
    label: 'Xuất dùng nội bộ',
    subLabel: 'Vôi sát trùng, bóng sưởi, dụng cụ...',
    icon: ArrowUpRight,
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  RETURN_SURPLUS: {
    key: 'RETURN_SURPLUS',
    label: 'Nhập trả thừa từ chuồng',
    subLabel: 'Hoàn cám/thuốc dư khi xuất chuồng',
    icon: RotateCcw,
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    dotColor: 'bg-blue-500',
  },
  TRANSFER_WAREHOUSE: {
    key: 'TRANSFER_WAREHOUSE',
    label: 'Điều chuyển kho',
    subLabel: 'Giữa các kho hoặc chi nhánh',
    icon: ArrowLeftRight,
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
    dotColor: 'bg-purple-500',
  },
  STOCKTAKE: {
    key: 'STOCKTAKE',
    label: 'Kiểm kê cân bằng kho',
    subLabel: 'Đối soát sổ sách & thực tế',
    icon: ClipboardCheck,
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
    dotColor: 'bg-slate-500',
  },
};

export function InternalTransfersPage() {
  const { userInfo, hasPermission, isOwner, isSuperAdmin } = useAuthStore();
  const userRoles = (userInfo?.roles || []).map((r) => (typeof r === 'string' ? r : r?.code)).filter(Boolean);

  // Phân quyền RBAC
  const canViewCost = useMemo(() => {
    return (
      isOwner?.() ||
      isSuperAdmin?.() ||
      userRoles.includes('ROLE_FARM_OWNER') ||
      userRoles.includes('ROLE_ACCOUNTANT') ||
      hasPermission?.('financial.price.view') ||
      hasPermission?.('financial.view_cost')
    );
  }, [userInfo, userRoles]);

  const canCreateTransfer = useMemo(() => {
    return (
      isOwner?.() ||
      isSuperAdmin?.() ||
      userRoles.includes('ROLE_FARM_OWNER') ||
      userRoles.includes('ROLE_ACCOUNTANT') ||
      userRoles.includes('ROLE_FARM_MANAGER') ||
      userRoles.includes('ROLE_TECHNICAL_STAFF') ||
      hasPermission?.('transfers.create') ||
      hasPermission?.('inventory.manage')
    );
  }, [userInfo, userRoles]);

  const canApproveTransfer = useMemo(() => {
    return (
      isOwner?.() ||
      isSuperAdmin?.() ||
      userRoles.includes('ROLE_FARM_OWNER') ||
      userRoles.includes('ROLE_ACCOUNTANT') ||
      userRoles.includes('ROLE_FARM_MANAGER') ||
      hasPermission?.('transfers.approve') ||
      hasPermission?.('inventory.manage')
    );
  }, [userInfo, userRoles]);

  const rawFarmId = useActiveFarmStore((s) => s.activeFarmId);
  const activeFarmId = (rawFarmId && rawFarmId !== 'ALL' && !isNaN(Number(rawFarmId))) ? Number(rawFarmId) : 1;
  const currentBranchId = useActiveBranchStore((s) => s.currentBranchId);
  const dataVersion = useActiveBranchStore((s) => s.dataVersion);

  // State dữ liệu thật từ Database (cô lập theo chi nhánh)
  const [warehouses, setWarehouses] = useState([]);
  const [barnsAndBatches, setBarnsAndBatches] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizeStatus = (rawStatus) => {
    const s = String(rawStatus || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'RECEIVED' || s === 'ADJUSTED') return 'COMPLETED';
    if (s === 'CANCELLED') return 'CANCELLED';
    return 'PENDING';
  };

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const effectiveBranchId = (currentBranchId && currentBranchId !== 'ALL') ? Number(currentBranchId) : undefined;

      const [whRes, barnsRes, invRes, issuesRes, receiptsRes, transfersRes, stocktakesRes] = await Promise.all([
        masterDataService.getWarehouses(activeFarmId, { branchId: effectiveBranchId }).catch(() => []),
        barnBatchService.getBarns({ farmId: activeFarmId, branchId: effectiveBranchId }).catch(() => []),
        inventoryService.getInventory({ farmId: activeFarmId, branchId: effectiveBranchId, size: 200 }).catch(() => []),
        inventoryService.getIssues({ farmId: activeFarmId, branchId: effectiveBranchId, size: 50 }).catch(() => []),
        inventoryService.getReceipts({ farmId: activeFarmId, branchId: effectiveBranchId, size: 50 }).catch(() => []),
        inventoryService.getTransfers({ farmId: activeFarmId, branchId: effectiveBranchId, size: 50 }).catch(() => []),
        inventoryService.getStocktakes({ farmId: activeFarmId, branchId: effectiveBranchId, size: 50 }).catch(() => []),
      ]);

      // 1. Kho thuộc chi nhánh
      const whList = Array.isArray(whRes) ? whRes : (whRes?.content || []);
      const branchWarehouses = whList
        .filter((w) => !effectiveBranchId || !w.branchId || Number(w.branchId) === effectiveBranchId)
        .map((w) => ({ id: w.id, code: w.code, name: w.name, warehouseType: w.warehouseType, branchId: w.branchId }));
      setWarehouses(branchWarehouses);

      // 2. Chuồng & lứa thuộc chi nhánh
      const barnList = Array.isArray(barnsRes) ? barnsRes : (barnsRes?.content || []);
      const branchBarns = barnList
        .filter((b) => !effectiveBranchId || !b.branchId || Number(b.branchId) === effectiveBranchId)
        .map((b) => ({
          id: b.id,
          barnName: b.name || `Chuồng ${b.id}`,
          batchId: b.currentBatch?.id || null,
          batchName: b.currentBatch
            ? `${b.currentBatch.code} (${b.currentBatch.breedName || 'Đang nuôi'} - ${formatNumber(b.currentBatch.currentQuantity || 0)} con)`
            : 'Chuồng Trống',
          status: b.status,
        }));
      setBarnsAndBatches(branchBarns);

      // 3. Tồn kho theo lô của các kho thuộc chi nhánh
      const invList = Array.isArray(invRes) ? invRes : (invRes?.content || []);
      const branchWhIds = new Set(branchWarehouses.map((w) => Number(w.id)));
      const mappedCatalog = invList
        .filter((it) => branchWhIds.size === 0 || branchWhIds.has(Number(it.warehouseId)))
        .map((it) => ({
          id: it.id, // inventory row id (material + batch + warehouse)
          materialId: it.materialId,
          warehouseId: it.warehouseId,
          sku: it.skuCode || `VT-${it.materialId}`,
          name: it.materialName || 'Vật tư',
          unit: it.standardUnit || it.baseUnit || 'ĐV',
          packUnit: it.packUnit || it.standardUnit || 'ĐV',
          ratio: Number(it.conversionFactor) || 1,
          lotCode: it.batchNumber || 'LOT-MAIN',
          expiryDate: it.expiryDate || null,
          stock: Number(it.availableQuantity ?? it.quantityOnHand) || 0,
          cost: Number(it.unitCost) || 0,
        }));
      setCatalogItems(mappedCatalog);

      // 4. Tổng hợp danh sách phiếu thật từ 4 bảng nghiệp vụ
      const issuesList = (Array.isArray(issuesRes) ? issuesRes : (issuesRes?.content || []))
        .filter((iss) => !iss.issueType || iss.issueType === 'INTERNAL_USE' || iss.issueType === 'DAMAGE_DISPOSAL')
        .map((iss) => ({
          id: `ISSUE-${iss.id}`,
          rawId: iss.id,
          sourceType: 'ISSUE',
          slipCode: iss.issueCode || `PX-${iss.id}`,
          slipType: 'ISSUE_INTERNAL',
          date: iss.issueDate || '',
          fromLocation: iss.warehouseName || 'Kho xuất',
          fromWarehouseId: iss.warehouseId,
          toLocation: iss.receiverName || (iss.livestockGroupId ? `Lứa nuôi #${iss.livestockGroupId}` : 'Sử dụng nội bộ'),
          toType: 'BARN',
          reason: iss.notes || '',
          totalItems: (iss.items || []).length,
          totalValue: Number(iss.totalAmount) || 0,
          creatorName: iss.receiverName || 'Nhân viên kho',
          approverName: iss.approvedBy ? `User #${iss.approvedBy}` : null,
          approvedAt: iss.approvedAt ? String(iss.approvedAt).replace('T', ' ').substring(0, 16) : null,
          status: normalizeStatus(iss.status),
          items: (iss.items || []).map((it) => ({
            id: it.id,
            itemId: it.materialId,
            name: it.materialName,
            sku: it.skuCode,
            lotCode: it.batchNumber,
            unit: it.standardUnit,
            quantity: Number(it.quantity) || 0,
            costPrice: Number(it.unitPrice) || 0,
            amount: Number(it.totalPrice) || 0,
          })),
        }));

      const receiptsList = (Array.isArray(receiptsRes) ? receiptsRes : (receiptsRes?.content || []))
        .filter((r) => r.receiptType === 'HARVEST_RETURN')
        .map((r) => ({
          id: `RECEIPT-${r.id}`,
          rawId: r.id,
          sourceType: 'RECEIPT',
          slipCode: r.receiptCode || `PN-${r.id}`,
          slipType: 'RETURN_SURPLUS',
          date: r.receiptDate || '',
          fromLocation: 'Chuồng nuôi hoàn trả',
          toLocation: r.warehouseName || 'Kho nhận',
          toType: 'WAREHOUSE',
          toWarehouseId: r.warehouseId,
          reason: r.notes || '',
          totalItems: (r.items || []).length,
          totalValue: Number(r.totalAmount) || 0,
          creatorName: 'Nhân viên trại',
          approverName: r.approvedBy ? `User #${r.approvedBy}` : null,
          approvedAt: r.approvedAt ? String(r.approvedAt).replace('T', ' ').substring(0, 16) : null,
          status: normalizeStatus(r.status),
          items: (r.items || []).map((it) => ({
            id: it.id,
            itemId: it.materialId,
            name: it.materialName,
            sku: it.skuCode,
            lotCode: it.batchNumber,
            unit: it.standardUnit,
            quantity: Number(it.quantity) || 0,
            costPrice: Number(it.unitPrice) || 0,
            amount: Number(it.totalPrice) || 0,
          })),
        }));

      const transfersList = (Array.isArray(transfersRes) ? transfersRes : (transfersRes?.content || []))
        .map((tr) => ({
          id: `TRANSFER-${tr.id}`,
          rawId: tr.id,
          sourceType: 'TRANSFER',
          slipCode: tr.transferCode || `DC-${tr.id}`,
          slipType: 'TRANSFER_WAREHOUSE',
          date: tr.transferDate || '',
          fromLocation: tr.fromWarehouseName || `Kho #${tr.fromWarehouseId}`,
          fromWarehouseId: tr.fromWarehouseId,
          toLocation: tr.toWarehouseName || `Kho #${tr.toWarehouseId}`,
          toType: 'WAREHOUSE',
          toWarehouseId: tr.toWarehouseId,
          reason: tr.notes || '',
          totalItems: (tr.items || []).length,
          totalValue: (tr.items || []).reduce((sum, it) => sum + (Number(it.totalAmount) || 0), 0),
          creatorName: tr.transferredByUserId ? `User #${tr.transferredByUserId}` : 'Nhân viên kho',
          approverName: tr.receivedByUserId ? `User #${tr.receivedByUserId}` : null,
          approvedAt: tr.receivedAt ? String(tr.receivedAt).replace('T', ' ').substring(0, 16) : null,
          status: normalizeStatus(tr.status),
          items: (tr.items || []).map((it) => ({
            id: it.id,
            itemId: it.materialId,
            name: it.materialName,
            sku: it.skuCode,
            lotCode: it.fromBatchNumber,
            unit: it.standardUnit,
            quantity: Number(it.quantity) || 0,
            costPrice: Number(it.unitPrice) || 0,
            amount: Number(it.totalAmount) || 0,
          })),
        }));

      const stocktakesList = (Array.isArray(stocktakesRes) ? stocktakesRes : (stocktakesRes?.content || []))
        .map((st) => ({
          id: `STOCKTAKE-${st.id}`,
          rawId: st.id,
          sourceType: 'STOCKTAKE',
          slipCode: st.stocktakeCode || `KK-${st.id}`,
          slipType: 'STOCKTAKE',
          date: st.stocktakeDate || '',
          fromLocation: st.warehouseName || `Kho #${st.warehouseId}`,
          fromWarehouseId: st.warehouseId,
          toLocation: 'Kiểm kê cân bằng kho',
          toType: 'STOCKTAKE',
          reason: st.notes || '',
          totalItems: (st.items || []).length,
          totalValue: 0,
          creatorName: 'Kế toán kho',
          approverName: st.approvedBy ? `User #${st.approvedBy}` : null,
          approvedAt: st.approvedAt ? String(st.approvedAt).replace('T', ' ').substring(0, 16) : null,
          status: normalizeStatus(st.status),
          items: (st.items || []).map((it) => ({
            id: it.id,
            itemId: it.materialId,
            name: it.materialName,
            sku: it.skuCode,
            lotCode: it.batchNumber,
            unit: it.standardUnit,
            quantity: Number(it.actualQuantity) || 0,
            bookStock: Number(it.bookQuantity) || 0,
            actualStock: Number(it.actualQuantity) || 0,
            difference: Number(it.differenceQuantity) || 0,
            costPrice: 0,
            amount: 0,
            reasonNote: it.reason || '',
          })),
        }));

      const combined = [...issuesList, ...receiptsList, ...transfersList, ...stocktakesList]
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
      setTransfers(combined);
    } catch (err) {
      console.error('Lỗi tải dữ liệu xuất nhập nội bộ:', err);
      toast.error('Không thể tải dữ liệu xuất nhập nội bộ từ máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [activeFarmId, currentBranchId, dataVersion]);

  // Bộ lọc Khối 1
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ISSUE_INTERNAL, RETURN_SURPLUS, TRANSFER_WAREHOUSE, STOCKTAKE
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, COMPLETED, CANCELLED
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dropdown nút "+ Tạo phiếu"
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  // Modal tạo phiếu
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCreateType, setSelectedCreateType] = useState('ISSUE_INTERNAL');
  const [createForm, setCreateForm] = useState({
    date: new Date().toISOString().split('T')[0],
    fromWarehouseId: 4,
    toWarehouseId: 2,
    barnId: 1,
    reason: '',
    items: [],
  });

  // Modal xem chi tiết phiếu
  const [selectedSlipForView, setSelectedSlipForView] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // ================= LỌC DANH SÁCH =================
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      // Lọc theo Tab loại phiếu
      if (activeTab !== 'ALL' && t.slipType !== activeTab) return false;

      // Lọc theo trạng thái
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;

      // Lọc theo khoảng ngày
      if (fromDate && t.date < fromDate) return false;
      if (toDate && t.date > toDate) return false;

      // Tìm kiếm mã phiếu, nơi xuất, nơi nhận, lý do, người tạo
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchCode = t.slipCode.toLowerCase().includes(query);
        const matchFrom = t.fromLocation.toLowerCase().includes(query);
        const matchTo = t.toLocation.toLowerCase().includes(query);
        const matchReason = (t.reason || '').toLowerCase().includes(query);
        const matchCreator = (t.creatorName || '').toLowerCase().includes(query);
        if (!matchCode && !matchFrom && !matchTo && !matchReason && !matchCreator) return false;
      }

      return true;
    });
  }, [transfers, activeTab, statusFilter, fromDate, toDate, searchQuery]);

  // ================= TÁC VỤ DUYỆT / HỦY PHIẾU =================
  const handleApproveSlip = async (slip) => {
    if (!canApproveTransfer) {
      toast.error('Bạn không có quyền duyệt phiếu xuất nhập nội bộ');
      return;
    }
    try {
      setIsSubmitting(true);
      if (slip.sourceType === 'ISSUE') {
        await inventoryService.completeIssue(activeFarmId, slip.rawId);
      } else if (slip.sourceType === 'RECEIPT') {
        await inventoryService.completeReceipt(activeFarmId, slip.rawId);
      } else if (slip.sourceType === 'TRANSFER') {
        await inventoryService.dispatchTransfer(activeFarmId, slip.rawId);
        await inventoryService.receiveTransfer(activeFarmId, slip.rawId);
      } else if (slip.sourceType === 'STOCKTAKE') {
        await inventoryService.adjustStocktake(activeFarmId, slip.rawId);
      }
      toast.success(`Đã duyệt và ghi sổ kho thành công phiếu "${slip.slipCode}"!`);
      setIsViewModalOpen(false);
      await fetchAllData();
      useActiveBranchStore.getState().triggerRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể duyệt phiếu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSlip = async (slip) => {
    if (slip.status === 'COMPLETED') {
      toast.error('Không thể hủy phiếu đã hoàn thành ghi sổ kho');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn hủy phiếu "${slip.slipCode}"?`)) return;

    try {
      setIsSubmitting(true);
      if (slip.sourceType === 'ISSUE') {
        await inventoryService.cancelIssue(activeFarmId, slip.rawId, { cancellationReason: 'Hủy phiếu từ Xuất nhập nội bộ' });
      } else if (slip.sourceType === 'RECEIPT') {
        await inventoryService.cancelReceipt(activeFarmId, slip.rawId, { cancellationReason: 'Hủy phiếu từ Xuất nhập nội bộ' });
      } else {
        toast.info('Loại phiếu này chưa hỗ trợ hủy trực tiếp từ API');
        return;
      }
      toast.info(`Đã hủy phiếu "${slip.slipCode}"`);
      setIsViewModalOpen(false);
      await fetchAllData();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể hủy phiếu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lọc danh sách hàng hóa theo Kho nguồn đang chọn trong Modal
  const getCatalogForWarehouse = (whId, slipType) => {
    if (!whId) return catalogItems;
    const matched = catalogItems.filter((c) => Number(c.warehouseId) === Number(whId));
    if (matched.length > 0) return matched;
    // Với Nhập trả thừa từ chuồng: nếu kho nhận chưa có lô nào thì cho phép chọn vật tư thuộc chi nhánh
    return slipType === 'RETURN_SURPLUS' ? catalogItems : [];
  };

  const buildRowFromCatalog = (item, slipType) => {
    if (!item) {
      return {
        tempId: Date.now() + Math.random(),
        itemId: '',
        materialId: '',
        sku: '',
        name: '',
        unit: '',
        lotCode: '',
        expiryDate: null,
        currentStock: 0,
        quantity: slipType === 'STOCKTAKE' ? 0 : 1,
        bookStock: 0,
        actualStock: 0,
        difference: 0,
        costPrice: 0,
        reasonNote: '',
      };
    }
    return {
      tempId: Date.now() + Math.random(),
      itemId: item.id,
      materialId: item.materialId,
      sku: item.sku,
      name: item.name,
      unit: item.unit,
      lotCode: item.lotCode,
      expiryDate: item.expiryDate,
      currentStock: item.stock,
      quantity: slipType === 'STOCKTAKE' ? 0 : 1,
      bookStock: item.stock,
      actualStock: item.stock,
      difference: 0,
      costPrice: item.cost,
      reasonNote: '',
    };
  };

  // ================= MỞ MODAL TẠO PHIẾU =================
  const handleOpenCreateModal = (type = 'ISSUE_INTERNAL') => {
    if (currentBranchId === 'ALL') {
      toast.warning('Vui lòng chọn một chi nhánh cụ thể trên Header trước khi tạo phiếu xuất nhập nội bộ!');
      setIsCreateMenuOpen(false);
      return;
    }
    setSelectedCreateType(type);
    setIsCreateMenuOpen(false);

    const whWithStock = warehouses.find((w) =>
      catalogItems.some((c) => Number(c.warehouseId) === Number(w.id) && Number(c.stock) > 0)
    );
    const defaultFromWh = whWithStock?.id || warehouses[0]?.id || '';
    const defaultToWh =
      warehouses.find((w) => Number(w.id) !== Number(defaultFromWh))?.id || warehouses[0]?.id || '';
    const defaultBarn = barnsAndBatches[0]?.id || '';

    let defaultReason = 'Xuất vật tư dùng nội bộ cho chuồng nuôi';
    if (type === 'RETURN_SURPLUS') {
      defaultReason = 'Hoàn trả cám/thuốc còn thừa từ chuồng nuôi về kho';
    } else if (type === 'TRANSFER_WAREHOUSE') {
      defaultReason = 'Điều chuyển vật tư giữa các kho nội bộ';
    } else if (type === 'STOCKTAKE') {
      defaultReason = 'Kiểm kê định kỳ cân bằng sổ sách và số lượng thực đếm';
    }

    const whForItems = type === 'RETURN_SURPLUS' ? defaultToWh : defaultFromWh;
    const availItems = getCatalogForWarehouse(whForItems, type);
    const initialItem = availItems[0] || null;

    setCreateForm({
      date: new Date().toISOString().split('T')[0],
      fromWarehouseId: defaultFromWh,
      toWarehouseId: defaultToWh,
      barnId: defaultBarn,
      reason: defaultReason,
      items: [buildRowFromCatalog(initialItem, type)],
    });

    setIsCreateModalOpen(true);
  };

  // Thay đổi loại phiếu ngay trong Modal
  const handleChangeModalType = (newType) => {
    setSelectedCreateType(newType);
    const defaultFromWh = createForm.fromWarehouseId || warehouses[0]?.id || '';
    const defaultToWh = createForm.toWarehouseId || warehouses[1]?.id || warehouses[0]?.id || '';

    let defaultReason = 'Xuất vật tư dùng nội bộ cho chuồng nuôi';
    if (newType === 'RETURN_SURPLUS') {
      defaultReason = 'Hoàn trả cám/thuốc còn thừa từ chuồng nuôi về kho';
    } else if (newType === 'TRANSFER_WAREHOUSE') {
      defaultReason = 'Điều chuyển vật tư giữa các kho nội bộ';
    } else if (newType === 'STOCKTAKE') {
      defaultReason = 'Kiểm kê định kỳ cân bằng sổ sách và số lượng thực đếm';
    }

    const whForItems = newType === 'RETURN_SURPLUS' ? defaultToWh : defaultFromWh;
    const availItems = getCatalogForWarehouse(whForItems, newType);

    setCreateForm((prev) => ({
      ...prev,
      fromWarehouseId: defaultFromWh,
      toWarehouseId: defaultToWh,
      reason: defaultReason,
      items: [buildRowFromCatalog(availItems[0] || null, newType)],
    }));
  };

  // Thêm dòng hàng hóa mới
  const handleAddItemRow = () => {
    const whForItems = selectedCreateType === 'RETURN_SURPLUS' ? createForm.toWarehouseId : createForm.fromWarehouseId;
    const availItems = getCatalogForWarehouse(whForItems, selectedCreateType);
    const defaultItem = availItems[0] || null;

    setCreateForm((prev) => ({
      ...prev,
      items: [...prev.items, buildRowFromCatalog(defaultItem, selectedCreateType)],
    }));
  };

  // Xóa dòng hàng hóa
  const handleRemoveItemRow = (tempId) => {
    if (createForm.items.length <= 1) {
      toast.warning('Phiếu phải có ít nhất 1 mặt hàng');
      return;
    }
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.tempId !== tempId),
    }));
  };

  // Cập nhật chọn hàng hóa cho dòng
  const handleSelectCatalogItem = (tempId, catalogItemId) => {
    const item = catalogItems.find((c) => Number(c.id) === Number(catalogItemId));
    if (!item) return;

    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.map((row) =>
        row.tempId === tempId
          ? {
            ...row,
            itemId: item.id,
            materialId: item.materialId,
            sku: item.sku,
            name: item.name,
            unit: item.unit,
            lotCode: item.lotCode,
            expiryDate: item.expiryDate,
            currentStock: item.stock,
            bookStock: item.stock,
            actualStock: item.stock,
            difference: 0,
            costPrice: item.cost,
          }
          : row
      ),
    }));
  };

  // Cập nhật số lượng
  const handleUpdateQuantity = (tempId, qty) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.map((row) =>
        row.tempId === tempId ? { ...row, quantity: Math.max(0, Number(qty) || 0) } : row
      ),
    }));
  };

  // Cập nhật số thực kiểm (phiếu kiểm kê)
  const handleUpdateActualStock = (tempId, actual) => {
    const act = Math.max(0, Number(actual) || 0);
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.map((row) =>
        row.tempId === tempId
          ? {
            ...row,
            actualStock: act,
            difference: act - (row.bookStock || 0),
          }
          : row
      ),
    }));
  };

  // Lưu phiếu (Nháp hoặc Hoàn thành) lên Backend Database
  const handleSaveSlip = async (status = 'PENDING') => {
    if (!createForm.items || createForm.items.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 mặt hàng');
      return;
    }
    const invalidItem = createForm.items.find((it) => !it.materialId);
    if (invalidItem) {
      toast.error('Vui lòng chọn mặt hàng hợp lệ trong kho của chi nhánh');
      return;
    }

    const barnObj = barnsAndBatches.find((b) => Number(b.id) === Number(createForm.barnId));

    try {
      setIsSubmitting(true);
      if (selectedCreateType === 'ISSUE_INTERNAL') {
        const created = await inventoryService.createIssue(activeFarmId, {
          warehouseId: Number(createForm.fromWarehouseId),
          issueType: 'INTERNAL_USE',
          receiverName: barnObj ? `${barnObj.barnName} - ${barnObj.batchName}` : 'Sử dụng nội bộ',
          livestockGroupId: barnObj?.batchId ? Number(barnObj.batchId) : null,
          issueDate: createForm.date,
          notes: createForm.reason || 'Xuất dùng nội bộ',
          items: createForm.items.map((it) => ({
            materialId: Number(it.materialId),
            batchNumber: it.lotCode || 'LOT-MAIN',
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.costPrice) || 0,
          })),
        });
        if (status === 'COMPLETED' && created?.id) {
          await inventoryService.completeIssue(activeFarmId, created.id);
        }
      } else if (selectedCreateType === 'RETURN_SURPLUS') {
        const created = await inventoryService.createReceipt(activeFarmId, {
          warehouseId: Number(createForm.toWarehouseId),
          receiptType: 'HARVEST_RETURN',
          receiptDate: createForm.date,
          notes: `${barnObj ? `[Từ ${barnObj.barnName}] ` : ''}${createForm.reason || 'Nhập trả thừa từ chuồng'}`,
          items: createForm.items.map((it) => ({
            materialId: Number(it.materialId),
            batchNumber: it.lotCode || 'LOT-RETURN',
            expiryDate: it.expiryDate || null,
            enteredUnit: it.unit,
            enteredQuantity: Number(it.quantity) || 1,
            conversionFactor: 1,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.costPrice) || 0,
          })),
        });
        if (status === 'COMPLETED' && created?.id) {
          await inventoryService.completeReceipt(activeFarmId, created.id);
        }
      } else if (selectedCreateType === 'TRANSFER_WAREHOUSE') {
        if (Number(createForm.fromWarehouseId) === Number(createForm.toWarehouseId)) {
          toast.error('Kho xuất và Kho tiếp nhận phải khác nhau');
          setIsSubmitting(false);
          return;
        }
        const created = await inventoryService.createTransfer(activeFarmId, {
          fromWarehouseId: Number(createForm.fromWarehouseId),
          toWarehouseId: Number(createForm.toWarehouseId),
          transferDate: createForm.date,
          notes: createForm.reason || 'Điều chuyển kho nội bộ',
          items: createForm.items.map((it) => ({
            materialId: Number(it.materialId),
            fromBatchNumber: it.lotCode || 'LOT-MAIN',
            toBatchNumber: it.lotCode || 'LOT-MAIN',
            expiryDate: it.expiryDate || null,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.costPrice) || 0,
          })),
        });
        if (status === 'COMPLETED' && created?.id) {
          await inventoryService.dispatchTransfer(activeFarmId, created.id);
          await inventoryService.receiveTransfer(activeFarmId, created.id);
        }
      } else if (selectedCreateType === 'STOCKTAKE') {
        const created = await inventoryService.createStocktake(activeFarmId, {
          warehouseId: Number(createForm.fromWarehouseId),
          stocktakeDate: createForm.date,
          notes: createForm.reason || 'Kiểm kê cân bằng kho',
        });
        if (created?.id) {
          await inventoryService.recordStocktakeCount(activeFarmId, created.id, {
            items: createForm.items.map((it) => ({
              materialId: Number(it.materialId),
              batchNumber: it.lotCode || 'LOT-MAIN',
              actualQuantity: Number(it.actualStock) ?? 0,
              reason: it.reasonNote || 'Kiểm kê thực tế',
            })),
          });
          if (status === 'COMPLETED') {
            await inventoryService.adjustStocktake(activeFarmId, created.id);
          }
        }
      }

      toast.success(
        status === 'COMPLETED'
          ? 'Đã tạo và ghi sổ kho thành công!'
          : 'Đã lưu nháp và gửi duyệt phiếu thành công!'
      );
      setIsCreateModalOpen(false);
      await fetchAllData();
      useActiveBranchStore.getState().triggerRefresh?.();
    } catch (err) {
      console.error('Lỗi lưu phiếu xuất nhập nội bộ:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Không thể lưu phiếu lên hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mở modal xem chi tiết
  const handleOpenViewModal = (slip) => {
    setSelectedSlipForView(slip);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* KHỐI 1: THANH TIÊU ĐỀ, TÁC VỤ & BỘ LỌC NGHIỆP VỤ */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <ArrowLeftRight className="h-4 w-4" />
            <span>Phân Hệ Quản Lý Kho & Hạch Toán Lứa Nuôi</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Xuất Nhập Nội Bộ & Kiểm Kê Kho</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {filteredTransfers.length} phiếu
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Quản lý các biến động vật tư dùng chung cho chuồng, nhập hoàn trả cám/thuốc thừa khi xuất bán hết đàn, điều chuyển giữa các kho và biên bản kiểm kê cân đối tồn.
          </p>
        </div>

        {/* Nút Tạo Phiếu Nhanh (Góc phải) */}
        {canCreateTransfer && (
          <div className="relative flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              className="gap-2 font-bold shadow-sm"
            >
              <span>+ Tạo Phiếu Xuất/Nhập Nội Bộ</span>
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>

            {/* Dropdown 4 loại phiếu */}
            {isCreateMenuOpen && (
              <div className="absolute right-0 top-11 z-30 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-xs divide-y divide-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal('ISSUE_INTERNAL')}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-amber-50 text-slate-800 flex items-start gap-3 transition-colors"
                >
                  <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700 mt-0.5">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block">1. Xuất Dùng Nội Bộ</span>
                    <span className="text-[11px] text-slate-500">Vôi sát trùng, bóng sưởi, trấu, máng ăn</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCreateModal('RETURN_SURPLUS')}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 text-slate-800 flex items-start gap-3 transition-colors"
                >
                  <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700 mt-0.5">
                    <RotateCcw className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block">2. Nhập Trả Thừa Từ Chuồng</span>
                    <span className="text-[11px] text-slate-500">Hoàn cám, thuốc thú y dư sau xuất chuồng</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCreateModal('TRANSFER_WAREHOUSE')}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-purple-50 text-slate-800 flex items-start gap-3 transition-colors"
                >
                  <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700 mt-0.5">
                    <ArrowLeftRight className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block">3. Điều Chuyển Giữa Các Kho</span>
                    <span className="text-[11px] text-slate-500">Chuyển giữa Kho Cám A, B hoặc kho chi nhánh</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCreateModal('STOCKTAKE')}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-100 text-slate-800 flex items-start gap-3 transition-colors"
                >
                  <span className="p-1.5 rounded-lg bg-slate-200 text-slate-700 mt-0.5">
                    <ClipboardCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block">4. Kiểm Kê Cân Bằng Kho</span>
                    <span className="text-[11px] text-slate-500">Kiểm đếm thực tế, điều chỉnh hao hụt rơi vãi</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs Lọc Nhanh Theo Loại Phiếu */}
      <div className="flex border-b border-slate-200 text-xs overflow-x-auto gap-1 bg-white p-1 rounded-xl shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${activeTab === 'ALL'
            ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
        >
          <Layers className="h-4 w-4" />
          <span>Tất Cả Phiếu ({transfers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ISSUE_INTERNAL')}
          className={`px-3.5 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${activeTab === 'ISSUE_INTERNAL'
            ? 'border-amber-500 text-amber-700 bg-amber-50/50'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
        >
          <ArrowUpRight className="h-4 w-4 text-amber-600" />
          <span>Xuất Dùng Nội Bộ ({transfers.filter((t) => t.slipType === 'ISSUE_INTERNAL').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RETURN_SURPLUS')}
          className={`px-3.5 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${activeTab === 'RETURN_SURPLUS'
            ? 'border-blue-600 text-blue-700 bg-blue-50/50'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
        >
          <RotateCcw className="h-4 w-4 text-blue-600" />
          <span>Nhập Trả Thừa Từ Chuồng ({transfers.filter((t) => t.slipType === 'RETURN_SURPLUS').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TRANSFER_WAREHOUSE')}
          className={`px-3.5 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${activeTab === 'TRANSFER_WAREHOUSE'
            ? 'border-purple-600 text-purple-700 bg-purple-50/50'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
        >
          <ArrowLeftRight className="h-4 w-4 text-purple-600" />
          <span>Điều Chuyển Kho ({transfers.filter((t) => t.slipType === 'TRANSFER_WAREHOUSE').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('STOCKTAKE')}
          className={`px-3.5 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${activeTab === 'STOCKTAKE'
            ? 'border-slate-700 text-slate-900 bg-slate-100'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
        >
          <ClipboardCheck className="h-4 w-4 text-slate-600" />
          <span>Kiểm Kê Cân Bằng Kho ({transfers.filter((t) => t.slipType === 'STOCKTAKE').length})</span>
        </button>
      </div>

      {/* Thanh Bộ Lọc Phụ (Khoảng ngày, Trạng thái, Tìm kiếm) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Tìm kiếm */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã XNB, nơi xuất/nhận, lý do..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
          />
        </div>

        {/* Lọc Trạng thái & Ngày */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Tất Cả Trạng Thái</option>
              <option value="PENDING">Chờ Duyệt (Chưa ghi sổ)</option>
              <option value="COMPLETED">Hoàn Thành (Đã ghi sổ)</option>
              <option value="CANCELLED">Đã Hủy</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Từ ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-slate-500 font-medium">đến:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {(searchQuery || statusFilter !== 'ALL' || fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setFromDate('');
                setToDate('');
              }}
              className="text-xs text-rose-600 hover:underline font-semibold ml-1 cursor-pointer"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 2: BẢNG DANH SÁCH PHIẾU XUẤT NHẬP NỘI BỘ (DATA TABLE) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Mã Phiếu & Ngày Lập</th>
                <th className="py-3 px-3">Loại Nghiệp Vụ</th>
                <th className="py-3 px-4">Nơi Xuất → Nơi Nhận</th>
                <th className="py-3 px-3 text-center">Số Mặt Hàng</th>
                {canViewCost && <th className="py-3 px-4 text-right">Tổng Giá Trị</th>}
                <th className="py-3 px-3">Người Tạo</th>
                <th className="py-3 px-3 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={canViewCost ? 8 : 7} className="py-12 text-center text-slate-400">
                    <Boxes className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <span>Không tìm thấy phiếu xuất nhập nội bộ phù hợp</span>
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((slip) => {
                  const typeCfg = SLIP_TYPES_CONFIG[slip.slipType] || SLIP_TYPES_CONFIG.ISSUE_INTERNAL;
                  const TypeIcon = typeCfg.icon;

                  return (
                    <tr key={slip.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Mã phiếu & Ngày */}
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => handleOpenViewModal(slip)}
                          className="font-black text-slate-900 font-mono text-xs hover:text-emerald-700 cursor-pointer hover:underline"
                        >
                          {slip.slipCode}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{formatDate(slip.date)}</span>
                        </div>
                      </td>

                      {/* Loại nghiệp vụ */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${typeCfg.badgeBg}`}
                        >
                          <TypeIcon className="h-3 w-3" />
                          <span>{typeCfg.label}</span>
                        </span>
                      </td>

                      {/* Nơi xuất -> Nơi nhận */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-1 text-slate-800 font-semibold truncate" title={slip.fromLocation}>
                          <span className="text-slate-400">Từ:</span>
                          <span className="truncate">{slip.fromLocation}</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-800 font-bold truncate mt-0.5" title={slip.toLocation}>
                          <span className="text-slate-400 font-normal">Đến:</span>
                          <span className="truncate">{slip.toLocation}</span>
                        </div>
                        {slip.reason && (
                          <div className="text-[11px] text-slate-500 italic truncate mt-0.5" title={slip.reason}>
                            "{slip.reason}"
                          </div>
                        )}
                      </td>

                      {/* Số mặt hàng */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-700 font-bold">
                          {slip.totalItems} mã
                        </span>
                      </td>

                      {/* Tổng giá trị (RBAC) */}
                      {canViewCost && (
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`font-black font-mono ${slip.totalValue < 0 ? 'text-rose-600' : 'text-slate-900'
                              }`}
                          >
                            {formatCurrency(slip.totalValue)}
                          </span>
                        </td>
                      )}

                      {/* Người tạo */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">{slip.creatorName}</div>
                        {slip.approverName && (
                          <div className="text-[10px] text-slate-400">Duyệt: {slip.approverName}</div>
                        )}
                      </td>

                      {/* Trạng thái duyệt */}
                      <td className="py-3.5 px-3 text-center">
                        {slip.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Hoàn thành</span>
                          </span>
                        ) : slip.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                            <Clock className="h-3 w-3" />
                            <span>Chờ duyệt</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 line-through">
                            <XCircle className="h-3 w-3" />
                            <span>Đã hủy</span>
                          </span>
                        )}
                      </td>

                      {/* Hành động */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenViewModal(slip)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                            title="Xem chi tiết phiếu"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {slip.status === 'PENDING' && canApproveTransfer && (
                            <button
                              type="button"
                              onClick={() => handleApproveSlip(slip)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-colors"
                              title="Duyệt phiếu và ghi sổ kho"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Duyệt</span>
                            </button>
                          )}
                        </div>
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
      {/* KHỐI 3: MODAL LẬP PHIẾU CHI TIẾT THEO TỪNG NGHIỆP VỤ (DYNAMIC FORM MODAL) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Lập Phiếu Xuất Nhập Nội Bộ & Kiểm Kê"
        size="3xl"
      >
        <div className="space-y-5 text-xs max-h-[75vh] overflow-y-auto pr-1">
          {/* Header Modal: Chuyển đổi nhanh 4 loại phiếu */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-200 pb-4">
            {Object.values(SLIP_TYPES_CONFIG).map((cfg) => {
              const Icon = cfg.icon;
              const isSelected = selectedCreateType === cfg.key;
              return (
                <button
                  key={cfg.key}
                  type="button"
                  onClick={() => handleChangeModalType(cfg.key)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${isSelected
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`} />
                    <span className="truncate">{cfg.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight truncate">{cfg.subLabel}</p>
                </button>
              );
            })}
          </div>

          {/* Form Context: Ngày, Kho, Chuồng lứa nuôi, Lý do */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Ngày chứng từ */}
            <div>
              <label className="font-bold text-slate-800 block mb-1">Ngày chứng từ *</label>
              <input
                type="date"
                value={createForm.date}
                onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Kho xuất / Nguồn */}
            {selectedCreateType !== 'RETURN_SURPLUS' ? (
              <div>
                <label className="font-bold text-slate-800 block mb-1">Kho xuất hàng *</label>
                <select
                  value={createForm.fromWarehouseId}
                  onChange={(e) => {
                    const nextWhId = Number(e.target.value);
                    const avail = getCatalogForWarehouse(nextWhId, selectedCreateType);
                    setCreateForm((prev) => ({
                      ...prev,
                      fromWarehouseId: nextWhId,
                      items: [buildRowFromCatalog(avail[0] || null, selectedCreateType)],
                    }));
                  }}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  {warehouses.length === 0 ? (
                    <option value="">-- Không có kho thuộc chi nhánh này --</option>
                  ) : (
                    warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              <div>
                <label className="font-bold text-slate-800 block mb-1">Kho nhận hoàn trả *</label>
                <select
                  value={createForm.toWarehouseId}
                  onChange={(e) => setCreateForm({ ...createForm, toWarehouseId: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  {warehouses.length === 0 ? (
                    <option value="">-- Không có kho thuộc chi nhánh này --</option>
                  ) : (
                    warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {/* Nơi nhận / Lứa nuôi áp dụng */}
            {selectedCreateType === 'ISSUE_INTERNAL' && (
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Chuồng & Lứa nuôi áp dụng <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createForm.barnId}
                  onChange={(e) => setCreateForm({ ...createForm, barnId: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  {barnsAndBatches.length === 0 ? (
                    <option value="">-- Không có chuồng thuộc chi nhánh này --</option>
                  ) : (
                    barnsAndBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.barnName} - {b.batchName}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {selectedCreateType === 'RETURN_SURPLUS' && (
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Chuồng hoàn trả thừa <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createForm.barnId}
                  onChange={(e) => setCreateForm({ ...createForm, barnId: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  {barnsAndBatches.length === 0 ? (
                    <option value="">-- Không có chuồng thuộc chi nhánh này --</option>
                  ) : (
                    barnsAndBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.barnName} - {b.batchName}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {selectedCreateType === 'TRANSFER_WAREHOUSE' && (
              <div>
                <label className="font-bold text-slate-800 block mb-1">Kho tiếp nhận *</label>
                <select
                  value={createForm.toWarehouseId}
                  onChange={(e) => setCreateForm({ ...createForm, toWarehouseId: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  {warehouses.filter((w) => w.id !== Number(createForm.fromWarehouseId)).length === 0 ? (
                    <option value="">-- Không có kho khác thuộc chi nhánh --</option>
                  ) : (
                    warehouses.filter((w) => w.id !== Number(createForm.fromWarehouseId)).map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {selectedCreateType === 'STOCKTAKE' && (
              <div>
                <label className="font-bold text-slate-800 block mb-1">Phạm vi kiểm kê</label>
                <input
                  type="text"
                  value="Kiểm kê định kỳ cân bằng kho"
                  readOnly
                  className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 font-semibold"
                />
              </div>
            )}
          </div>

          {/* Ô nhập Lý do / Ghi chú */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">Lý do / Mục đích chứng từ</label>
            <input
              type="text"
              value={createForm.reason}
              onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
              placeholder="VD: Xuất vôi sát trùng chuồng A1 trước khi thả gà, hoàn trả 5 bao cám sau xuất heo..."
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Bảng Chi Tiết Hàng Hóa */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs">
                Danh Sách Hàng Hóa Thực Hiện ({createForm.items.length})
              </h4>
              <Button
                type="button"
                variant="outline"
                size="xs"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={handleAddItemRow}
              >
                + Thêm Mặt Hàng
              </Button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-1/3">Mặt Hàng & Lô Hàng</th>
                    <th className="py-2.5 px-2 text-center">ĐVT</th>
                    {selectedCreateType !== 'STOCKTAKE' ? (
                      <>
                        <th className="py-2.5 px-2 text-center">Tồn Kho</th>
                        <th className="py-2.5 px-3 text-center w-28">Số Lượng</th>
                      </>
                    ) : (
                      <>
                        <th className="py-2.5 px-2 text-center">Tồn Sổ Sách</th>
                        <th className="py-2.5 px-2 text-center w-24">Thực Kiểm</th>
                        <th className="py-2.5 px-2 text-center">Chênh Lệch</th>
                      </>
                    )}
                    {canViewCost && <th className="py-2.5 px-3 text-right">Đơn Giá Vốn</th>}
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {createForm.items.map((row) => (
                    <tr key={row.tempId} className="hover:bg-slate-50/50">
                      {/* Chọn hàng */}
                      <td className="py-2 px-3">
                        <select
                          value={row.itemId || ''}
                          onChange={(e) => handleSelectCatalogItem(row.tempId, e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                        >
                          {(() => {
                            const whForItems = selectedCreateType === 'RETURN_SURPLUS' ? createForm.toWarehouseId : createForm.fromWarehouseId;
                            const avail = getCatalogForWarehouse(whForItems, selectedCreateType);
                            if (avail.length === 0) {
                              return <option value="">-- Kho này chưa có hàng tồn --</option>;
                            }
                            return avail.map((c) => (
                              <option key={c.id} value={c.id}>
                                [{c.sku}] {c.name} ({c.lotCode})
                              </option>
                            ));
                          })()}
                        </select>
                        <div className="text-[10px] text-slate-400 mt-0.5">Lô: {row.lotCode || '-'}</div>
                      </td>

                      {/* ĐVT */}
                      <td className="py-2 px-2 text-center font-semibold text-slate-700">
                        {row.unit}
                      </td>

                      {selectedCreateType !== 'STOCKTAKE' ? (
                        <>
                          {/* Tồn kho hiện tại */}
                          <td className="py-2 px-2 text-center font-bold text-slate-600">
                            {row.currentStock}
                          </td>

                          {/* Số lượng xuất/nhập */}
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={row.quantity}
                              onChange={(e) => handleUpdateQuantity(row.tempId, e.target.value)}
                              className="w-full p-1.5 text-center bg-white border border-slate-300 rounded text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Tồn sổ sách */}
                          <td className="py-2 px-2 text-center font-bold text-slate-600">
                            {row.bookStock}
                          </td>

                          {/* Tồn thực kiểm */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min="0"
                              value={row.actualStock}
                              onChange={(e) => handleUpdateActualStock(row.tempId, e.target.value)}
                              className="w-full p-1.5 text-center bg-white border border-slate-300 rounded text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>

                          {/* Chênh lệch */}
                          <td className="py-2 px-2 text-center">
                            <span
                              className={`font-black font-mono px-2 py-0.5 rounded text-[11px] ${row.difference > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.difference < 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                              {row.difference > 0 ? `+${row.difference}` : row.difference}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Giá vốn (RBAC) */}
                      {canViewCost && (
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-700">
                          {formatCurrency(row.costPrice)}
                        </td>
                      )}

                      {/* Xóa dòng */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(row.tempId)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Xóa dòng"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Modal: 2 Tùy chọn lưu (Lưu nháp gửi duyệt HOẶC Ghi sổ hoàn thành) */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Hủy Bỏ
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSaveSlip('PENDING')}
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                Lưu Nháp / Gửi Duyệt
              </Button>

              {canApproveTransfer && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveSlip('COMPLETED')}
                  className="font-bold"
                >
                  Lưu & Hoàn Thành (Ghi Sổ Kho)
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL XEM CHI TIẾT PHIẾU XUẤT NHẬP NỘI BỘ */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedSlipForView ? `Chi Tiết Phiếu: ${selectedSlipForView.slipCode}` : 'Chi Tiết Phiếu'}
        size="2xl"
      >
        {selectedSlipForView && (
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-500 block text-[11px]">Mã phiếu:</span>
                <span className="font-mono font-black text-slate-900 text-sm">{selectedSlipForView.slipCode}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Ngày lập:</span>
                <span className="font-bold text-slate-800">{formatDate(selectedSlipForView.date)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Loại nghiệp vụ:</span>
                <span className="font-bold text-emerald-800">
                  {SLIP_TYPES_CONFIG[selectedSlipForView.slipType]?.label || selectedSlipForView.slipType}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Trạng thái:</span>
                {selectedSlipForView.status === 'COMPLETED' ? (
                  <span className="font-bold text-emerald-700">Đã ghi sổ kho</span>
                ) : selectedSlipForView.status === 'PENDING' ? (
                  <span className="font-bold text-amber-700">Chờ duyệt</span>
                ) : (
                  <span className="font-bold text-slate-500">Đã hủy</span>
                )}
              </div>
            </div>

            {/* Chi tiết nơi xuất -> nơi nhận */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 w-24">Nơi xuất:</span>
                <span className="font-bold text-slate-900">{selectedSlipForView.fromLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 w-24">Nơi nhận:</span>
                <span className="font-bold text-emerald-800">{selectedSlipForView.toLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 w-24">Lý do:</span>
                <span className="text-slate-700 italic">"{selectedSlipForView.reason}"</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 w-24">Người tạo:</span>
                <span className="text-slate-800">{selectedSlipForView.creatorName}</span>
                {selectedSlipForView.approverName && (
                  <span className="text-slate-400 ml-4">
                    (Người duyệt: {selectedSlipForView.approverName} - {selectedSlipForView.approvedAt})
                  </span>
                )}
              </div>
            </div>

            {/* Bảng mặt hàng */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Tên Hàng & Lô</th>
                    <th className="py-2 px-2 text-center">ĐVT</th>
                    <th className="py-2 px-2 text-center">Số Lượng</th>
                    {canViewCost && (
                      <>
                        <th className="py-2 px-3 text-right">Đơn Giá Vốn</th>
                        <th className="py-2 px-3 text-right">Thành Tiền</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedSlipForView.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-400">SKU: {item.sku} | Lô: {item.lotCode}</div>
                      </td>
                      <td className="py-2 px-2 text-center font-semibold text-slate-600">{item.unit}</td>
                      <td className="py-2 px-2 text-center font-black text-slate-900">
                        {item.quantity || item.actualStock}
                      </td>
                      {canViewCost && (
                        <>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            {formatCurrency(item.costPrice)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(item.amount)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
                {canViewCost && (
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={4} className="py-2 px-3 text-right text-slate-700">Tổng cộng:</td>
                      <td className="py-2 px-3 text-right text-emerald-700 font-black font-mono">
                        {formatCurrency(selectedSlipForView.totalValue)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Footer hành động xem chi tiết */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              {selectedSlipForView.status === 'PENDING' ? (
                <button
                  type="button"
                  onClick={() => handleCancelSlip(selectedSlipForView)}
                  className="text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  Hủy phiếu này
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsViewModalOpen(false)}>
                  Đóng
                </Button>

                {selectedSlipForView.status === 'PENDING' && canApproveTransfer && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    icon={<Check className="h-4 w-4" />}
                    onClick={() => handleApproveSlip(selectedSlipForView)}
                    className="font-bold"
                  >
                    Duyệt Phiếu Ngay
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
