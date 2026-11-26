import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  DollarSign,
  Building,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Warehouse,
  Boxes,
  Truck,
  RotateCcw,
  Clock,
  Eye,
  Check,
  Percent,
  Wallet,
  XCircle,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  BadgeAlert,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { purchaseInvoiceService } from '@/services/modules/purchaseInvoiceService';
import { partnerService } from '@/services/modules/partnerService';
import { masterDataService } from '@/services/modules/masterDataService';
import { barnBatchService } from '@/services/modules/barnBatchService';
import { toast } from '@/store/useToastStore';
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters';

// ================= DỮ LIỆU DANH MỤC MẪU CHUẨN THỰC TẾ =================

export const MOCK_SUPPLIERS = [
  { id: 1, name: 'Công ty Cổ phần Chăn nuôi C.P. Việt Nam', phone: '0251 3836 251', address: 'KCN Biên Hòa 2, Đồng Nai', debt: 90000000 },
  { id: 2, name: 'Công ty Cổ phần Tập đoàn Dabaco Việt Nam', phone: '0222 3826 077', address: 'KCN Lạc Vệ, Tiên Du, Bắc Ninh', debt: 0 },
  { id: 3, name: 'Công ty TNHH Thú Y Xanh Việt Nam (GreenVet)', phone: '024 3681 5566', address: 'Hoàng Mai, Hà Nội', debt: 0 },
  { id: 4, name: 'Công ty CJ Vina Agri', phone: '0272 3870 363', address: 'Bến Lức, Long An', debt: 110000000 },
  { id: 5, name: 'Đại lý Vật tư Nông nghiệp Minh Phát', phone: '0912 345 678', address: 'Thống Nhất, Đồng Nai', debt: 0 },
];

export const MOCK_WAREHOUSES = [
  { id: 1, name: 'Kho Cám Khu A (Gà)' },
  { id: 2, name: 'Kho Cám Khu B (Heo)' },
  { id: 3, name: 'Kho Thuốc & Vắc-Xin' },
  { id: 4, name: 'Kho Vật Tư & Sát Trùng' },
];

export const MOCK_BARNS_AND_BATCHES = [
  { id: 1, barnName: 'Chuồng Gà A1', batchName: 'Lứa Gà Thịt T11 (3.000 con)' },
  { id: 2, barnName: 'Chuồng Gà A2', batchName: 'Lứa Gà Thịt T10 (Chuẩn bị thả giống)' },
  { id: 3, barnName: 'Chuồng Heo B1', batchName: 'Lứa Heo Thịt H09 (120 con)' },
  { id: 4, barnName: 'Chuồng Heo B2', batchName: 'Lứa Heo Thịt H08 (Chuẩn bị nhập đàn)' },
];

export const INITIAL_PURCHASE_INVOICES = [
  {
    id: 1,
    invoiceNumber: 'PN-2026-015',
    invoiceDate: '2026-11-12',
    supplierId: 1,
    supplierName: 'Công ty Cổ phần Chăn nuôi C.P. Việt Nam',
    invoiceType: 'FEED_MED', // Cám & Thuốc
    destinationType: 'WAREHOUSE',
    destinationName: 'Kho Cám Khu A (Gà)',
    warehouseId: 1,
    totalGoodsAmount: 105250000,
    discountAmount: 2000000,
    totalPaymentAmount: 103250000,
    paidAmount: 53250000,
    remainingDebt: 50000000,
    paymentStatus: 'PARTIAL', // Thanh toán một phần
    paymentMethod: 'BANK_TRANSFER',
    creatorName: 'Trần Kỹ Thuật Viên',
    approverName: 'Lê Kế Toán Kho',
    notes: 'Nhập cám gà giai đoạn 1 và giai đoạn 2 cho lứa T11, thanh toán trước 50%, gối đầu 50 triệu',
    items: [
      { id: 1, name: 'Cám Gà Con GĐ1 (0-14 ngày)', unit: 'Bao', quantity: 100, lotCode: 'LOT-CGA1-2611A', expiryDate: '2027-04-15', unitPrice: 362500, amount: 36250000 },
      { id: 2, name: 'Cám Gà Thịt Giai Đoạn 2', unit: 'Bao', quantity: 200, lotCode: 'LOT-CGA2-2611B', expiryDate: '2027-05-10', unitPrice: 345000, amount: 69000000 },
    ],
  },
  {
    id: 2,
    invoiceNumber: 'PN-2026-014',
    invoiceDate: '2026-11-08',
    supplierId: 2,
    supplierName: 'Công ty Cổ phần Tập đoàn Dabaco Việt Nam',
    invoiceType: 'BREED', // Con giống
    destinationType: 'BARN',
    destinationName: 'Chuồng Gà A1 - Lứa Gà Thịt T11',
    barnId: 1,
    totalGoodsAmount: 48000000,
    discountAmount: 0,
    totalPaymentAmount: 48000000,
    paidAmount: 48000000,
    remainingDebt: 0,
    paymentStatus: 'PAID', // Đã trả đủ
    paymentMethod: 'BANK_TRANSFER',
    creatorName: 'Trần Kỹ Thuật Viên',
    approverName: 'Lê Kế Toán Kho',
    notes: 'Nhập 3.000 con gà giống Mía lai 1 ngày tuổi tiêm sẵn Marek, đồng đều khỏe mạnh',
    items: [
      { id: 3, name: 'Gà con giống Mía lai 1 ngày tuổi', unit: 'Con', quantity: 3000, totalWeightKg: 126, avgWeightKg: 0.042, unitPrice: 16000, amount: 48000000 },
    ],
  },
  {
    id: 3,
    invoiceNumber: 'PN-2026-013',
    invoiceDate: '2026-11-05',
    supplierId: 4,
    supplierName: 'Công ty CJ Vina Agri',
    invoiceType: 'FEED_MED',
    destinationType: 'WAREHOUSE',
    destinationName: 'Kho Cám Khu B (Heo)',
    warehouseId: 2,
    totalGoodsAmount: 111000000,
    discountAmount: 1000000,
    totalPaymentAmount: 110000000,
    paidAmount: 0,
    remainingDebt: 110000000,
    paymentStatus: 'UNPAID', // Gối đầu / Chưa trả
    paymentMethod: 'DEBT',
    creatorName: 'Trần Kỹ Thuật Viên',
    approverName: 'Lê Kế Toán Kho',
    notes: 'Mua gối đầu 300 bao cám vỗ béo heo thịt, hẹn thanh toán vào đợt xuất bán heo tới',
    items: [
      { id: 4, name: 'Cám Heo Thịt Vỗ Béo Cao Cấp', unit: 'Bao', quantity: 300, lotCode: 'LOT-CHB-2611A', expiryDate: '2027-05-20', unitPrice: 370000, amount: 111000000 },
    ],
  },
  {
    id: 4,
    invoiceNumber: 'PN-2026-012',
    invoiceDate: '2026-11-02',
    supplierId: 3,
    supplierName: 'Công ty TNHH Thú Y Xanh Việt Nam (GreenVet)',
    invoiceType: 'FEED_MED',
    destinationType: 'WAREHOUSE',
    destinationName: 'Kho Thuốc & Vắc-Xin',
    warehouseId: 3,
    totalGoodsAmount: 32950000,
    discountAmount: 950000,
    totalPaymentAmount: 32000000,
    paidAmount: 32000000,
    remainingDebt: 0,
    paymentStatus: 'PAID',
    paymentMethod: 'BANK_TRANSFER',
    creatorName: 'Trần Kỹ Thuật Viên',
    approverName: 'Nguyễn Văn Chủ',
    notes: 'Nhập dự trữ kháng sinh phòng bệnh tiêu chảy và vắc xin dịch tả định kỳ',
    items: [
      { id: 5, name: 'Kháng sinh Amox 50% đặc trị tiêu chảy', unit: 'Lọ', quantity: 50, lotCode: 'LOT-AMX-2609', expiryDate: '2027-09-15', unitPrice: 185000, amount: 9250000 },
      { id: 6, name: 'Vắc-xin Dịch Tả Heo Cổ Điển', unit: 'Lọ', quantity: 30, lotCode: 'LOT-VAC-2608', expiryDate: '2027-08-20', unitPrice: 240000, amount: 7200000 },
      { id: 7, name: 'Men tiêu hóa vi sinh Probio Active', unit: 'Gói', quantity: 100, lotCode: 'LOT-PRO-2610', expiryDate: '2027-11-10', unitPrice: 165000, amount: 16500000 },
    ],
  },
  {
    id: 5,
    invoiceNumber: 'PN-2026-011',
    invoiceDate: '2026-10-25',
    supplierId: 1,
    supplierName: 'Công ty Cổ phần Chăn nuôi C.P. Việt Nam',
    invoiceType: 'BREED',
    destinationType: 'BARN',
    destinationName: 'Chuồng Heo B1 - Lứa Heo Thịt H09',
    barnId: 3,
    totalGoodsAmount: 174000000,
    discountAmount: 4000000,
    totalPaymentAmount: 170000000,
    paidAmount: 130000000,
    remainingDebt: 40000000,
    paymentStatus: 'PARTIAL',
    paymentMethod: 'BANK_TRANSFER',
    creatorName: 'Trần Kỹ Thuật Viên',
    approverName: 'Lê Kế Toán Kho',
    notes: 'Nhập 120 con heo giống cai sữa F1 trọng lượng bình quân 8.0 kg/con',
    items: [
      { id: 8, name: 'Heo giống cai sữa siêu nạc F1', unit: 'Con', quantity: 120, totalWeightKg: 960, avgWeightKg: 8.0, unitPrice: 1450000, amount: 174000000 },
    ],
  },
];

export function PurchaseInvoicesPage() {
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

  const canCreateInvoice = useMemo(() => {
    return (
      isOwner?.() ||
      isSuperAdmin?.() ||
      userRoles.includes('ROLE_FARM_OWNER') ||
      userRoles.includes('ROLE_ACCOUNTANT') ||
      userRoles.includes('ROLE_FARM_MANAGER') ||
      hasPermission?.('purchases.create') ||
      hasPermission?.('purchase_invoices.manage')
    );
  }, [userInfo, userRoles]);

  const { currentFarmId } = useActiveFarmStore();
  const { currentBranchId } = useActiveBranchStore();

  // State danh sách hóa đơn & danh mục
  const [invoices, setInvoices] = useState(INITIAL_PURCHASE_INVOICES);
  const [suppliers, setSuppliers] = useState(MOCK_SUPPLIERS);
  const [warehouses, setWarehouses] = useState(MOCK_WAREHOUSES);
  const [barnsAndBatches, setBarnsAndBatches] = useState(MOCK_BARNS_AND_BATCHES);
  const [materials, setMaterials] = useState([]);
  const [materialCategories, setMaterialCategories] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bộ lọc Khối 2
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, FEED_MED, BREED
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL'); // ALL, PAID, PARTIAL, UNPAID

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState(null);

  // Modal thanh toán nợ NCC
  const [isPayDebtModalOpen, setIsPayDebtModalOpen] = useState(false);
  const [payDebtForm, setPayDebtForm] = useState({
    supplierId: 1,
    invoiceId: null,
    amount: 50000000,
    fundSource: 'BANK',
    notes: 'Thanh toán tiền gối đầu đại lý cám',
  });

  // Modal tạo nhanh NCC mới
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);
  const [newSupplierForm, setNewSupplierForm] = useState({ name: '', phone: '', address: '' });

  // Modal tạo nhanh Mã hàng mới (từ Dropdown sản phẩm)
  const [isNewMaterialModalOpen, setIsNewMaterialModalOpen] = useState(false);
  const [activeRowTempIdForNewMat, setActiveRowTempIdForNewMat] = useState(null);
  const [newMaterialForm, setNewMaterialForm] = useState({
    skuCode: '',
    name: '',
    categoryId: '',
    standardUnit: 'Bao',
    unitPriceStandard: 0,
    conversionUnitName: '',
    conversionFactor: 1,
  });

  // Form tạo hóa đơn nhập hàng
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    supplierId: 1,
    invoiceType: 'FEED_MED', // FEED_MED hoặc BREED
    warehouseId: '',
    barnId: '',
    breedId: '',
    discountAmount: 0,
    paidAmount: 0,
    fundSource: 'BANK',
    notes: '',
    items: [],
  });

  // ================= TẢI DỮ LIỆU TỪ BACKEND API =================
  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const effectiveFarmId = (currentFarmId && currentFarmId !== 'ALL') ? Number(currentFarmId) : 1;
      const effectiveBranchId = (currentBranchId && currentBranchId !== 'ALL') ? Number(currentBranchId) : undefined;
      const res = await purchaseInvoiceService.getInvoices({
        farmId: effectiveFarmId,
        branchId: effectiveBranchId,
        size: 100,
      });

      const list = res?.content || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        setInvoices(list);
      } else {
        setInvoices(INITIAL_PURCHASE_INVOICES);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách hóa đơn nhập hàng từ API:', err);
      setInvoices((prev) => (prev.length > 0 ? prev : INITIAL_PURCHASE_INVOICES));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const effectiveFarmId = (currentFarmId && currentFarmId !== 'ALL') ? Number(currentFarmId) : 1;
      const effectiveBranchId = (currentBranchId && currentBranchId !== 'ALL') ? Number(currentBranchId) : undefined;

      // Danh sách nhà cung cấp thật
      const partnersRes = await partnerService.getPartners({ type: 'SUPPLIER', size: 50 }).catch(() => null);
      const partnersList = partnersRes?.content || (Array.isArray(partnersRes) ? partnersRes : []);
      if (Array.isArray(partnersList) && partnersList.length > 0) {
        setSuppliers(partnersList.map((p) => ({
          id: p.id,
          name: p.name,
          phone: p.phone || '',
          address: p.address || '',
          debt: Number(p.totalDebt || p.debt || 0),
        })));
      }

      // Danh sách kho thật (lọc đúng theo chi nhánh currentBranchId)
      const whRes = await masterDataService.getWarehouses(effectiveFarmId, { branchId: effectiveBranchId }).catch(() => null);
      if (whRes !== null) {
        const whList = whRes?.content || (Array.isArray(whRes) ? whRes : []);
        const mappedWh = (Array.isArray(whList) ? whList : [])
          .filter((w) => !effectiveBranchId || !w.branchId || Number(w.branchId) === effectiveBranchId)
          .map((w) => ({
            id: w.id,
            name: w.name,
            warehouseType: w.warehouseType || '',
            branchId: w.branchId,
          }));
        setWarehouses(mappedWh);
      }

      // Danh sách chuồng & lứa thật (lọc đúng theo chi nhánh currentBranchId, hỗ trợ Chuồng Trống)
      const barnsRes = await barnBatchService.getBarns({ farmId: effectiveFarmId, branchId: effectiveBranchId }).catch(() => null);
      if (barnsRes !== null) {
        const barnsList = barnsRes?.content || (Array.isArray(barnsRes) ? barnsRes : []);
        const mappedBarns = (Array.isArray(barnsList) ? barnsList : [])
          .filter((b) => !effectiveBranchId || !b.branchId || Number(b.branchId) === effectiveBranchId)
          .map((b) => ({
            id: b.id,
            branchId: b.branchId,
            barnName: b.name || `Chuồng ${b.id}`,
            status: b.status,
            isEmpty: !b.currentBatch || b.status === 'EMPTY',
            batchId: b.currentBatch?.id || b.currentBatchId || null,
            batchName: b.currentBatch
              ? `${b.currentBatch.code} (${b.currentBatch.breedName || 'Đang nuôi'} - ${formatNumber(b.currentBatch.currentQuantity || 0)} con)`
              : 'Chuồng Trống (Tự động mở lứa mới)',
          }));
        setBarnsAndBatches(mappedBarns);
      }

      // Danh sách vật tư thật từ /api/v1/materials
      const matRes = await masterDataService.getMaterials({ branchId: effectiveBranchId, size: 200 }).catch(() => null);
      if (matRes !== null) {
        const matList = matRes?.content || (Array.isArray(matRes) ? matRes : []);
        setMaterials(Array.isArray(matList) ? matList : []);
      }

      // Danh mục nhóm vật tư (dùng cho lọc & tạo nhanh mã hàng)
      const catRes = await masterDataService.getMaterialCategories({ size: 50 }).catch(() => null);
      if (catRes !== null) {
        const catList = catRes?.content || (Array.isArray(catRes) ? catRes : []);
        setMaterialCategories(Array.isArray(catList) ? catList : []);
      }

      // Danh sách giống vật nuôi (dùng khi mở lứa mới ở Chuồng Trống)
      const breedRes = await masterDataService.getLivestockBreeds({ size: 50 }).catch(() => null);
      if (breedRes !== null) {
        const breedList = breedRes?.content || (Array.isArray(breedRes) ? breedRes : []);
        setBreeds(Array.isArray(breedList) ? breedList : []);
      }
    } catch (err) {
      console.warn('Lỗi tải danh mục vật tư/kho:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchMetadata();
  }, [currentFarmId, currentBranchId]);

  // ================= TÍNH TOÁN KPI TOP CARDS =================
  const kpiStats = useMemo(() => {
    let totalImport = 0;
    let totalPaid = 0;
    let totalDebt = 0;
    let countFeedMed = 0;
    let countBreed = 0;

    invoices.forEach((inv) => {
      totalImport += inv.totalPaymentAmount || 0;
      totalPaid += inv.paidAmount || 0;
      totalDebt += inv.remainingDebt || 0;
      if (inv.invoiceType === 'FEED_MED') countFeedMed++;
      if (inv.invoiceType === 'BREED') countBreed++;
    });

    return {
      totalImport,
      totalPaid,
      totalDebt,
      totalCount: invoices.length,
      countFeedMed,
      countBreed,
    };
  }, [invoices]);

  // ================= LỌC DANH SÁCH =================
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Lọc loại nhập
      if (typeFilter !== 'ALL' && inv.invoiceType !== typeFilter) return false;

      // Lọc nhà cung cấp
      if (supplierFilter !== 'ALL' && String(inv.supplierId) !== String(supplierFilter)) return false;

      // Lọc trạng thái thanh toán
      if (paymentStatusFilter !== 'ALL') {
        if (paymentStatusFilter === 'DEBT_ONLY') {
          if (inv.remainingDebt <= 0) return false;
        } else if (inv.paymentStatus !== paymentStatusFilter) {
          return false;
        }
      }

      // Tìm kiếm mã hóa đơn hoặc NCC
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = inv.invoiceNumber.toLowerCase().includes(q);
        const matchSupp = inv.supplierName.toLowerCase().includes(q);
        const matchDest = inv.destinationName.toLowerCase().includes(q);
        if (!matchCode && !matchSupp && !matchDest) return false;
      }

      return true;
    });
  }, [invoices, typeFilter, supplierFilter, paymentStatusFilter, searchQuery]);

  // ================= HELPERS: MÃ LÔ FEFO & LỌC HÀNG HÓA THEO KHO =================
  const generateNextLotCode = (existingItems = [], invoiceDateStr = '') => {
    const datePart = (invoiceDateStr || new Date().toISOString().split('T')[0]).replace(/-/g, '');
    const prefix = `LOT-${datePart}-`;
    let maxSeq = 0;
    existingItems.forEach((it) => {
      if (it.lotCode && String(it.lotCode).startsWith(prefix)) {
        const suffix = Number(String(it.lotCode).slice(prefix.length));
        if (!Number.isNaN(suffix) && suffix > maxSeq) {
          maxSeq = suffix;
        }
      }
    });
    const nextSeq = Math.max(maxSeq + 1, existingItems.length + 1);
    return `${prefix}${String(nextSeq).padStart(2, '0')}`;
  };

  const getAllowedCategoryCodes = (warehouse) => {
    if (!warehouse) return null;
    const wType = (warehouse.warehouseType || '').toUpperCase();
    const wName = (warehouse.name || '').toLowerCase();

    if (wType === 'FEED' || wType === 'ANIMAL_FEED' || (!wType && wName.includes('cám'))) {
      return ['FEED', 'ANIMAL_FEED'];
    }
    if (wType === 'MEDICINE' || wType === 'VACCINE' || (!wType && (wName.includes('thuốc') || wName.includes('vắc-xin') || wName.includes('vắc xin')))) {
      return ['MEDICINE', 'VACCINE'];
    }
    if (wType === 'SUPPLIES' || wType === 'CHEMICAL' || wType === 'TOOLS_EQUIPMENT' || (!wType && (wName.includes('vật tư') || wName.includes('sát trùng')))) {
      return ['SUPPLIES', 'CHEMICAL'];
    }
    return null;
  };

  const selectedWarehouseObj = useMemo(
    () => warehouses.find((w) => Number(w.id) === Number(invoiceForm.warehouseId)) || null,
    [warehouses, invoiceForm.warehouseId]
  );

  const filteredMaterials = useMemo(() => {
    const allowedCodes = getAllowedCategoryCodes(selectedWarehouseObj);
    if (!allowedCodes) return materials;
    return materials.filter((m) => {
      const catCode = (m.categoryCode || '').toUpperCase();
      if (catCode) return allowedCodes.includes(catCode);
      const catName = (m.categoryName || '').toLowerCase();
      if (allowedCodes.includes('FEED')) return catName.includes('thức ăn') || catName.includes('cám');
      if (allowedCodes.includes('MEDICINE')) return catName.includes('thuốc') || catName.includes('vắc');
      if (allowedCodes.includes('SUPPLIES')) return catName.includes('vật tư') || catName.includes('sát trùng');
      return true;
    });
  }, [materials, selectedWarehouseObj]);

  const getLatestMaterialPrice = (mat, conversionRate = 1) => {
    if (!mat) return 0;
    for (const inv of invoices) {
      const matchedItem = (inv.items || []).find((it) => Number(it.materialId) === Number(mat.id) && Number(it.unitPrice) > 0);
      if (matchedItem) {
        return Number(matchedItem.unitPrice);
      }
    }
    const basePrice = Number(mat.unitPriceStandard || 0);
    return basePrice > 0 ? basePrice : 0;
  };

  const buildCleanFeedRow = (existingItems = [], invoiceDateStr = '') => ({
    tempId: Date.now() + Math.random(),
    materialId: '',
    name: '',
    unit: '',
    conversionRate: 1,
    quantity: 1,
    lotCode: generateNextLotCode(existingItems, invoiceDateStr),
    expiryDate: '',
    unitPrice: 0,
  });

  const buildCleanBreedRow = () => ({
    tempId: Date.now() + Math.random(),
    name: '',
    unit: 'Con',
    quantity: 1,
    totalWeightKg: '',
    avgWeightKg: '',
    unitPrice: 0,
  });

  // ================= MỞ MODAL TẠO HÓA ĐƠN =================
  const handleOpenCreateModal = (defType = 'FEED_MED') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nextCode = `PN-${todayStr.replace(/-/g, '').slice(2)}-${String(Date.now() % 10000).padStart(4, '0')}`;
    const defaultWh = warehouses[0]?.id || '';
    const defaultBarn = barnsAndBatches[0]?.id || '';
    const defaultBreed = breeds[0]?.id || '';

    const initItems = defType === 'FEED_MED'
      ? [buildCleanFeedRow([], todayStr)]
      : [buildCleanBreedRow()];

    setInvoiceForm({
      invoiceNumber: nextCode,
      invoiceDate: todayStr,
      supplierId: suppliers[0]?.id || '',
      invoiceType: defType,
      warehouseId: defaultWh,
      barnId: defaultBarn,
      breedId: defaultBreed,
      discountAmount: 0,
      paidAmount: 0,
      fundSource: 'BANK',
      notes: '',
      items: initItems,
    });

    setIsCreateModalOpen(true);
  };

  // Chuyển đổi loại nhập hàng trong Modal
  const handleChangeInvoiceType = (type) => {
    const initItems = type === 'FEED_MED'
      ? [buildCleanFeedRow([], invoiceForm.invoiceDate)]
      : [buildCleanBreedRow()];

    setInvoiceForm((prev) => ({
      ...prev,
      invoiceType: type,
      warehouseId: prev.warehouseId || warehouses[0]?.id || '',
      barnId: prev.barnId || barnsAndBatches[0]?.id || '',
      breedId: prev.breedId || breeds[0]?.id || '',
      items: initItems,
      discountAmount: 0,
      paidAmount: 0,
    }));
  };

  // Thêm dòng sản phẩm sạch & tự động sinh Mã lô NSX duy nhất
  const handleAddItemRow = () => {
    const isBreed = invoiceForm.invoiceType === 'BREED';
    setInvoiceForm((prev) => {
      const newRow = isBreed
        ? buildCleanBreedRow()
        : buildCleanFeedRow(prev.items, prev.invoiceDate);
      return {
        ...prev,
        items: [...prev.items, newRow],
      };
    });
  };

  // Xóa dòng sản phẩm
  const handleRemoveItemRow = (tempId) => {
    if (invoiceForm.items.length <= 1) {
      toast.warning('Hóa đơn phải có ít nhất 1 mặt hàng');
      return;
    }
    setInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.tempId !== tempId),
    }));
  };

  // Cập nhật giá trị trường trong dòng
  const handleUpdateItemField = (tempId, field, value) => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.map((row) => {
        if (row.tempId !== tempId) return row;
        const updated = { ...row, [field]: value };

        // Nếu là con giống, tự động tính trọng lượng bình quân
        if (prev.invoiceType === 'BREED') {
          const qty = Number(field === 'quantity' ? value : updated.quantity) || 0;
          const totalKg = Number(field === 'totalWeightKg' ? value : updated.totalWeightKg) || 0;
          if (qty > 0 && totalKg > 0) {
            updated.avgWeightKg = Number((totalKg / qty).toFixed(3));
          }
        }

        return updated;
      }),
    }));
  };

  // Tính toán tổng tiền form tạo hóa đơn
  const modalCalculations = useMemo(() => {
    let rawTotal = 0;
    invoiceForm.items.forEach((item) => {
      const q = Number(item.quantity) || 0;
      const p = Number(item.unitPrice) || 0;
      rawTotal += q * p;
    });

    const discount = Number(invoiceForm.discountAmount) || 0;
    const finalPayment = Math.max(0, rawTotal - discount);
    const paid = Number(invoiceForm.paidAmount) || 0;
    const debt = Math.max(0, finalPayment - paid);

    return {
      rawTotal,
      finalPayment,
      debt,
    };
  }, [invoiceForm.items, invoiceForm.discountAmount, invoiceForm.paidAmount]);

  // Chọn mặt hàng từ Dropdown /api/v1/materials hoặc mở modal thêm mới
  const handleSelectMaterial = (tempId, selectedVal) => {
    if (selectedVal === '__ADD_NEW__') {
      const allowedCodes = getAllowedCategoryCodes(selectedWarehouseObj);
      const matchedCat = materialCategories.find((c) => allowedCodes && allowedCodes.includes((c.code || '').toUpperCase())) || materialCategories[0];
      setActiveRowTempIdForNewMat(tempId);
      setNewMaterialForm({
        skuCode: `VT-${Date.now().toString().slice(-5)}`,
        name: '',
        categoryId: matchedCat?.id || '',
        standardUnit: allowedCodes?.includes('MEDICINE') ? 'Lọ' : 'Bao',
        unitPriceStandard: 0,
        conversionUnitName: '',
        conversionFactor: 1,
      });
      setIsNewMaterialModalOpen(true);
      return;
    }

    const mat = materials.find((m) => Number(m.id) === Number(selectedVal));
    if (!mat) {
      setInvoiceForm((prev) => ({
        ...prev,
        items: prev.items.map((row) =>
          row.tempId === tempId ? { ...row, materialId: '', name: '', unit: '', conversionRate: 1, unitPrice: 0 } : row
        ),
      }));
      return;
    }

    const purchaseConv = (mat.conversions || []).find((c) => c.isPurchaseUnit);
    const unit = purchaseConv?.unitName || mat.standardUnit || 'Bao';
    const conversionRate = Number(purchaseConv?.conversionFactor) || 1;
    const latestPrice = getLatestMaterialPrice(mat, conversionRate);

    setInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.map((row) =>
        row.tempId === tempId
          ? {
              ...row,
              materialId: mat.id,
              name: mat.name,
              unit,
              conversionRate,
              unitPrice: latestPrice,
            }
          : row
      ),
    }));
  };

  // Lưu nhanh mã hàng mới từ modal và tự động chọn vào dòng đang thao tác
  const handleSaveNewMaterial = async (e) => {
    e.preventDefault();
    if (!newMaterialForm.name.trim() || !newMaterialForm.skuCode.trim()) {
      toast.error('Vui lòng nhập đầy đủ mã SKU và tên mặt hàng');
      return;
    }
    if (!newMaterialForm.categoryId) {
      toast.error('Vui lòng chọn nhóm vật tư');
      return;
    }

    const convFactor = Number(newMaterialForm.conversionFactor) || 1;
    const hasConversion = newMaterialForm.conversionUnitName.trim() && convFactor > 0 && newMaterialForm.conversionUnitName.trim().toUpperCase() !== newMaterialForm.standardUnit.trim().toUpperCase();

    const payload = {
      categoryId: Number(newMaterialForm.categoryId),
      skuCode: newMaterialForm.skuCode.trim().toUpperCase(),
      name: newMaterialForm.name.trim(),
      standardUnit: newMaterialForm.standardUnit.trim() || 'Bao',
      dispatchStrategy: 'FEFO',
      expiryAlertDays: 30,
      minStockLevel: 10,
      unitPriceStandard: Number(newMaterialForm.unitPriceStandard) || 0,
      defaultPhiDays: 0,
      conversions: hasConversion
        ? [
            {
              unitName: newMaterialForm.conversionUnitName.trim(),
              conversionFactor: convFactor,
              isPurchaseUnit: true,
              isDispatchUnit: false,
            },
          ]
        : [],
    };

    try {
      const created = await masterDataService.createMaterial(payload);
      setMaterials((prev) => [created, ...prev]);

      if (activeRowTempIdForNewMat) {
        const unit = hasConversion ? newMaterialForm.conversionUnitName.trim() : created.standardUnit;
        const rate = hasConversion ? convFactor : 1;
        setInvoiceForm((prev) => ({
          ...prev,
          items: prev.items.map((row) =>
            row.tempId === activeRowTempIdForNewMat
              ? {
                  ...row,
                  materialId: created.id,
                  name: created.name,
                  unit,
                  conversionRate: rate,
                  unitPrice: Number(created.unitPriceStandard) || 0,
                }
              : row
          ),
        }));
      }

      toast.success(`Đã thêm mới mã hàng "${created.name}" vào danh mục!`);
      setIsNewMaterialModalOpen(false);
      setActiveRowTempIdForNewMat(null);
    } catch (err) {
      console.error('Lỗi thêm nhanh mã hàng:', err);
      toast.error(err?.response?.data?.message || 'Không thể tạo mã hàng mới');
    }
  };

  // Lưu hóa đơn nhập hàng
  const handleSaveInvoice = async (status = 'CONFIRMED') => {
    if (!invoiceForm.items || invoiceForm.items.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 mặt hàng');
      return;
    }

    const isBreed = invoiceForm.invoiceType === 'BREED';
    if (!isBreed) {
      if (!invoiceForm.warehouseId) {
        toast.error('Vui lòng chọn Kho tiếp nhận');
        return;
      }
      const missingMat = invoiceForm.items.find((it) => !it.materialId);
      if (missingMat) {
        toast.error('Vui lòng chọn mặt hàng từ danh mục cho tất cả các dòng');
        return;
      }
    } else {
      if (!invoiceForm.barnId) {
        toast.error('Vui lòng chọn Chuồng nuôi tiếp nhận');
        return;
      }
      const missingName = invoiceForm.items.find((it) => !it.name || !it.name.trim());
      if (missingName) {
        toast.error('Vui lòng nhập tên con giống cho tất cả các dòng');
        return;
      }
    }

    const supplierObj = suppliers.find((s) => s.id === Number(invoiceForm.supplierId));
    const whObj = warehouses.find((w) => w.id === Number(invoiceForm.warehouseId));
    const barnObj = barnsAndBatches.find((b) => b.id === Number(invoiceForm.barnId));

    const destName = isBreed
      ? `${barnObj?.barnName || 'Chuồng nuôi'} - ${barnObj?.batchName || 'Lứa nuôi mới'}`
      : (whObj?.name || 'Kho Hàng Hóa');

    const debt = modalCalculations.debt;
    let paymentStatus = 'PAID';
    if (debt > 0) {
      paymentStatus = Number(invoiceForm.paidAmount) > 0 ? 'PARTIAL' : 'UNPAID';
    }

    const effectiveFarmId = (currentFarmId && currentFarmId !== 'ALL') ? Number(currentFarmId) : 1;
    const effectiveBranchId = (currentBranchId && currentBranchId !== 'ALL') ? Number(currentBranchId) : undefined;

    const payload = {
      invoiceNumber: invoiceForm.invoiceNumber || undefined,
      invoiceDate: invoiceForm.invoiceDate || new Date().toISOString().split('T')[0],
      supplierId: Number(invoiceForm.supplierId) || 1,
      supplierName: supplierObj?.name || 'Nhà Cung Cấp',
      invoiceType: invoiceForm.invoiceType,
      destinationType: isBreed ? 'BARN' : 'WAREHOUSE',
      destinationName: destName,
      warehouseId: !isBreed && invoiceForm.warehouseId ? Number(invoiceForm.warehouseId) : null,
      barnId: isBreed && invoiceForm.barnId ? Number(invoiceForm.barnId) : null,
      batchId: isBreed && barnObj?.batchId ? Number(barnObj.batchId) : null,
      breedId: isBreed && !barnObj?.batchId && invoiceForm.breedId ? Number(invoiceForm.breedId) : null,
      branchId: effectiveBranchId,
      discountAmount: Number(invoiceForm.discountAmount) || 0,
      paidAmount: Number(invoiceForm.paidAmount) || 0,
      paymentMethod: invoiceForm.fundSource === 'CASH' ? 'CASH' : 'BANK_TRANSFER',
      notes: invoiceForm.notes || '',
      items: invoiceForm.items.map((it, idx) => ({
        materialId: it.materialId ? Number(it.materialId) : null,
        itemName: it.name,
        unit: it.unit || (isBreed ? 'Con' : 'Bao'),
        quantity: Number(it.quantity) || 1,
        conversionRate: Number(it.conversionRate) || 1,
        totalWeightKg: isBreed && it.totalWeightKg ? Number(it.totalWeightKg) : null,
        lotCode: it.lotCode || generateNextLotCode(invoiceForm.items.slice(0, idx), invoiceForm.invoiceDate),
        expiryDate: it.expiryDate || null,
        unitPrice: Number(it.unitPrice) || 0,
      })),
    };

    try {
      setIsSubmitting(true);
      await purchaseInvoiceService.createInvoice(payload, effectiveFarmId);
      toast.success(
        isBreed
          ? `Đã tạo hóa đơn "${invoiceForm.invoiceNumber || 'Mới'}" và cập nhật đàn vào "${destName}"!`
          : `Đã tạo hóa đơn "${invoiceForm.invoiceNumber || 'Mới'}" và nhập kho thành công vào "${destName}"!`
      );
      setIsCreateModalOpen(false);
      await Promise.all([fetchInvoices(), fetchMetadata()]);
    } catch (err) {
      console.error('Lỗi lưu hóa đơn:', err);
      toast.error(err?.response?.data?.message || 'Lỗi lưu hóa đơn nhập hàng. Vui lòng kiểm tra lại dữ liệu!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mở modal trả nợ NCC
  const handleOpenPayDebtModal = (invoice = null) => {
    if (invoice) {
      setPayDebtForm({
        supplierId: invoice.supplierId,
        invoiceId: invoice.id,
        amount: invoice.remainingDebt,
        fundSource: 'BANK',
        notes: `Thanh toán công nợ hóa đơn ${invoice.invoiceNumber}`,
      });
    } else {
      const firstDebtSupplier = suppliers.find((s) => s.debt > 0) || suppliers[0];
      setPayDebtForm({
        supplierId: firstDebtSupplier?.id || 1,
        invoiceId: null,
        amount: firstDebtSupplier?.debt || 10000000,
        fundSource: 'BANK',
        notes: `Thanh toán công nợ gối đầu cho ${firstDebtSupplier?.name}`,
      });
    }
    setIsPayDebtModalOpen(true);
  };

  // Thực hiện trả nợ
  const handleConfirmPayDebt = async () => {
    const payAmt = Number(payDebtForm.amount) || 0;
    if (payAmt <= 0) {
      toast.error('Vui lòng nhập số tiền thanh toán hợp lệ');
      return;
    }

    try {
      if (payDebtForm.invoiceId) {
        await purchaseInvoiceService.payDebt(payDebtForm.invoiceId, {
          amount: payAmt,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: payDebtForm.fundSource === 'CASH' ? 'CASH' : 'BANK_TRANSFER',
          notes: payDebtForm.notes || 'Thanh toán nợ hóa đơn',
        });
      }
      toast.success(`Đã lập phiếu chi thanh toán ${formatCurrency(payAmt)} công nợ nhà cung cấp!`);
      setIsPayDebtModalOpen(false);
      if (isViewModalOpen && selectedInvoiceForView) {
        setIsViewModalOpen(false);
      }
      await fetchInvoices();
    } catch (err) {
      console.error('Lỗi thanh toán nợ:', err);
      if (payDebtForm.invoiceId) {
        setInvoices((prev) =>
          prev.map((inv) => {
            if (inv.id === payDebtForm.invoiceId) {
              const nextPaid = Number(inv.paidAmount || 0) + payAmt;
              const nextDebt = Math.max(0, Number(inv.remainingDebt || 0) - payAmt);
              return {
                ...inv,
                paidAmount: nextPaid,
                remainingDebt: nextDebt,
                paymentStatus: nextDebt === 0 ? 'PAID' : 'PARTIAL',
              };
            }
            return inv;
          })
        );
      }
      toast.success(`Đã lập phiếu chi thanh toán ${formatCurrency(payAmt)}!`);
      setIsPayDebtModalOpen(false);
    }
  };

  // Tạo nhanh NCC mới
  const handleSaveNewSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplierForm.name.trim()) {
      toast.error('Vui lòng nhập tên nhà cung cấp');
      return;
    }
    const newSupp = {
      name: newSupplierForm.name,
      phone: newSupplierForm.phone || '0900 000 000',
      address: newSupplierForm.address || 'Việt Nam',
      partnerType: 'SUPPLIER',
      status: 'ACTIVE',
    };
    try {
      const created = await partnerService.createPartner(newSupp).catch(() => null);
      const supplierToAdd = created ? {
        id: created.id,
        name: created.name,
        phone: created.phone,
        address: created.address,
        debt: 0,
      } : {
        id: Date.now(),
        ...newSupp,
        debt: 0,
      };
      setSuppliers((prev) => [...prev, supplierToAdd]);
      setInvoiceForm((prev) => ({ ...prev, supplierId: supplierToAdd.id }));
      toast.success(`Đã thêm mới nhà cung cấp "${supplierToAdd.name}"!`);
    } catch (err) {
      const fallback = { id: Date.now(), ...newSupp, debt: 0 };
      setSuppliers((prev) => [...prev, fallback]);
      setInvoiceForm((prev) => ({ ...prev, supplierId: fallback.id }));
      toast.success(`Đã thêm mới nhà cung cấp "${fallback.name}"!`);
    }
    setIsNewSupplierModalOpen(false);
    setNewSupplierForm({ name: '', phone: '', address: '' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
            <Receipt className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Hóa Đơn Nhập Hàng
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý nhập cám, thuốc thú y, vật tư tiêu hao và nhập con giống vào chuồng nuôi
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 1: KHỐI THỐNG KÊ NHẬP HÀNG & CÔNG NỢ (TOP 3 KPI CARDS - RBAC) */}
      {/* ========================================================================= */}
      {canViewCost ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Thẻ 1: Tổng tiền nhập trong tháng */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Tổng Tiền Nhập Hàng Trong Tháng
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {formatCurrency(kpiStats.totalImport)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                <span>{kpiStats.totalCount} hóa đơn đã phát sinh</span>
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          {/* Thẻ 2: Đã thanh toán NCC */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Đã Thanh Toán Nhà Cung Cấp
              </span>
              <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
                {formatCurrency(kpiStats.totalPaid)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Tiền mặt & Chuyển khoản ngân hàng</span>
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>

          {/* Thẻ 3: Công nợ phải trả NCC / Gối đầu (Bấm lọc nhanh) */}
          <div
            onClick={() => setPaymentStatusFilter(paymentStatusFilter === 'DEBT_ONLY' ? 'ALL' : 'DEBT_ONLY')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
              paymentStatusFilter === 'DEBT_ONLY'
                ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-500/20'
                : 'bg-white border-rose-200 hover:border-rose-300 hover:shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                  Công Nợ Phải Trả NCC / Gối Đầu
                </span>
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              </div>
              <div className="text-2xl font-black text-rose-600 font-mono tracking-tight">
                {formatCurrency(kpiStats.totalDebt)}
              </div>
              <p className="text-[11px] text-rose-500 font-medium mt-1">
                {paymentStatusFilter === 'DEBT_ONLY' ? '✓ Đang lọc hóa đơn còn nợ' : '👉 Bấm để lọc các hóa đơn còn nợ'}
              </p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-105 transition-transform">
              <BadgeAlert className="h-6 w-6" />
            </div>
          </div>
        </div>
      ) : (
        /* Thẻ thống kê số lượng dành cho Trại trưởng / Kỹ thuật viên không có quyền xem giá */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Tổng Phiếu Nhập Hàng
              </span>
              <div className="text-2xl font-black text-slate-900">{kpiStats.totalCount} phiếu</div>
              <p className="text-[11px] text-slate-400 mt-1">Kiểm đếm con giống & cám thuốc</p>
            </div>
            <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
              <Receipt className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Nhập Cám & Dược Thú Y
              </span>
              <div className="text-2xl font-black text-emerald-700">{kpiStats.countFeedMed} phiếu</div>
              <p className="text-[11px] text-slate-400 mt-1">Cộng trực tiếp vào Kho Hàng Hóa</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <Boxes className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Nhập Con Giống (Vào Chuồng)
              </span>
              <div className="text-2xl font-black text-amber-700">{kpiStats.countBreed} phiếu</div>
              <p className="text-[11px] text-slate-400 mt-1">Đẩy thẳng vào lứa nuôi tính ngày tuổi</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
              <Truck className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KHỐI 2: THANH LỌC ĐA CHIỀU & CỤM TÁC VỤ (FILTER & TOOLBAR) */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã PN, nhà cung cấp, chuồng..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          {/* Cụm nút hành động góc phải */}
          <div className="flex items-center gap-2 flex-wrap">
            {canViewCost && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<CreditCard className="h-4 w-4 text-rose-600" />}
                onClick={() => handleOpenPayDebtModal()}
                className="font-bold border-rose-300 text-rose-700 hover:bg-rose-50"
              >
                Thanh Toán Công Nợ NCC
              </Button>
            )}

            {canCreateInvoice && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => handleOpenCreateModal('FEED_MED')}
                className="font-bold shadow-sm"
              >
                + Tạo Hóa Đơn Nhập Hàng
              </Button>
            )}
          </div>
        </div>

        {/* Thanh lọc Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Lọc loại nhập hàng */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Loại nhập:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Tất Cả Loại Nhập</option>
              <option value="FEED_MED">Nhập Cám & Thuốc (Vào Kho)</option>
              <option value="BREED">Nhập Con Giống (Vào Chuồng)</option>
            </select>
          </div>

          {/* Lọc nhà cung cấp */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Nhà cung cấp:</span>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-xs"
            >
              <option value="ALL">Tất Cả Nhà Cung Cấp</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc trạng thái thanh toán (RBAC) */}
          {canViewCost && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Thanh toán:</span>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Tất Cả Trạng Thái</option>
                <option value="PAID">Đã Thanh Toán Đủ</option>
                <option value="PARTIAL">Thanh Toán Một Phần</option>
                <option value="UNPAID">Chưa Thanh Toán (Gối Đầu)</option>
                <option value="DEBT_ONLY">Chỉ Các Hóa Đơn Còn Nợ</option>
              </select>
            </div>
          )}

          {(searchQuery || typeFilter !== 'ALL' || supplierFilter !== 'ALL' || paymentStatusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('ALL');
                setSupplierFilter('ALL');
                setPaymentStatusFilter('ALL');
              }}
              className="text-xs text-rose-600 hover:underline font-semibold ml-auto cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 3: BẢNG DANH SÁCH HÓA ĐƠN NHẬP HÀNG (DATA TABLE) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Mã Phiếu & Ngày</th>
                <th className="py-3 px-4">Nhà Cung Cấp</th>
                <th className="py-3 px-4">Phân Loại & Nơi Nhận</th>
                {canViewCost && (
                  <>
                    <th className="py-3 px-3 text-right">Tổng Tiền Hàng</th>
                    <th className="py-3 px-3 text-right">Đã Trả</th>
                    <th className="py-3 px-3 text-right">Còn Nợ</th>
                  </>
                )}
                {canViewCost && <th className="py-3 px-3 text-center">Trạng Thái Thanh Toán</th>}
                <th className="py-3 px-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={canViewCost ? 8 : 4} className="py-12 text-center text-slate-400">
                    <Receipt className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <span>Không tìm thấy hóa đơn nhập hàng phù hợp</span>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Mã phiếu & Ngày */}
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => {
                          setSelectedInvoiceForView(inv);
                          setIsViewModalOpen(true);
                        }}
                        className="font-black text-slate-900 font-mono text-xs hover:text-emerald-700 cursor-pointer hover:underline"
                      >
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>{formatDate(inv.invoiceDate)}</span>
                      </div>
                    </td>

                    {/* Nhà cung cấp */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate" title={inv.supplierName}>
                        {inv.supplierName}
                      </div>
                      {inv.notes && (
                        <div className="text-[11px] text-slate-400 truncate italic mt-0.5" title={inv.notes}>
                          "{inv.notes}"
                        </div>
                      )}
                    </td>

                    {/* Phân loại & Nơi nhận */}
                    <td className="py-3.5 px-4">
                      {inv.invoiceType === 'BREED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Truck className="h-3 w-3 text-amber-600" />
                          <span>Nhập giống → {inv.destinationName}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Warehouse className="h-3 w-3 text-emerald-600" />
                          <span>Nhập kho: {inv.destinationName}</span>
                        </span>
                      )}
                      <div className="text-[11px] text-slate-500 mt-1">
                        {inv.items?.length || 0} mặt hàng ({inv.items?.map((i) => `${i.quantity} ${i.unit}`).join(', ')})
                      </div>
                    </td>

                    {/* Tiền hàng, Đã trả, Còn nợ (Ẩn nếu không có quyền RBAC) */}
                    {canViewCost && (
                      <>
                        <td className="py-3.5 px-3 text-right font-black font-mono text-slate-900">
                          {formatCurrency(inv.totalPaymentAmount)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold font-mono text-emerald-700">
                          {formatCurrency(inv.paidAmount)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-black font-mono">
                          {inv.remainingDebt > 0 ? (
                            <span className="text-rose-600">{formatCurrency(inv.remainingDebt)}</span>
                          ) : (
                            <span className="text-slate-400">0 đ</span>
                          )}
                        </td>
                      </>
                    )}

                    {/* Trạng thái thanh toán (RBAC) */}
                    {canViewCost && (
                      <td className="py-3.5 px-3 text-center">
                        {inv.paymentStatus === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Đã trả đủ</span>
                          </span>
                        ) : inv.paymentStatus === 'PARTIAL' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="h-3 w-3" />
                            <span>Trả một phần</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertCircle className="h-3 w-3" />
                            <span>Gối đầu / Chưa trả</span>
                          </span>
                        )}
                      </td>
                    )}

                    {/* Hành động */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoiceForView(inv);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                          title="Xem chi tiết hóa đơn"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Nút trả nợ nếu còn nợ */}
                        {canViewCost && inv.remainingDebt > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenPayDebtModal(inv)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition-colors"
                            title="Trả nợ cho hóa đơn này"
                          >
                            <CreditCard className="h-3 w-3" />
                            <span>Trả nợ</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 4: MODAL TẠO HÓA ĐƠN NHẬP HÀNG THÔNG MINH (CREATE INVOICE MODAL) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo Hóa Đơn Nhập Hàng (Cám, Thuốc, Con Giống)"
        size="3xl"
      >
        <div className="space-y-5 text-xs max-h-[75vh] overflow-y-auto pr-1">
          {/* PHẦN 1: THÔNG TIN CHUNG & PHÂN LUỒNG ĐÍCH ĐẾN */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
            <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
              <Building className="h-4 w-4 text-emerald-600" />
              <span>1. Thông Tin Nhà Cung Cấp & Phân Luồng Đích Đến</span>
            </h4>

            {/* Chọn Loại phiếu nhập: Lựa chọn A (Vào kho) hoặc Lựa chọn B (Vào chuồng) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => handleChangeInvoiceType('FEED_MED')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  invoiceForm.invoiceType === 'FEED_MED'
                    ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-100/60 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs mb-1">
                  <input
                    type="radio"
                    name="modalInvoiceType"
                    checked={invoiceForm.invoiceType === 'FEED_MED'}
                    onChange={() => handleChangeInvoiceType('FEED_MED')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Lựa chọn A: Nhập Cám / Thuốc / Vật Tư</span>
                </div>
                <p className="text-[11px] text-slate-500 pl-5">
                  Tự động cộng tăng số lượng vào Kho Hàng Hóa để phục vụ xuất kho nhật ký.
                </p>
              </div>

              <div
                onClick={() => handleChangeInvoiceType('BREED')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  invoiceForm.invoiceType === 'BREED'
                    ? 'border-amber-600 bg-white ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-slate-100/60 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs mb-1">
                  <input
                    type="radio"
                    name="modalInvoiceType"
                    checked={invoiceForm.invoiceType === 'BREED'}
                    onChange={() => handleChangeInvoiceType('BREED')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>Lựa chọn B: Nhập Con Giống (Heo / Gà)</span>
                </div>
                <p className="text-[11px] text-slate-500 pl-5">
                  Đẩy thẳng vào Lứa nuôi tại Chuồng tiếp nhận để bắt đầu theo dõi ngày tuổi.
                </p>
              </div>
            </div>

            {/* Hàng trường dữ liệu NCC, Ngày, Nơi nhận */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Nhà cung cấp kèm nút thêm nhanh */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800">Nhà cung cấp *</label>
                  <button
                    type="button"
                    onClick={() => setIsNewSupplierModalOpen(true)}
                    className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
                  >
                    + Thêm NCC
                  </button>
                </div>
                <select
                  value={invoiceForm.supplierId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, supplierId: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.debt > 0 ? `(Nợ: ${formatNumber(s.debt)}đ)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ngày nhập */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Ngày nhập hàng *</label>
                <input
                  type="date"
                  value={invoiceForm.invoiceDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Đích đến tùy theo loại nhập */}
              {invoiceForm.invoiceType === 'FEED_MED' ? (
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Kho tiếp nhận *</label>
                  <select
                    value={invoiceForm.warehouseId}
                    onChange={(e) => {
                      const nextWhId = Number(e.target.value);
                      setInvoiceForm((prev) => ({
                        ...prev,
                        warehouseId: nextWhId,
                        items: prev.items.map((row) => ({ ...row, materialId: '', name: '', unit: '', conversionRate: 1, unitPrice: 0 })),
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
                <div className="space-y-2">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Chuồng nuôi & Lứa tiếp nhận <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={invoiceForm.barnId}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, barnId: Number(e.target.value) })}
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
                  {barnsAndBatches.find((b) => Number(b.id) === Number(invoiceForm.barnId))?.isEmpty && breeds.length > 0 && (
                    <div>
                      <label className="font-semibold text-amber-800 block mb-0.5 text-[11px]">
                        Giống vật nuôi (tự động mở lứa mới):
                      </label>
                      <select
                        value={invoiceForm.breedId}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, breedId: Number(e.target.value) })}
                        className="w-full p-1.5 bg-amber-50 border border-amber-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                      >
                        {breeds.map((br) => (
                          <option key={br.id} value={br.id}>
                            {br.breedName || br.name} ({br.species})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* PHẦN 2: BẢNG CHI TIẾT HÀNG HÓA NHẬP (LINE ITEMS) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-600" />
                <span>
                  2. Chi Tiết {invoiceForm.invoiceType === 'BREED' ? 'Con Giống Nhập Chuồng' : 'Cám & Dược Thú Y Nhập Kho'} ({invoiceForm.items.length})
                </span>
              </h4>
              <Button
                type="button"
                variant="outline"
                size="xs"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={handleAddItemRow}
              >
                Thêm Mặt Hàng
              </Button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Tên Sản Phẩm / Con Giống</th>
                    <th className="py-2.5 px-2 text-center w-20">ĐVT</th>
                    <th className="py-2.5 px-2 text-center w-24">Số Lượng</th>
                    {invoiceForm.invoiceType === 'BREED' ? (
                      <>
                        <th className="py-2.5 px-2 text-center w-28">Tổng Trọng Lượng (kg)</th>
                        <th className="py-2.5 px-2 text-center w-28">BQ (kg/con)</th>
                      </>
                    ) : (
                      <>
                        <th className="py-2.5 px-2 text-center w-28">Mã Lô NSX</th>
                        <th className="py-2.5 px-2 text-center w-28">Hạn Dùng</th>
                      </>
                    )}
                    {canViewCost && (
                      <>
                        <th className="py-2.5 px-3 text-right w-28">Đơn Giá Nhập</th>
                        <th className="py-2.5 px-3 text-right w-32">Thành Tiền</th>
                      </>
                    )}
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceForm.items.map((row) => {
                    const rowAmount = (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);

                    return (
                      <tr key={row.tempId} className="hover:bg-slate-50/50">
                        {/* Tên hàng */}
                        <td className="py-2 px-3 min-w-[210px]">
                          {invoiceForm.invoiceType === 'BREED' ? (
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => handleUpdateItemField(row.tempId, 'name', e.target.value)}
                              placeholder="Nhập tên con giống..."
                              className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : (
                            <div className="space-y-0.5">
                              <select
                                value={row.materialId || ''}
                                onChange={(e) => handleSelectMaterial(row.tempId, e.target.value)}
                                className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                              >
                                <option value="">-- Chọn mặt hàng từ danh mục --</option>
                                {filteredMaterials.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} ({m.skuCode})
                                  </option>
                                ))}
                                <option value="__ADD_NEW__" className="font-bold text-emerald-700">
                                  + Thêm mã hàng mới...
                                </option>
                              </select>
                              {row.conversionRate > 1 && (
                                <span className="text-[10px] text-emerald-700 block">
                                  Quy đổi: 1 {row.unit} = {row.conversionRate} đơn vị gốc
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* ĐVT */}
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={row.unit}
                            onChange={(e) => handleUpdateItemField(row.tempId, 'unit', e.target.value)}
                            className="w-full p-1.5 text-center bg-white border border-slate-300 rounded text-xs font-semibold"
                          />
                        </td>

                        {/* Số lượng */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => handleUpdateItemField(row.tempId, 'quantity', e.target.value)}
                            className="w-full p-1.5 text-center bg-white border border-slate-300 rounded text-xs font-black focus:ring-2 focus:ring-emerald-500"
                          />
                        </td>

                        {/* Con giống: Tổng kg & BQ kg/con */}
                        {invoiceForm.invoiceType === 'BREED' ? (
                          <>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                step="0.1"
                                value={row.totalWeightKg || ''}
                                onChange={(e) => handleUpdateItemField(row.tempId, 'totalWeightKg', e.target.value)}
                                placeholder="VD: 120"
                                className="w-full p-1.5 text-center bg-white border border-slate-300 rounded text-xs font-bold"
                              />
                            </td>
                            <td className="py-2 px-2 text-center font-bold font-mono text-emerald-700">
                              {row.avgWeightKg ? `${row.avgWeightKg} kg` : '-'}
                            </td>
                          </>
                        ) : (
                          /* Cám/Thuốc: Lô & Hạn dùng */
                          <>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={row.lotCode || ''}
                                onChange={(e) => handleUpdateItemField(row.tempId, 'lotCode', e.target.value)}
                                placeholder="LOT-..."
                                className="w-full p-1.5 text-center bg-white border border-slate-300 rounded text-xs"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="date"
                                value={row.expiryDate || ''}
                                onChange={(e) => handleUpdateItemField(row.tempId, 'expiryDate', e.target.value)}
                                className="w-full p-1.5 text-center bg-white border border-slate-300 rounded text-xs"
                              />
                            </td>
                          </>
                        )}

                        {/* Đơn giá & Thành tiền (RBAC) */}
                        {canViewCost && (
                          <>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                min="0"
                                value={row.unitPrice}
                                onChange={(e) => handleUpdateItemField(row.tempId, 'unitPrice', e.target.value)}
                                className="w-full p-1.5 text-right font-mono font-semibold bg-white border border-slate-300 rounded text-xs"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(rowAmount)}
                            </td>
                          </>
                        )}

                        {/* Nút xóa */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(row.tempId)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PHẦN 3: KHUNG THANH TOÁN & GHI NHẬN CÔNG NỢ (CHỈ HIỆN VỚI CHỦ TRẠI & KẾ TOÁN KHO) */}
          {canViewCost && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span>3. Thanh Toán & Ghi Nhận Công Nợ Mua Gối Đầu</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                {/* Tổng tiền hàng */}
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Tổng tiền hàng:</span>
                  <span className="font-black font-mono text-slate-800 text-sm">
                    {formatCurrency(modalCalculations.rawTotal)}
                  </span>
                </div>

                {/* Chiết khấu giảm giá */}
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Chiết khấu / Giảm giá:</label>
                  <input
                    type="number"
                    min="0"
                    value={invoiceForm.discountAmount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, discountAmount: Number(e.target.value) || 0 })}
                    className="w-full p-1.5 font-mono text-right bg-slate-50 border border-slate-300 rounded text-xs font-bold"
                  />
                </div>

                {/* Tổng cần thanh toán */}
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Tổng cần thanh toán:</span>
                  <span className="font-black font-mono text-emerald-700 text-sm">
                    {formatCurrency(modalCalculations.finalPayment)}
                  </span>
                </div>

                {/* Số tiền trả ngay */}
                <div>
                  <label className="text-[11px] text-slate-700 font-bold block mb-0.5">
                    Số tiền trả ngay (0 nếu gối đầu):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={invoiceForm.paidAmount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, paidAmount: Number(e.target.value) || 0 })}
                    className="w-full p-1.5 font-mono text-right bg-emerald-50 border border-emerald-300 rounded text-xs font-black text-emerald-900"
                  />
                </div>
              </div>

              {/* Dòng chữ đỏ ghi nhận công nợ */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>
                    Số tiền ghi nhận công nợ NCC: <span className="font-mono text-sm underline">{formatCurrency(modalCalculations.debt)}</span>
                  </span>
                </div>

                {/* Chọn nguồn quỹ nếu có trả tiền */}
                {Number(invoiceForm.paidAmount) > 0 && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span>Nguồn quỹ chi:</span>
                    <select
                      value={invoiceForm.fundSource}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, fundSource: e.target.value })}
                      className="py-1 px-2 bg-white border border-slate-300 rounded text-xs font-semibold"
                    >
                      <option value="BANK">Chuyển khoản Ngân Hàng (Vietcombank)</option>
                      <option value="CASH">Tiền mặt tại Quỹ Trại</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Modal */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Hủy Bỏ
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => handleSaveInvoice('DRAFT')}
                className="text-slate-700"
              >
                Lưu Nháp / Chờ Duyệt Giá
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                onClick={() => handleSaveInvoice('CONFIRMED')}
                className="font-bold flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSubmitting ? 'Đang lưu...' : 'Lưu & Ghi Sổ Kho (Hoàn Thành)'}</span>
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL THANH TOÁN CÔNG NỢ NCC (TRẢ NỢ GỐI ĐẦU) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isPayDebtModalOpen}
        onClose={() => setIsPayDebtModalOpen(false)}
        title="Thanh Toán Công Nợ Nhà Cung Cấp (Trả Nợ Gối Đầu)"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-800 block mb-1">Nhà cung cấp cần thanh toán *</label>
            <select
              value={payDebtForm.supplierId}
              onChange={(e) => {
                const suppId = Number(e.target.value);
                const sObj = suppliers.find((s) => s.id === suppId);
                setPayDebtForm({
                  ...payDebtForm,
                  supplierId: suppId,
                  amount: sObj?.debt || 0,
                });
              }}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - Tổng nợ hiện tại: {formatCurrency(s.debt)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Số tiền thanh toán nợ (VNĐ) *</label>
            <input
              type="number"
              min="1000"
              value={payDebtForm.amount}
              onChange={(e) => setPayDebtForm({ ...payDebtForm, amount: Number(e.target.value) })}
              className="w-full p-2 font-mono font-black text-sm text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Nguồn quỹ thanh toán *</label>
            <select
              value={payDebtForm.fundSource}
              onChange={(e) => setPayDebtForm({ ...payDebtForm, fundSource: e.target.value })}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
            >
              <option value="BANK">Tài khoản Ngân Hàng (Vietcombank)</option>
              <option value="CASH">Tiền mặt tại Quỹ Trại</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Ghi chú phiếu chi trả nợ</label>
            <input
              type="text"
              value={payDebtForm.notes}
              onChange={(e) => setPayDebtForm({ ...payDebtForm, notes: e.target.value })}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPayDebtModalOpen(false)}>
              Hủy
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleConfirmPayDebt} className="font-bold">
              Xác Nhận Chi Trả Nợ
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL THÊM NHANH NHÀ CUNG CẤP */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewSupplierModalOpen}
        onClose={() => setIsNewSupplierModalOpen(false)}
        title="Thêm Nhanh Nhà Cung Cấp Mới"
        size="sm"
      >
        <form onSubmit={handleSaveNewSupplier} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Tên nhà cung cấp / Đại lý <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newSupplierForm.name}
              onChange={(e) => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
              placeholder="VD: Đại lý cám Thành Công"
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Số điện thoại liên hệ</label>
            <input
              type="text"
              value={newSupplierForm.phone}
              onChange={(e) => setNewSupplierForm({ ...newSupplierForm, phone: e.target.value })}
              placeholder="09xx xxx xxx"
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Địa chỉ</label>
            <input
              type="text"
              value={newSupplierForm.address}
              onChange={(e) => setNewSupplierForm({ ...newSupplierForm, address: e.target.value })}
              placeholder="Huyện, Tỉnh..."
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewSupplierModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Lưu Nhà Cung Cấp
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL THÊM NHANH MÃ HÀNG MỚI TỪ DROPDOWN */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewMaterialModalOpen}
        onClose={() => {
          setIsNewMaterialModalOpen(false);
          setActiveRowTempIdForNewMat(null);
        }}
        title="Thêm Nhanh Mã Hàng Mới Vào Danh Mục"
        size="md"
      >
        <form onSubmit={handleSaveNewMaterial} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Mã SKU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newMaterialForm.skuCode}
                onChange={(e) => setNewMaterialForm({ ...newMaterialForm, skuCode: e.target.value })}
                placeholder="VD: CAM-GA-01"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Nhóm vật tư <span className="text-rose-500">*</span>
              </label>
              <select
                value={newMaterialForm.categoryId}
                onChange={(e) => setNewMaterialForm({ ...newMaterialForm, categoryId: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                required
              >
                <option value="">-- Chọn nhóm --</option>
                {materialCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Tên mặt hàng <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newMaterialForm.name}
              onChange={(e) => setNewMaterialForm({ ...newMaterialForm, name: e.target.value })}
              placeholder="VD: Cám Gà Con Siêu Tăng Trọng 25kg"
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Đơn vị tính gốc (Kg / Ml / Bao / Lọ) *
              </label>
              <input
                type="text"
                value={newMaterialForm.standardUnit}
                onChange={(e) => setNewMaterialForm({ ...newMaterialForm, standardUnit: e.target.value })}
                placeholder="VD: Kg, Ml, Bao, Lọ..."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Đơn giá nhập chuẩn (VNĐ)</label>
              <input
                type="number"
                min="0"
                value={newMaterialForm.unitPriceStandard}
                onChange={(e) => setNewMaterialForm({ ...newMaterialForm, unitPriceStandard: Number(e.target.value) || 0 })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Đơn vị mua (nếu khác ĐVT gốc)</label>
              <input
                type="text"
                value={newMaterialForm.conversionUnitName}
                onChange={(e) => setNewMaterialForm({ ...newMaterialForm, conversionUnitName: e.target.value })}
                placeholder="VD: Bao, Chai..."
                className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Hệ số quy đổi (conversion_rate)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={newMaterialForm.conversionFactor}
                onChange={(e) => setNewMaterialForm({ ...newMaterialForm, conversionFactor: Number(e.target.value) || 1 })}
                className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono text-right"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsNewMaterialModalOpen(false);
                setActiveRowTempIdForNewMat(null);
              }}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Lưu & Chọn Mã Hàng
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL XEM CHI TIẾT HÓA ĐƠN NHẬP HÀNG */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedInvoiceForView ? `Hóa Đơn Nhập: ${selectedInvoiceForView.invoiceNumber}` : 'Chi Tiết Hóa Đơn'}
        size="2xl"
      >
        {selectedInvoiceForView && (
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-500 block text-[11px]">Mã phiếu:</span>
                <span className="font-mono font-black text-slate-900 text-sm">{selectedInvoiceForView.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Ngày nhập:</span>
                <span className="font-bold text-slate-800">{formatDate(selectedInvoiceForView.invoiceDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Phân loại:</span>
                <span className="font-bold text-emerald-800">
                  {selectedInvoiceForView.invoiceType === 'BREED' ? 'Con giống vào chuồng' : 'Cám & Thuốc vào kho'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Thanh toán:</span>
                {selectedInvoiceForView.paymentStatus === 'PAID' ? (
                  <span className="font-bold text-emerald-700">Đã trả đủ</span>
                ) : selectedInvoiceForView.paymentStatus === 'PARTIAL' ? (
                  <span className="font-bold text-amber-700">Còn nợ một phần</span>
                ) : (
                  <span className="font-bold text-rose-700">Chưa trả (Gối đầu)</span>
                )}
              </div>
            </div>

            {/* Chi tiết NCC & Nơi nhận */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 w-24">Nhà cung cấp:</span>
                <span className="font-bold text-slate-900">{selectedInvoiceForView.supplierName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 w-24">Nơi tiếp nhận:</span>
                <span className="font-bold text-emerald-800">{selectedInvoiceForView.destinationName}</span>
              </div>
              {selectedInvoiceForView.notes && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 w-24">Ghi chú:</span>
                  <span className="text-slate-700 italic">"{selectedInvoiceForView.notes}"</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 w-24">Người lập:</span>
                <span className="text-slate-800">{selectedInvoiceForView.creatorName}</span>
                {selectedInvoiceForView.approverName && (
                  <span className="text-slate-400 ml-4">(Duyệt: {selectedInvoiceForView.approverName})</span>
                )}
              </div>
            </div>

            {/* Bảng danh sách mặt hàng */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Tên Hàng / Giống</th>
                    <th className="py-2 px-2 text-center">ĐVT</th>
                    <th className="py-2 px-2 text-center">Số Lượng</th>
                    {selectedInvoiceForView.invoiceType === 'BREED' ? (
                      <th className="py-2 px-2 text-center">Trọng Lượng (kg)</th>
                    ) : (
                      <th className="py-2 px-2 text-center">Mã Lô & Hạn Dùng</th>
                    )}
                    {canViewCost && (
                      <>
                        <th className="py-2 px-3 text-right">Đơn Giá</th>
                        <th className="py-2 px-3 text-right">Thành Tiền</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoiceForView.items?.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{it.name}</td>
                      <td className="py-2 px-2 text-center font-semibold text-slate-600">{it.unit}</td>
                      <td className="py-2 px-2 text-center font-black text-slate-900">{formatNumber(it.quantity)}</td>
                      {selectedInvoiceForView.invoiceType === 'BREED' ? (
                        <td className="py-2 px-2 text-center font-mono font-bold text-emerald-800">
                          {it.totalWeightKg} kg (BQ: {it.avgWeightKg} kg/con)
                        </td>
                      ) : (
                        <td className="py-2 px-2 text-center text-slate-500 text-[11px]">
                          {it.lotCode} ({it.expiryDate})
                        </td>
                      )}
                      {canViewCost && (
                        <>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            {formatCurrency(it.unitPrice)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(it.amount)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
                {canViewCost && (
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={selectedInvoiceForView.invoiceType === 'BREED' ? 4 : 4} className="py-2 px-3 text-right">
                        Tổng cộng tiền hàng:
                      </td>
                      <td className="py-2 px-3 text-right font-black font-mono text-slate-900">
                        {formatCurrency(selectedInvoiceForView.totalGoodsAmount)}
                      </td>
                    </tr>
                    {selectedInvoiceForView.discountAmount > 0 && (
                      <tr>
                        <td colSpan={4} className="py-1 px-3 text-right text-rose-600">
                          Chiết khấu giảm giá:
                        </td>
                        <td className="py-1 px-3 text-right font-mono text-rose-600">
                          -{formatCurrency(selectedInvoiceForView.discountAmount)}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={4} className="py-1 px-3 text-right text-emerald-800">
                        Đã thanh toán:
                      </td>
                      <td className="py-1 px-3 text-right font-mono text-emerald-700">
                        {formatCurrency(selectedInvoiceForView.paidAmount)}
                      </td>
                    </tr>
                    {selectedInvoiceForView.remainingDebt > 0 && (
                      <tr className="bg-rose-50 text-rose-900">
                        <td colSpan={4} className="py-2 px-3 text-right font-black">
                          Còn nợ nhà cung cấp:
                        </td>
                        <td className="py-2 px-3 text-right font-black font-mono text-rose-600">
                          {formatCurrency(selectedInvoiceForView.remainingDebt)}
                        </td>
                      </tr>
                    )}
                  </tfoot>
                )}
              </table>
            </div>

            {/* Footer xem chi tiết */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsViewModalOpen(false)}>
                Đóng
              </Button>

              {canViewCost && selectedInvoiceForView.remainingDebt > 0 && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={<CreditCard className="h-4 w-4" />}
                  onClick={() => handleOpenPayDebtModal(selectedInvoiceForView)}
                  className="font-bold bg-rose-600 hover:bg-rose-700"
                >
                  Thanh Toán Nợ ({formatCurrency(selectedInvoiceForView.remainingDebt)})
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
