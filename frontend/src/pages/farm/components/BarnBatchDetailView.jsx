import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  ChevronLeft,
  ChevronDown,
  Edit2,
  Download,
  Calendar,
  Layers,
  Activity,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Info,
  Clock,
  Split,
  ShoppingBag,
  XSquare,
  ArrowRight,
  ShieldAlert,
  Thermometer,
  Droplets,
  Wind,
  FileSpreadsheet,
  Settings,
  Scale,
  Building2,
  Syringe,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { barnBatchService } from '@/services/modules/barnBatchService';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/useToastStore';

// 7 Màu phân bổ chi phí chuẩn FarmGo
const COST_COLORS = {
  feed: '#10B981',       // Thức ăn
  medicine: '#06B6D4',   // Thuốc & Vắc-xin
  material: '#8B5CF6',   // Chất xử lý & Vật tư
  seed: '#F59E0B',       // Con giống
  labor: '#3B82F6',      // Công nhân
  utility: '#EC4899',    // Điện nước
  other: '#64748B',      // Khác
};

const formatNumber = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return Number(val).toLocaleString('vi-VN');
};

const formatCurrency = (val) => {
  return `${formatNumber(val)} đ`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '---';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
  } catch (e) {
    return dateStr;
  }
};

export function BarnBatchDetailView({
  barn,
  allBarns = [],
  zones = [],
  batchDetail,
  programsList = [],
  canManageBatch = true,
  canManageBarns = true,
  canViewFinancials = true,
  onRefresh,
  onOpenQuickLog,
  onOpenSplitModal,
  onOpenCloseBatchModal,
}) {
  const navigate = useNavigate();

  // Sub-tabs
  const [leftTab, setLeftTab] = useState('HACH_TOAN'); // HACH_TOAN | CHI_PHI
  const [logTab, setLogTab] = useState('FEED'); // FEED | TASKS | ANIMAL | ENVIRONMENT
  const [harvestTab, setHarvestTab] = useState('LIVESTOCK'); // LIVESTOCK | BY_PRODUCTS

  // Modals state
  const [isTargetsModalOpen, setIsTargetsModalOpen] = useState(false);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [isApplyProgramModalOpen, setIsApplyProgramModalOpen] = useState(false);
  const [isAddByProductModalOpen, setIsAddByProductModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEditBarnModalOpen, setIsEditBarnModalOpen] = useState(false);
  const [isEditBatchModalOpen, setIsEditBatchModalOpen] = useState(false);
  const [isReportMortalityModalOpen, setIsReportMortalityModalOpen] = useState(false);

  // Forms
  const [targetsForm, setTargetsForm] = useState({
    fcrTarget: batchDetail?.targets?.fcrTarget ?? 1.62,
    costPerKgTarget: batchDetail?.targets?.costPerKgTarget ?? 32500,
    maxMortalityPct: batchDetail?.targets?.maxMortalityPct ?? 3.5,
    expectedHarvestWeightKg: batchDetail?.targets?.expectedHarvestWeightKg ?? 2.8,
  });

  const [addGroupForm, setAddGroupForm] = useState({
    groupCode: '',
    breedName: batchDetail?.breedName || 'Giống tiêu chuẩn',
    quantity: 1000,
    unitPrice: 15000,
    avgInitialWeightKg: 0.045,
    weeksOld: 1,
    gender: 'MIXED',
    sourceType: 'PURCHASE',
    entryDate: new Date().toISOString().split('T')[0],
  });

  const [applyProgramForm, setApplyProgramForm] = useState({
    programId: '',
    programType: 'FEED',
    description: '',
  });

  const [byProductForm, setByProductForm] = useState({
    itemName: 'Bao bì thức ăn đã qua sử dụng',
    quantity: 100,
    unit: 'Bao',
    unitPrice: 3500,
    recordDate: new Date().toISOString().split('T')[0],
    note: 'Bán phế liệu vỏ bao thức ăn chăn nuôi',
  });

  const [editBarnForm, setEditBarnForm] = useState({
    name: barn?.name || '',
    areaM2: barn?.areaM2 || 180,
    capacity: barn?.capacity || 2000,
    description: barn?.description || '',
  });

  const [editBatchForm, setEditBatchForm] = useState({
    batchName: batchDetail?.code || barn?.batch?.batchName || '',
    startDate: batchDetail?.entryDate || barn?.batch?.startDate || '',
  });

  const [mortalityReportForm, setMortalityReportForm] = useState({
    groupId: batchDetail?.id || null,
    deadCount: 5,
    cullCount: 0,
    reason: 'Hao hụt tự nhiên trong ngày',
    date: new Date().toISOString().split('T')[0],
  });

  // Derived Batch Data
  const b = batchDetail || {
    id: barn?.batch?.id,
    code: barn?.batch?.batchCode || 'LUA-MOI',
    breedName: barn?.batch?.breedName || 'Giống tiêu chuẩn',
    entryDate: barn?.batch?.startDate || '2026-10-15',
    daysOld: barn?.batch?.currentAgeDays || 35,
    initialQuantity: barn?.batch?.initialQuantity || 2000,
    currentQuantity: barn?.batch?.currentQuantity ?? 0,
    deadQuantity: barn?.batch?.mortalityCount ?? 0,
    culledQuantity: 0,
    harvestedQuantity: barn?.batch?.harvestedQuantity ?? 0,
    mortalityRate: barn?.batch?.mortalityRatePct ?? 0,
    currentAvgWeightKg: barn?.batch?.currentWeightKg ?? 0,
    targetWeightKg: 2.8,
    actualFcr: barn?.batch?.actualFcr || 1.58,
    standardFcr: 1.62,
    totalFeedConsumedKg: barn?.batch?.totalFeedConsumedKg || 6280,
    barnAreaM2: barn?.areaM2 || 180,
    barnCapacity: barn?.capacity || 2000,
    barnDescription: barn?.description || 'Chuồng lạnh khép kín máng ăn tự động',
    status: 'ACTIVE',
  };

  const rawPnl = batchDetail?.financialPnl;
  const pnl = rawPnl
    ? {
        canViewFinancials: rawPnl.canViewFinancials ?? canViewFinancials,
        seedCost: Number(rawPnl.breedCost ?? rawPnl.seedCost ?? 0),
        feedCost: Number(rawPnl.feedCost ?? 0),
        medicineCost: Number(rawPnl.medicineCost ?? 0),
        materialCost: Number(rawPnl.suppliesCost ?? rawPnl.materialCost ?? 0),
        laborCost: Number(rawPnl.laborCost ?? 0),
        utilityCost: Number(rawPnl.electricityWaterCost ?? rawPnl.utilityCost ?? 0),
        otherCost: Number(rawPnl.otherCost ?? 0),
        totalCost: Number(rawPnl.totalCost ?? 0),
        totalRevenue: Number(rawPnl.revenue ?? rawPnl.totalRevenue ?? 0),
        estimatedStockValue: Number(rawPnl.estimatedStockValue ?? 0),
        grossProfit: Number(rawPnl.profit ?? rawPnl.grossProfit ?? 0),
        costPerKgMeat: Number(rawPnl.unitCostPerKg ?? rawPnl.costPerKgMeat ?? 0),
        costItems: rawPnl.costItems || [],
      }
    : {
        canViewFinancials: canViewFinancials,
        seedCost: 0,
        feedCost: 0,
        medicineCost: 0,
        materialCost: 0,
        laborCost: 0,
        utilityCost: 0,
        otherCost: 0,
        totalCost: 0,
        totalRevenue: 0,
        estimatedStockValue: 0,
        grossProfit: 0,
        costPerKgMeat: 0,
        costItems: [],
      };

  const targets = batchDetail?.targets || {
    fcrTarget: 1.62,
    costPerKgTarget: 32500,
    maxMortalityPct: 3.5,
    expectedHarvestWeightKg: 2.8,
  };

  const overview = {
    ...(batchDetail?.overview || {}),
    currentDensityHeadPerM2: b.barnAreaM2 > 0 ? (b.currentQuantity / b.barnAreaM2).toFixed(1) : '0',
    currentBiomassKg: (b.currentQuantity * (b.currentAvgWeightKg || 0)).toFixed(1),
    cullHeadCount: b.culledQuantity ?? 0,
    totalCostPerKg: pnl.costPerKgMeat || 0,
  };

  const groupsList = batchDetail?.groups?.length ? batchDetail.groups : [
    {
      id: b.id,
      groupCode: b.code,
      breedName: b.breedName,
      initialQuantity: b.initialQuantity,
      currentQuantity: b.currentQuantity,
      avgInitialWeightKg: 0.045,
      currentAvgWeightKg: b.currentAvgWeightKg,
      gender: 'MIXED',
      sourceType: 'PURCHASE',
      entryDate: b.entryDate,
      weeksOld: Math.max(1, Math.floor(b.daysOld / 7)),
      totalCost: pnl.seedCost,
    }
  ];

  const appliedPrograms = batchDetail?.appliedPrograms?.length ? batchDetail.appliedPrograms : [
    {
      id: 1,
      programId: 101,
      programCode: 'CT-CAM-GA-42N',
      programName: 'Quy trình Cám Gà Thịt CP Chuẩn (0-42 ngày)',
      programType: 'FEED',
      description: 'Định mức cám theo từng ngày tuổi bám sát tăng trọng thực tế',
      milestonesCount: 42,
      appliedDate: b.entryDate,
    },
    {
      id: 2,
      programId: 202,
      programCode: 'VX-GA-45N',
      programName: 'Lịch phòng Vắc-xin & Kháng sinh Gà thịt 45 ngày',
      programType: 'VACCINE',
      description: 'Lịch nhỏ mắt, tiêm chủng phòng dịch bệnh định kỳ',
      milestonesCount: 6,
      appliedDate: b.entryDate,
    }
  ];

  const harvestRecords = batchDetail ? (batchDetail.harvestRecords || []) : [];

  const byProducts = batchDetail ? (batchDetail.byProducts || []) : [];

  const eventLogs = batchDetail ? (batchDetail.eventLogs || []) : [];

  // 7 Chi phí chart data
  const costChartData = useMemo(() => {
    return [
      { name: 'Thức ăn', value: Number(pnl.feedCost || 0), color: COST_COLORS.feed },
      { name: 'Thuốc & Vắc-xin', value: Number(pnl.medicineCost || 0), color: COST_COLORS.medicine },
      { name: 'Chất xử lý & Vật tư', value: Number(pnl.materialCost || 0), color: COST_COLORS.material },
      { name: 'Con giống', value: Number(pnl.seedCost || 0), color: COST_COLORS.seed },
      { name: 'Công nhân', value: Number(pnl.laborCost || 0), color: COST_COLORS.labor },
      { name: 'Điện nước', value: Number(pnl.utilityCost || 0), color: COST_COLORS.utility },
      { name: 'Khác', value: Number(pnl.otherCost || 0), color: COST_COLORS.other },
    ].filter((item) => item.value > 0);
  }, [pnl]);

  // Handle Export Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Tổng quan lứa nuôi & Hạch toán
    const summaryData = [
      ['BÁO CÁO TOÀN DIỆN LỨA NUÔI & HẠCH TOÁN CHI PHÍ - FARMGO'],
      ['Mã lứa:', b.code, 'Tên chuồng:', barn?.name, 'Khu nuôi:', barn?.zoneName],
      ['Giống nuôi:', b.breedName, 'Ngày bắt đầu:', b.entryDate, 'Số ngày tuổi:', b.daysOld],
      ['Sĩ số ban đầu:', b.initialQuantity, 'Sĩ số hiện tại:', b.currentQuantity, 'Hao hụt:', `${b.deadQuantity} (${b.mortalityRate}%)`],
      ['Trọng lượng TB hiện tại (kg):', b.currentAvgWeightKg, 'Tổng sinh khối (kg):', overview.currentBiomassKg, 'FCR thực tế:', b.actualFcr],
      [''],
      ['CƠ CẤU CHI PHÍ VÀ LỢI NHUẬN (VND)'],
      ['Khoản mục', 'Số tiền (VNĐ)'],
      ['1. Chi phí thức ăn', pnl.feedCost],
      ['2. Chi phí thuốc & vắc-xin', pnl.medicineCost],
      ['3. Chi phí chất xử lý & vật tư', pnl.materialCost],
      ['4. Chi phí con giống', pnl.seedCost],
      ['5. Chi phí công nhân', pnl.laborCost],
      ['6. Chi phí điện nước', pnl.utilityCost],
      ['7. Chi phí khác', pnl.otherCost],
      ['TỔNG CHI PHÍ ĐẦU TƯ', pnl.totalCost],
      ['TỔNG DOANH THU ĐÃ THU', pnl.totalRevenue],
      ['ƯỚC TÍNH GIÁ TRỊ ĐÀN TỒN', pnl.estimatedStockValue],
      ['LỢI NHUẬN TẠM TÍNH', pnl.grossProfit],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'TongQuan_HachToan');

    // Sheet 2: Danh sách nhập đàn
    const groupsData = [
      ['Tuổi (tuần)', 'Mã SKU', 'Giống vật nuôi', 'Số lượng đầu', 'Hiện tại', 'Cân nặng TB (kg)', 'Giới tính', 'Nguồn gốc', 'Ngày nhập'],
      ...groupsList.map((g) => [
        g.weeksOld || 1,
        g.groupCode,
        g.breedName,
        g.initialQuantity,
        g.currentQuantity,
        g.currentAvgWeightKg || g.avgInitialWeightKg,
        g.gender,
        g.sourceType,
        g.entryDate,
      ]),
    ];
    const wsGroups = XLSX.utils.aoa_to_sheet(groupsData);
    XLSX.utils.book_append_sheet(wb, wsGroups, 'VatNuoi_NhapDan');

    // Sheet 3: Nhật ký chi tiết
    const logData = [
      ['Ngày', 'Loại sự kiện', 'Chi tiết công việc / Mặt hàng', 'Lượng ăn (kg)', 'Định mức chuẩn (kg)', 'Cân mẫu TB (kg)', 'Chết', 'Loại thải', 'Nhiệt độ (°C)', 'Độ ẩm (%)', 'NH3 (ppm)', 'Người ghi'],
      ...eventLogs.map((e) => [
        e.date,
        e.eventType,
        e.medicineName || e.description,
        e.feedAmountKg || 0,
        e.standardFeedKg || 0,
        e.sampleWeightKg || 0,
        e.deadCount || 0,
        e.cullCount || 0,
        e.temperatureC || '',
        e.humidityPct || '',
        e.nh3Ppm || '',
        e.authorName || '',
      ]),
    ];
    const wsLogs = XLSX.utils.aoa_to_sheet(logData);
    XLSX.utils.book_append_sheet(wb, wsLogs, 'NhatKy_HangNgay');

    // Sheet 4: Thu hoạch & Xuất bán
    const harvestData = [
      ['Ngày xuất', 'Mã đơn', 'Mã lứa', 'Số con', 'Tổng kg', 'Giá bán / kg', 'Tổng thành tiền (VNĐ)', 'Loại hình'],
      ...harvestRecords.map((h) => [
        h.harvestDate,
        h.orderCode,
        h.groupCode,
        h.quantityHead,
        h.totalWeightKg,
        h.salePrice,
        h.totalRevenue,
        h.harvestType === 'HARVEST' ? 'Xuất bán thịt' : 'Loại thải',
      ]),
    ];
    const wsHarvest = XLSX.utils.aoa_to_sheet(harvestData);
    XLSX.utils.book_append_sheet(wb, wsHarvest, 'XuatBan_VatNuoi');

    // Sheet 5: Phụ thu bán phân & bao bì
    const byProductData = [
      ['Ngày ghi', 'Mã phụ thu', 'Tên mặt hàng', 'Số lượng', 'Đơn vị', 'Đơn giá', 'Tổng tiền (VNĐ)', 'Ghi chú'],
      ...byProducts.map((bp) => [
        bp.recordDate,
        bp.itemCode,
        bp.itemName,
        bp.quantity,
        bp.unit,
        bp.unitPrice,
        bp.totalAmount,
        bp.note,
      ]),
    ];
    const wsByProducts = XLSX.utils.aoa_to_sheet(byProductData);
    XLSX.utils.book_append_sheet(wb, wsByProducts, 'PhuThu_Phan_BaoBi');

    const fileName = `FarmGo_${barn?.name || 'Chuong'}_${b.code}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Handlers for updating targets
  const handleSaveTargets = async (e) => {
    e.preventDefault();
    try {
      await barnBatchService.updateTargets(b.id, {
        fcrTarget: Number(targetsForm.fcrTarget),
        costPerKgTarget: Number(targetsForm.costPerKgTarget),
        maxMortalityPct: Number(targetsForm.maxMortalityPct),
        expectedHarvestWeightKg: Number(targetsForm.expectedHarvestWeightKg),
      });
      setIsTargetsModalOpen(false);
      onRefresh?.();
    } catch (err) {
      console.error('Lỗi khi lưu mục tiêu', err);
    }
  };

  // Handler for adding group
  const handleSaveAddGroup = async (e) => {
    e.preventDefault();
    try {
      await barnBatchService.addGroup(b.id, {
        groupCode: addGroupForm.groupCode || `${b.code}-G${groupsList.length + 1}`,
        breedName: addGroupForm.breedName,
        quantity: Number(addGroupForm.quantity),
        unitPrice: Number(addGroupForm.unitPrice),
        avgInitialWeightKg: Number(addGroupForm.avgInitialWeightKg),
        weeksOld: Number(addGroupForm.weeksOld),
        gender: addGroupForm.gender,
        sourceType: addGroupForm.sourceType,
        entryDate: addGroupForm.entryDate,
      });
      setIsAddGroupModalOpen(false);
      onRefresh?.();
    } catch (err) {
      console.error('Lỗi khi nhập thêm giống', err);
    }
  };

  // Handler for applying program
  const handleSaveApplyProgram = async (e) => {
    e.preventDefault();
    const prog = programsList.find((p) => p.id === Number(applyProgramForm.programId));
    if (!prog) return;
    try {
      await barnBatchService.applyProgram(b.id, {
        programId: prog.id,
        programCode: prog.code || `CT-${prog.id}`,
        programName: prog.name,
        programType: prog.type || applyProgramForm.programType,
        description: applyProgramForm.description || prog.description || '',
        milestonesCount: prog.totalDays || 30,
      });
      setIsApplyProgramModalOpen(false);
      onRefresh?.();
    } catch (err) {
      console.error('Lỗi khi áp dụng chương trình', err);
    }
  };

  // Handler for removing applied program
  const handleRemoveProgram = async (programId) => {
    if (!window.confirm('Bạn có chắc chắn muốn gỡ bỏ chương trình nuôi này khỏi lứa?')) return;
    try {
      await barnBatchService.removeProgram(b.id, programId);
      onRefresh?.();
    } catch (err) {
      console.error('Lỗi khi gỡ chương trình', err);
    }
  };

  // Handler for adding by-product
  const handleSaveAddByProduct = async (e) => {
    e.preventDefault();
    try {
      await barnBatchService.addByProduct(b.id, {
        itemName: byProductForm.itemName,
        quantity: Number(byProductForm.quantity),
        unit: byProductForm.unit,
        unitPrice: Number(byProductForm.unitPrice),
        totalAmount: Number(byProductForm.quantity) * Number(byProductForm.unitPrice),
        recordDate: byProductForm.recordDate,
        note: byProductForm.note,
      });
      setIsAddByProductModalOpen(false);
      onRefresh?.();
    } catch (err) {
      console.error('Lỗi khi thêm phụ thu', err);
    }
  };

  // Handler for updating barn
  const handleSaveEditBarn = async (e) => {
    e.preventDefault();
    const requestedArea = Number(editBarnForm.areaM2) || 0;
    const targetZone = zones.find((z) => Number(z.id) === Number(barn.zoneId));
    if (targetZone && targetZone.areaM2) {
      const otherBarns = allBarns.filter(
        (b) => Number(b.zoneId) === Number(barn.zoneId) && Number(b.id) !== Number(barn.id)
      );
      const otherBarnsArea = otherBarns.reduce((sum, b) => sum + (Number(b.areaM2) || 0), 0);
      const totalAfterUpdate = otherBarnsArea + requestedArea;
      if (totalAfterUpdate > Number(targetZone.areaM2)) {
        const remainingArea = Math.max(0, Number(targetZone.areaM2) - otherBarnsArea);
        toast.error(`Tổng diện tích các chuồng (${totalAfterUpdate} m²) không được lớn hơn diện tích khu nuôi "${targetZone.name}" (${targetZone.areaM2} m²). Diện tích tối đa có thể đặt cho chuồng này: ${remainingArea} m².`);
        return;
      }
    }

    try {
      await barnBatchService.updateBarn(barn.id, {
        name: editBarnForm.name,
        areaM2: requestedArea,
        capacity: Number(editBarnForm.capacity),
        description: editBarnForm.description,
      });
      setIsEditBarnModalOpen(false);
      toast.success(`Đã cập nhật thông tin chuồng ${editBarnForm.name}!`);
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật chuồng');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* =========================================================================
          1. THANH HEADER ĐIỀU HƯỚNG & CHUYỂN CHUỒNG NHANH
         ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Breadcrumb bên trái */}
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => navigate('/app/barns')}
            className="hover:text-emerald-700 transition-colors flex items-center gap-1.5 text-slate-500 hover:underline"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{barn?.zoneName || 'Khu nuôi'}</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-black">{barn?.name || 'Chuồng nuôi'}</span>
        </div>

        {/* Các nút bên phải: Dropdown chuyển chuồng, Lịch sử lứa cũ, + Ghi nhật ký */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dropdown chuyển chuồng nhanh */}
          <div className="relative inline-block text-left">
            <select
              value={barn?.id || ''}
              onChange={(e) => {
                const targetBarnId = e.target.value;
                if (targetBarnId) navigate(`/app/barns/${targetBarnId}`);
              }}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="" disabled>Chuyển chuồng khác...</option>
              {allBarns.map((otherBarn) => (
                <option key={otherBarn.id} value={otherBarn.id}>
                  {otherBarn.name} ({otherBarn.status === 'EMPTY' ? 'Trống' : otherBarn.batch?.batchCode || 'Đang nuôi'})
                </option>
              ))}
            </select>
          </div>

          {/* Nút Lịch sử lứa cũ */}
          <Button
            variant="outline"
            size="sm"
            icon={<Clock className="h-3.5 w-3.5 text-slate-600" />}
            onClick={() => setIsHistoryModalOpen(true)}
            className="text-xs font-semibold border-slate-300 hover:bg-slate-50"
          >
            Lịch sử lứa cũ
          </Button>

          {/* Nút nổi bật + Ghi nhật ký */}
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => onOpenQuickLog?.(barn)}
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            + Ghi nhật ký
          </Button>
        </div>
      </div>

      {/* =========================================================================
          HAI CỘT: CỘT TRÁI (30%) & CỘT PHẢI (70%)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        {/* =========================================================================
            2. CỘT TRÁI (30% -> lg:col-span-3) - THÔNG TIN LỨA & HẠCH TOÁN TÀI CHÍNH
           ========================================================================= */}
        <div className="lg:col-span-3 space-y-6">
          {/* KHỐI 1: THÔNG TIN LỨA NUÔI */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {b.code}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setEditBatchForm({
                        batchName: b.code,
                        startDate: b.entryDate,
                      });
                      setIsEditBatchModalOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                    title="Sửa tên lứa & ngày bắt đầu"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Bắt đầu: <strong>{formatDate(b.entryDate)}</strong></span>
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Đang hoạt động</span>
              </span>
            </div>

            {/* Nút Tải File Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
              <span>Tải File Excel (.xlsx)</span>
            </button>

            {/* Menu thao tác nghiệp vụ */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Thao tác nghiệp vụ
              </span>

              {canManageBatch && (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenSplitModal?.(barn)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Split className="h-3.5 w-3.5 text-blue-600" />
                      <span>Tách / Chuyển chuồng</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/app/sales?batchId=${b.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Xuất bán vật nuôi</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* KHỐI 2: HẠCH TOÁN & CHI PHÍ NUÔI (ẨN HOÀN TOÀN KHI KHÔNG CÓ QUYỀN financial.view_cost) */}
          {canViewFinancials && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span>Hạch toán & Chi phí</span>
              </h3>

              {/* Sub-tabs: Hạch toán & Chi phí nuôi */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setLeftTab('HACH_TOAN')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    leftTab === 'HACH_TOAN'
                      ? 'bg-white text-emerald-800 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Hạch toán
                </button>
                <button
                  type="button"
                  onClick={() => setLeftTab('CHI_PHI')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    leftTab === 'CHI_PHI'
                      ? 'bg-white text-emerald-800 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Chi phí nuôi
                </button>
              </div>
            </div>

            {!canViewFinancials ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                <ShieldAlert className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Dữ liệu tài chính được bảo vệ</p>
                <p className="text-[11px] text-slate-500">
                  Tài khoản của bạn không có quyền xem chi phí & lợi nhuận (<code>financial.view_cost</code>).
                </p>
              </div>
            ) : leftTab === 'HACH_TOAN' ? (
              <div className="space-y-4">
                {/* Donut Chart 7 nhóm chi phí */}
                <div className="h-48 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {costChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => formatCurrency(val)}
                        contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Tổng Chi Phí</span>
                    <span className="text-xs font-black text-slate-800 font-mono">
                      {formatNumber(Math.round(pnl.totalCost / 1000000))} Tr
                    </span>
                  </div>
                </div>

                {/* 7 Chú thích màu chuẩn FarmGo */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COST_COLORS.feed }}></span>
                    <span className="text-slate-600 truncate">Thức ăn</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COST_COLORS.medicine }}></span>
                    <span className="text-slate-600 truncate">Thuốc & Vắc-xin</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COST_COLORS.material }}></span>
                    <span className="text-slate-600 truncate">Chất xử lý, trấu</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COST_COLORS.seed }}></span>
                    <span className="text-slate-600 truncate">Con giống</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COST_COLORS.labor }}></span>
                    <span className="text-slate-600 truncate">Công nhân</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COST_COLORS.utility }}></span>
                    <span className="text-slate-600 truncate">Điện nước</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COST_COLORS.other }}></span>
                    <span className="text-slate-600 truncate">Khác (hao mòn, khấu hao)</span>
                  </div>
                </div>

                {/* 3 Dòng tóm tắt: DOANH THU, CHI PHÍ, LỢI NHUẬN */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">DOANH THU</span>
                    <span className="font-black text-slate-900 font-mono text-sm">
                      {formatCurrency(pnl.totalRevenue)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">CHI PHÍ</span>
                    <span className="font-black text-rose-600 font-mono text-sm">
                      {formatCurrency(pnl.totalCost)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <span className="font-black text-emerald-800 uppercase tracking-wider text-[10px]">LỢI NHUẬN</span>
                    <span className="font-black text-emerald-700 font-mono text-base">
                      {pnl.grossProfit >= 0 ? '+' : ''}{formatCurrency(pnl.grossProfit)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB CHI PHÍ NUÔI: BẢNG KÊ CHI TIẾT TỪNG KHOẢN PHÁT SINH */
              <div className="space-y-3">
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {pnl.costItems && pnl.costItems.length > 0 ? (
                    pnl.costItems.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-800">{item.title || item.description}</span>
                          <span className="font-mono text-slate-900">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold text-[10px]">
                            {item.categoryName}
                          </span>
                          <span>{formatDate(item.date)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-2">
                      <div className="p-2 bg-slate-50 rounded-lg text-xs flex justify-between">
                        <div>
                          <p className="font-bold text-slate-800">Cám ProConco Giai Đoạn 1</p>
                          <span className="text-[10px] text-emerald-700 font-semibold">Thức ăn</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(28500000)}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg text-xs flex justify-between">
                        <div>
                          <p className="font-bold text-slate-800">Con giống Gà Ross 308 (2.000 con)</p>
                          <span className="text-[10px] text-amber-700 font-semibold">Con giống</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(30000000)}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg text-xs flex justify-between">
                        <div>
                          <p className="font-bold text-slate-800">Vắc-xin Newcastle Lasota</p>
                          <span className="text-[10px] text-cyan-700 font-semibold">Thuốc & Vắc-xin</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(2450000)}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg text-xs flex justify-between">
                        <div>
                          <p className="font-bold text-slate-800">Trấu lót nền chuồng đợt 1</p>
                          <span className="text-[10px] text-purple-700 font-semibold">Chất xử lý</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(2200000)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          )}

          {/* KHỐI CARD THÔNG TIN CHUỒNG */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-slate-700" />
                <span>Thông tin chuồng</span>
              </h3>
              {canManageBarns && (
                <button
                  type="button"
                  onClick={() => {
                    setEditBarnForm({
                      name: barn?.name || '',
                      areaM2: barn?.areaM2 || 180,
                      capacity: barn?.capacity || 2000,
                      description: barn?.description || '',
                    });
                    setIsEditBarnModalOpen(true);
                  }}
                  className="text-slate-400 hover:text-emerald-700 p-1 rounded"
                  title="Sửa thông tin chuồng"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Diện tích sàn:</span>
                <strong className="text-slate-900 font-mono">{barn?.areaM2 || 180} m²</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Sức chứa thiết kế:</span>
                <strong className="text-slate-900 font-mono">{formatNumber(barn?.capacity || 2000)} con</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Loại hình nuôi:</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                  {barn?.species === 'SWINE' ? 'Heo thịt thương phẩm' : 'Gia cầm thịt'}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 block text-[11px] mb-1">Mô tả đặc tính chuồng:</span>
                <p className="text-slate-700 bg-slate-50 p-2 rounded-lg text-[11px] italic">
                  {barn?.description || 'Chuồng lạnh khép kín máng ăn tự động, quạt hút làm mát pad cooling.'}
                </p>
              </div>
            </div>
          </div>

          {/* KHỐI CARD KẾT THÚC LỨA */}
          {canManageBatch && (
            <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200 shadow-xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>Hoàn thành chu kỳ</span>
              </h3>
              <p className="text-xs text-rose-800 leading-relaxed">
                Khi toàn bộ đàn vật nuôi đã được xuất bán hết hoặc chuyển sang chuồng khác, bấm Kết thúc lứa để giải phóng chuồng và lưu trữ lịch sử lứa nuôi.
              </p>
              <Button
                variant="outline"
                size="sm"
                icon={<XSquare className="h-4 w-4 text-white" />}
                onClick={() => onOpenCloseBatchModal?.(barn)}
                className="w-full text-xs font-black bg-rose-600 hover:bg-rose-700 text-white border-transparent shadow-xs py-2.5"
              >
                Kết thúc lứa nuôi
              </Button>
            </div>
          )}
        </div>

        {/* =========================================================================
            3. CỘT PHẢI (70% -> lg:col-span-7) - KỸ THUẬT, QUY TRÌNH, NHẬT KÝ & THU HOẠCH
           ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* KHỐI 1: BẢNG 10 CHỈ SỐ KỸ THUẬT & NÚT MỤC TIÊU */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  <span>Bảng 10 Chỉ Số Kỹ Thuật Đàn</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Dữ liệu tăng trưởng, FCR tiêu tốn và hiệu quả sử dụng thức ăn thời gian thực
                </p>
              </div>

              {/* Nút Mục tiêu mở modal */}
              {canManageBatch && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Settings className="h-3.5 w-3.5 text-slate-600" />}
                  onClick={() => {
                    setTargetsForm({
                      fcrTarget: targets.fcrTarget,
                      costPerKgTarget: targets.costPerKgTarget,
                      maxMortalityPct: targets.maxMortalityPct,
                      expectedHarvestWeightKg: targets.expectedHarvestWeightKg,
                    });
                    setIsTargetsModalOpen(true);
                  }}
                  className="text-xs font-bold border-slate-300 hover:bg-slate-50 shadow-2xs"
                >
                  Mục tiêu
                </Button>
              )}
            </div>

            {/* LƯỚI 10 CHỈ SỐ (GRID 2x5) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Ô 1: Ngày nuôi */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Ngày nuôi</span>
                <span className="text-lg font-black text-slate-900 font-mono block">
                  {b.daysOld} ngày
                </span>
                <span className="text-[10px] text-slate-500">Từ ngày vào giống</span>
              </div>

              {/* Ô 2: Tổng đàn */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tổng đàn</span>
                <span className="text-lg font-black text-slate-900 font-mono block">
                  {formatNumber(b.currentQuantity)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">/ {formatNumber(b.initialQuantity)} con</span>
              </div>

              {/* Ô 3: Cân nặng TB */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cân nặng TB</span>
                <span className="text-lg font-black text-emerald-700 font-mono block">
                  {b.currentAvgWeightKg} kg
                </span>
                <span className="text-[10px] text-slate-500">MT: {targets.expectedHarvestWeightKg} kg</span>
              </div>

              {/* Ô 4: Mật độ */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Mật độ</span>
                <span className="text-lg font-black text-slate-900 font-mono block">
                  {overview.currentDensityHeadPerM2}
                </span>
                <span className="text-[10px] text-slate-500">con / m²</span>
              </div>

              {/* Ô 5: FCR */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">FCR Thực tế</span>
                <span className="text-lg font-black text-emerald-800 font-mono block">
                  {b.actualFcr || 1.58}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">MT: {targets.fcrTarget}</span>
              </div>

              {/* Ô 6: Chi phí / kg (Ẩn hoàn toàn khi không có quyền xem tài chính) */}
              {canViewFinancials && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Chi phí / kg</span>
                  <span className="text-sm font-black text-slate-900 font-mono block pt-1">
                    {formatNumber(overview.totalCostPerKg)} đ
                  </span>
                  <span className="text-[10px] text-slate-500">MT: {formatNumber(targets.costPerKgTarget)} đ</span>
                </div>
              )}

              {/* Ô 7: Trọng lượng hiện tại */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Sinh khối đàn</span>
                <span className="text-lg font-black text-slate-900 font-mono block">
                  {formatNumber(overview.currentBiomassKg)} kg
                </span>
                <span className="text-[10px] text-slate-500">Toàn chuồng</span>
              </div>

              {/* Ô 8: Hao hụt */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Hao hụt</span>
                <span className="text-lg font-black text-rose-600 font-mono block">
                  {b.mortalityRate}%
                </span>
                <span className="text-[10px] text-rose-700 font-semibold">{b.deadQuantity} con (MT: ≤{targets.maxMortalityPct}%)</span>
              </div>

              {/* Ô 9: Loại thải */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Loại thải</span>
                <span className="text-lg font-black text-amber-700 font-mono block">
                  {overview.cullHeadCount} con
                </span>
                <span className="text-[10px] text-slate-500">Kém phát triển</span>
              </div>

              {/* Ô 10: Thu hoạch */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Thu hoạch</span>
                <span className="text-lg font-black text-blue-700 font-mono block">
                  {formatNumber(b.harvestedQuantity ?? 0)} con
                </span>
                <span className="text-[10px] text-slate-500">Đã xuất bán</span>
              </div>
            </div>
          </div>

          {/* KHỐI 2: DANH SÁCH VẬT NUÔI / CÁC ĐỢT NHẬP ĐÀN (+ Nhập đàn) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-emerald-600" />
                  <span>Danh Sách Vật Nuôi & Các Đợt Nhập Đàn ({groupsList.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Theo dõi từng lô giống nhập đàn, tỷ lệ biến động và thao tác tách đàn
                </p>
              </div>

              {canManageBatch && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => setIsAddGroupModalOpen(true)}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                >
                  + Nhập đàn
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">Tuổi (tuần)</th>
                    <th className="py-2.5 px-3">Mã SKU</th>
                    <th className="py-2.5 px-3">Giống vật nuôi</th>
                    <th className="py-2.5 px-3 text-right">Ban đầu</th>
                    <th className="py-2.5 px-3 text-right">Hiện tại</th>
                    <th className="py-2.5 px-3 text-right">Cân TB (kg)</th>
                    <th className="py-2.5 px-3">Giới tính</th>
                    <th className="py-2.5 px-3">Nguồn gốc</th>
                    <th className="py-2.5 px-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupsList.map((grp) => (
                    <tr key={grp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                        {grp.weeksOld || 1} tuần
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                        {grp.groupCode}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {grp.breedName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {formatNumber(grp.initialQuantity)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                        {formatNumber(grp.currentQuantity)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">
                        {grp.currentAvgWeightKg || grp.avgInitialWeightKg || 0.045}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {grp.gender === 'MALE' ? 'Đực' : grp.gender === 'FEMALE' ? 'Cái' : 'Hỗn hợp'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {grp.sourceType === 'PURCHASE' ? 'Mua ngoài' : 'Ấp nở nội bộ'}
                      </td>
                      <td className="py-2.5 px-3 text-center space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenSplitModal?.(barn)}
                          className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-bold transition-colors"
                        >
                          Tách đàn
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMortalityReportForm((prev) => ({
                              ...prev,
                              groupId: grp.id,
                            }));
                            setIsReportMortalityModalOpen(true);
                          }}
                          className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-[11px] font-bold transition-colors"
                        >
                          Báo hao hụt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* KHỐI 3: CHƯƠNG TRÌNH NUÔI ÁP DỤNG (+ Chọn thêm) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-600" />
                  <span>Chương Trình Nuôi Áp Dụng ({appliedPrograms.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Quy trình định mức cám tiêu chuẩn và phác đồ vắc-xin phòng bệnh cho lứa
                </p>
              </div>

              {canManageBatch && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Plus className="h-3.5 w-3.5 text-slate-600" />}
                  onClick={() => setIsApplyProgramModalOpen(true)}
                  className="text-xs font-bold border-slate-300 hover:bg-slate-50 shadow-2xs"
                >
                  + Chọn thêm
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {appliedPrograms.map((prog) => (
                <div key={prog.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative group">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1 ${
                        prog.programType === 'FEED' ? 'bg-amber-100 text-amber-800' : 'bg-cyan-100 text-cyan-800'
                      }`}>
                        {prog.programType === 'FEED' ? 'Định mức cám' : 'Lịch vắc-xin'}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {prog.programName}
                      </h4>
                    </div>

                    {canManageBatch && (
                      <button
                        type="button"
                        onClick={() => handleRemoveProgram(prog.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Gỡ bỏ chương trình"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {prog.description || 'Quy trình chuẩn kỹ thuật áp dụng theo từng ngày tuổi'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-semibold">
                    <span>Số mốc áp dụng: <strong className="text-slate-800 font-mono">{prog.milestonesCount} mốc</strong></span>
                    <span>Áp dụng từ: <strong className="text-slate-800">{formatDate(prog.appliedDate)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KHỐI 4: NHẬT KÝ CHI TIẾT TẠI CHUỒNG (4 TAB CON) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span>Nhật Ký Chi Tiết Tại Chuồng</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Lịch sử khẩu phần thức ăn, thao tác tiêm phòng và chỉ số môi trường
                </p>
              </div>

              {/* 4 Tabs: Thức ăn | Việc đã làm | Thông số vật nuôi | Thông số môi trường */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto gap-1">
                <button
                  type="button"
                  onClick={() => setLogTab('FEED')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                    logTab === 'FEED' ? 'bg-white text-emerald-800 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Thức ăn
                </button>
                <button
                  type="button"
                  onClick={() => setLogTab('TASKS')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                    logTab === 'TASKS' ? 'bg-white text-emerald-800 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Việc đã làm
                </button>
                <button
                  type="button"
                  onClick={() => setLogTab('ANIMAL')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                    logTab === 'ANIMAL' ? 'bg-white text-emerald-800 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Thông số vật nuôi
                </button>
                <button
                  type="button"
                  onClick={() => setLogTab('ENVIRONMENT')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                    logTab === 'ENVIRONMENT' ? 'bg-white text-emerald-800 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Thông số môi trường
                </button>
              </div>
            </div>

            {/* TAB 1: THỨC ĂN */}
            {logTab === 'FEED' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">Ngày</th>
                      <th className="py-2.5 px-3">Loại cám áp dụng</th>
                      <th className="py-2.5 px-3 text-right">Lượng ăn (kg)</th>
                      <th className="py-2.5 px-3 text-right">Định mức chuẩn (kg)</th>
                      <th className="py-2.5 px-3 text-right">Chênh lệch</th>
                      <th className="py-2.5 px-3">Người ghi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {eventLogs.filter((e) => e.feedAmountKg > 0).map((log) => {
                      const diff = (log.feedAmountKg || 0) - (log.standardFeedKg || 0);
                      return (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-700">{formatDate(log.date)}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">{log.medicineName || 'Cám hỗn hợp chuẩn'}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{log.feedAmountKg}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">{log.standardFeedKg || log.feedAmountKg}</td>
                          <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                            diff > 0 ? 'text-amber-600' : diff < 0 ? 'text-blue-600' : 'text-slate-600'
                          }`}>
                            {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} kg
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{log.authorName || 'Kỹ thuật viên'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: VIỆC ĐÃ LÀM */}
            {logTab === 'TASKS' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">Ngày</th>
                      <th className="py-2.5 px-3">Nội dung công việc</th>
                      <th className="py-2.5 px-3">Thuốc / Vắc-xin dùng</th>
                      <th className="py-2.5 px-3">Phương thức / Liều lượng</th>
                      <th className="py-2.5 px-3">Người thực hiện</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {eventLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-700">{formatDate(log.date)}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{log.description || log.eventType}</td>
                        <td className="py-2.5 px-3 text-slate-700 font-semibold">{log.medicineName || '---'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{log.adminRoute || 'Pha nước uống / Phun sương'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{log.authorName || 'Kỹ thuật viên'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: THÔNG SỐ VẬT NUÔI */}
            {logTab === 'ANIMAL' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">Ngày</th>
                      <th className="py-2.5 px-3 text-right">Cân nặng TB (kg)</th>
                      <th className="py-2.5 px-3 text-right">ADG (g/ngày)</th>
                      <th className="py-2.5 px-3 text-right">Số con chết</th>
                      <th className="py-2.5 px-3 text-right">Loại thải</th>
                      <th className="py-2.5 px-3">Lý do nghi ngờ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {eventLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-700">{formatDate(log.date)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">{log.sampleWeightKg || b.currentAvgWeightKg}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700 font-semibold">{b.adgGrams || 58} g</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">{log.deadCount || 0}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-700">{log.cullCount || 0}</td>
                        <td className="py-2.5 px-3 text-slate-500">{log.diseaseReason || 'Hao hụt sinh lý bình thường'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: THÔNG SỐ MÔI TRƯỜNG */}
            {logTab === 'ENVIRONMENT' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-800 block">Nhiệt độ hiện tại</span>
                      <span className="text-xl font-black text-amber-900 font-mono">27.5 °C</span>
                      <span className="text-[10px] text-amber-700 block mt-0.5">Ngưỡng chuẩn: 24 - 29 °C</span>
                    </div>
                    <Thermometer className="h-6 w-6 text-amber-600" />
                  </div>

                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-800 block">Độ ẩm không khí</span>
                      <span className="text-xl font-black text-blue-900 font-mono">68 %</span>
                      <span className="text-[10px] text-blue-700 block mt-0.5">Ngưỡng chuẩn: 60 - 75 %</span>
                    </div>
                    <Droplets className="h-6 w-6 text-blue-600" />
                  </div>

                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">Nồng độ Khí NH₃</span>
                      <span className="text-xl font-black text-emerald-900 font-mono">12 ppm</span>
                      <span className="text-[10px] text-emerald-700 block mt-0.5">An toàn: &lt; 20 ppm</span>
                    </div>
                    <Wind className="h-6 w-6 text-emerald-600" />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Nồng độ CO₂</span>
                      <span className="text-xl font-black text-slate-800 font-mono">1,200 ppm</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">An toàn: &lt; 3,000 ppm</span>
                    </div>
                    <Activity className="h-6 w-6 text-slate-500" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                        <th className="py-2.5 px-3">Ngày giờ</th>
                        <th className="py-2.5 px-3 text-right">Nhiệt độ (°C)</th>
                        <th className="py-2.5 px-3 text-right">Độ ẩm (%)</th>
                        <th className="py-2.5 px-3 text-right">Khí NH₃ (ppm)</th>
                        <th className="py-2.5 px-3 text-right">Khí CO₂ (ppm)</th>
                        <th className="py-2.5 px-3">Trạng thái an toàn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {eventLogs.map((log) => {
                        const tempOk = !log.temperatureC || (log.temperatureC >= 22 && log.temperatureC <= 32);
                        const nh3Ok = !log.nh3Ppm || log.nh3Ppm <= 20;
                        const isSafe = tempOk && nh3Ok;

                        return (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-700">{formatDate(log.date)}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{log.temperatureC || 27.5}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700">{log.humidityPct || 68}%</td>
                            <td className={`py-2.5 px-3 text-right font-mono font-bold ${nh3Ok ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {log.nh3Ppm || 12}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">{log.co2Ppm || 1200}</td>
                            <td className="py-2.5 px-3">
                              {isSafe ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Tối ưu</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Vượt ngưỡng</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* KHỐI 5: THU HOẠCH (NẰM NGAY DƯỚI KHỐI NHẬT KÝ) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-emerald-600" />
                  <span>Thu Hoạch & Doanh Thu Bán Hàng</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Tổng hợp sản lượng xuất chuồng, phiếu xuất bán thịt và phụ thu phân bón
                </p>
              </div>

              {/* 2 Sub-tabs: Vật nuôi & Phụ thu */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
                <button
                  type="button"
                  onClick={() => setHarvestTab('LIVESTOCK')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    harvestTab === 'LIVESTOCK' ? 'bg-white text-emerald-800 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Vật nuôi
                </button>
                <button
                  type="button"
                  onClick={() => setHarvestTab('BY_PRODUCTS')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    harvestTab === 'BY_PRODUCTS' ? 'bg-white text-emerald-800 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Phụ thu ({byProducts.length})
                </button>
              </div>
            </div>

            {/* TAB VẬT NUÔI */}
            {harvestTab === 'LIVESTOCK' && (
              <div className="space-y-4">
                {/* Khối thông số tổng hợp trên cùng */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">Sản lượng (kg)</span>
                    <span className="text-base font-black text-emerald-900 font-mono">
                      {formatNumber(harvestRecords.reduce((sum, h) => sum + (h.totalWeightKg || 0), 0))} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">Số con xuất bán</span>
                    <span className="text-base font-black text-emerald-900 font-mono">
                      {formatNumber(harvestRecords.reduce((sum, h) => sum + (h.quantityHead || 0), 0))} con
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">Loại thải (kg)</span>
                    <span className="text-base font-black text-amber-900 font-mono">
                      {formatNumber(harvestRecords.filter(h => h.harvestType === 'CULL').reduce((sum, h) => sum + (h.totalWeightKg || 0), 0))} kg
                    </span>
                  </div>
                  {canViewFinancials && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-600 block">Giá vốn TB / kg</span>
                      <span className="text-base font-black text-slate-800 font-mono">
                        {formatNumber(overview.totalCostPerKg)} đ
                      </span>
                    </div>
                  )}
                  {canViewFinancials && (
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">Tổng tiền bán</span>
                      <span className="text-base font-black text-emerald-700 font-mono">
                        {formatCurrency(harvestRecords.reduce((sum, h) => sum + (h.totalRevenue || 0), 0))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bảng chi tiết các đợt xuất bán */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                        <th className="py-2.5 px-3">Ngày xuất</th>
                        <th className="py-2.5 px-3">Mã đơn / Phiếu</th>
                        <th className="py-2.5 px-3">Đợt nhập đàn</th>
                        <th className="py-2.5 px-3 text-right">Số con</th>
                        <th className="py-2.5 px-3 text-right">Tổng kg</th>
                        {canViewFinancials && <th className="py-2.5 px-3 text-right">Giá bán / kg</th>}
                        {canViewFinancials && <th className="py-2.5 px-3 text-right">Thành tiền</th>}
                        <th className="py-2.5 px-3">Hình thức</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {harvestRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-700">{formatDate(rec.harvestDate)}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">{rec.orderCode}</td>
                          <td className="py-2.5 px-3 text-slate-700 font-mono">{rec.groupCode}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatNumber(rec.quantityHead)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-semibold">{rec.totalWeightKg}</td>
                          {canViewFinancials && (
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatNumber(rec.salePrice)} đ</td>
                          )}
                          {canViewFinancials && (
                            <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700">{formatCurrency(rec.totalRevenue)}</td>
                          )}
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.harvestType === 'HARVEST' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {rec.harvestType === 'HARVEST' ? 'Bán thịt' : 'Loại thải'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB PHỤ THU */}
            {harvestTab === 'BY_PRODUCTS' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Khoản thu từ bán phân chuồng hoai mục, bao bì thức ăn rỗng hoặc phế phụ phẩm của chuồng
                  </p>
                  {canManageBatch && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus className="h-3.5 w-3.5" />}
                      onClick={() => setIsAddByProductModalOpen(true)}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      + Thêm phụ thu
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                        <th className="py-2.5 px-3">Ngày ghi</th>
                        <th className="py-2.5 px-3">Tên mặt hàng phụ thu</th>
                        <th className="py-2.5 px-3 text-right">Số lượng</th>
                        <th className="py-2.5 px-3">Đơn vị</th>
                        <th className="py-2.5 px-3 text-right">Đơn giá</th>
                        <th className="py-2.5 px-3 text-right">Tổng thành tiền</th>
                        <th className="py-2.5 px-3">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {byProducts.map((bp) => (
                        <tr key={bp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-700">{formatDate(bp.recordDate)}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{bp.itemName}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">{formatNumber(bp.quantity)}</td>
                          <td className="py-2.5 px-3 text-slate-600">{bp.unit}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatNumber(bp.unitPrice)} đ</td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700">{formatCurrency(bp.totalAmount)}</td>
                          <td className="py-2.5 px-3 text-slate-500 italic">{bp.note || '---'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODALS
         ========================================================================= */}

      {/* MODAL 1: CÀI ĐẶT MỤC TIÊU KỸ THUẬT */}
      {isTargetsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Settings className="h-5 w-5 text-emerald-600" />
                <span>Cài Đặt Mục Tiêu Kỹ Thuật Lứa Nuôi</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTargetsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTargets} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">FCR Mục Tiêu (Hệ số tiêu tốn thức ăn)</label>
                <input
                  type="number"
                  step="0.01"
                  value={targetsForm.fcrTarget}
                  onChange={(e) => setTargetsForm({ ...targetsForm, fcrTarget: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="text-[10px] text-slate-400">VD: 1.62 đối với gà thịt CP / Ross 308</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chi Phí / kg Mục Tiêu (VNĐ / kg thịt)</label>
                <input
                  type="number"
                  step="500"
                  value={targetsForm.costPerKgTarget}
                  onChange={(e) => setTargetsForm({ ...targetsForm, costPerKgTarget: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="text-[10px] text-slate-400">VD: 32.500 đ / kg</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tỷ Lệ Hao Hụt Tối Đa Cho Phép (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={targetsForm.maxMortalityPct}
                  onChange={(e) => setTargetsForm({ ...targetsForm, maxMortalityPct: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="text-[10px] text-slate-400">VD: 3.5%</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Trọng Lượng Xuất Chuồng Kỳ Vọng (kg / con)</label>
                <input
                  type="number"
                  step="0.05"
                  value={targetsForm.expectedHarvestWeightKg}
                  onChange={(e) => setTargetsForm({ ...targetsForm, expectedHarvestWeightKg: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="text-[10px] text-slate-400">VD: 2.8 kg</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTargetsModalOpen(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Lưu Mục Tiêu
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NHẬP ĐÀN BỔ SUNG */}
      {isAddGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-600" />
                <span>Nhập Bổ Sung Đợt Con Giống Vào Chuồng</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddGroupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddGroup} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mã Lô Giống / SKU</label>
                <input
                  type="text"
                  value={addGroupForm.groupCode}
                  onChange={(e) => setAddGroupForm({ ...addGroupForm, groupCode: e.target.value })}
                  placeholder={`VD: ${b.code}-G2`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên Giống Vật Nuôi</label>
                <input
                  type="text"
                  value={addGroupForm.breedName}
                  onChange={(e) => setAddGroupForm({ ...addGroupForm, breedName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số Lượng Nhập (con)</label>
                  <input
                    type="number"
                    value={addGroupForm.quantity}
                    onChange={(e) => setAddGroupForm({ ...addGroupForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đơn Giá Giống (VNĐ/con)</label>
                  <input
                    type="number"
                    value={addGroupForm.unitPrice}
                    onChange={(e) => setAddGroupForm({ ...addGroupForm, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cân Nặng Ban Đầu (kg/con)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={addGroupForm.avgInitialWeightKg}
                    onChange={(e) => setAddGroupForm({ ...addGroupForm, avgInitialWeightKg: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tuổi Khi Nhập (Tuần)</label>
                  <input
                    type="number"
                    value={addGroupForm.weeksOld}
                    onChange={(e) => setAddGroupForm({ ...addGroupForm, weeksOld: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giới Tính</label>
                  <select
                    value={addGroupForm.gender}
                    onChange={(e) => setAddGroupForm({ ...addGroupForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="MIXED">Hỗn hợp trống mái</option>
                    <option value="MALE">Trống / Đực</option>
                    <option value="FEMALE">Mái / Cái</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nguồn Gốc</label>
                  <select
                    value={addGroupForm.sourceType}
                    onChange={(e) => setAddGroupForm({ ...addGroupForm, sourceType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PURCHASE">Mua từ nhà cung cấp</option>
                    <option value="INTERNAL">Ấp nở trại giống nội bộ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ngày Thả Giống</label>
                <input
                  type="date"
                  value={addGroupForm.entryDate}
                  onChange={(e) => setAddGroupForm({ ...addGroupForm, entryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddGroupModalOpen(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Xác Nhận Nhập Đàn
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CHỌN THÊM CHƯƠNG TRÌNH NUÔI */}
      {isApplyProgramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-600" />
                <span>Chọn Thêm Quy Trình Nuôi Cho Lứa</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsApplyProgramModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveApplyProgram} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn Quy Trình Từ Thiết Lập Chăn Nuôi</label>
                <select
                  value={applyProgramForm.programId}
                  onChange={(e) => setApplyProgramForm({ ...applyProgramForm, programId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="" disabled>-- Chọn quy trình kỹ thuật --</option>
                  {programsList
                    .filter((prog) => {
                      const isSwine = batchDetail?.livestockType === 'SWINE' || batchDetail?.species === 'SWINE';
                      const pSpecies = String(prog.species || prog.livestockType || '').toUpperCase();
                      const pName = String(prog.name || '').toUpperCase();
                      if (isSwine) {
                        return pSpecies.includes('SWINE') || pSpecies.includes('PIG') || pName.includes('HEO') || pName.includes('LỢN');
                      }
                      return pSpecies.includes('POULTRY') || pSpecies.includes('BIRD') || pName.includes('GÀ') || pName.includes('VỊT') || pName.includes('ROSS');
                    })
                    .map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.name} ({prog.type === 'FEED' ? 'Định mức cám' : 'Lịch vắc-xin'})
                      </option>
                  ))}
                  {programsList.length === 0 && (
                    <>
                      <option value="1">Quy trình Cám Gà Thịt CP Chuẩn (0-42 ngày)</option>
                      <option value="2">Lịch tiêm phòng Vắc-xin & Phòng dịch 45 ngày</option>
                      <option value="3">Quy trình Cám Heo Cai Sữa Giai Đoạn 1</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mô Tả / Ghi Chú Riêng Cho Lứa Này</label>
                <textarea
                  rows={3}
                  value={applyProgramForm.description}
                  onChange={(e) => setApplyProgramForm({ ...applyProgramForm, description: e.target.value })}
                  placeholder="Ghi chú điều chỉnh định mức hoặc chỉ định kỹ thuật..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsApplyProgramModalOpen(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Áp Dụng Quy Trình
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: GHI NHẬN PHỤ THU (BÁN PHÂN, BAO BÌ) */}
      {isAddByProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-600" />
                <span>Ghi Nhận Khoản Phụ Thu (Phân Bón, Bao Bì)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddByProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddByProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên Mặt Hàng Phụ Thu</label>
                <select
                  value={byProductForm.itemName}
                  onChange={(e) => setByProductForm({ ...byProductForm, itemName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="Bao bì thức ăn đã qua sử dụng">Bao bì thức ăn đã qua sử dụng (Vỏ bao rỗng)</option>
                  <option value="Phân chuồng ủ hoai mục">Phân chuồng ủ hoai mục</option>
                  <option value="Độn lót chuồng trấu đã qua sử dụng">Độn lót chuồng trấu đã qua sử dụng</option>
                  <option value="Khác">Phế phụ phẩm chăn nuôi khác</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số Lượng</label>
                  <input
                    type="number"
                    value={byProductForm.quantity}
                    onChange={(e) => setByProductForm({ ...byProductForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đơn Vị Tính</label>
                  <input
                    type="text"
                    value={byProductForm.unit}
                    onChange={(e) => setByProductForm({ ...byProductForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đơn Giá Bán (VNĐ)</label>
                  <input
                    type="number"
                    value={byProductForm.unitPrice}
                    onChange={(e) => setByProductForm({ ...byProductForm, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tổng Tiền (Tự tính)</label>
                  <input
                    type="text"
                    readOnly
                    value={formatCurrency(Number(byProductForm.quantity || 0) * Number(byProductForm.unitPrice || 0))}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ngày Ghi Nhận</label>
                <input
                  type="date"
                  value={byProductForm.recordDate}
                  onChange={(e) => setByProductForm({ ...byProductForm, recordDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi Chú</label>
                <input
                  type="text"
                  value={byProductForm.note}
                  onChange={(e) => setByProductForm({ ...byProductForm, note: e.target.value })}
                  placeholder="Người mua, đơn vị thu gom phế liệu..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddByProductModalOpen(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Ghi Nhận Phụ Thu
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: LỊCH SỬ LỨA CŨ */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                <span>Lịch Sử Các Lứa Nuôi Cũ Tại {barn?.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto text-xs max-h-80">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">Mã lứa</th>
                    <th className="py-2.5 px-3">Giống</th>
                    <th className="py-2.5 px-3">Thời gian nuôi</th>
                    <th className="py-2.5 px-3 text-right">Ban đầu</th>
                    <th className="py-2.5 px-3 text-right">Xuất chuồng</th>
                    <th className="py-2.5 px-3 text-right">FCR</th>
                    <th className="py-2.5 px-3 text-right">Lợi nhuận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">LUA-2026-T08</td>
                    <td className="py-2.5 px-3">Gà Ross 308</td>
                    <td className="py-2.5 px-3 text-slate-500">15/08 - 28/09/2026 (44 ngày)</td>
                    <td className="py-2.5 px-3 text-right font-mono">2,000</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">1,910</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">1.59</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700">+28,450,000 đ</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">LUA-2026-T06</td>
                    <td className="py-2.5 px-3">Gà Ross 308</td>
                    <td className="py-2.5 px-3 text-slate-500">01/06 - 15/07/2026 (45 ngày)</td>
                    <td className="py-2.5 px-3 text-right font-mono">2,000</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">1,895</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">1.61</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700">+25,120,000 đ</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryModalOpen(false)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: SỬA THÔNG TIN CHUỒNG */}
      {isEditBarnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-emerald-600" />
                <span>Sửa Thông Tin Chuồng Nuôi</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditBarnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditBarn} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên Chuồng</label>
                <input
                  type="text"
                  value={editBarnForm.name}
                  onChange={(e) => setEditBarnForm({ ...editBarnForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Diện Tích (m²)</label>
                  <input
                    type="number"
                    value={editBarnForm.areaM2}
                    onChange={(e) => setEditBarnForm({ ...editBarnForm, areaM2: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sức Chứa Tối Đa (con)</label>
                  <input
                    type="number"
                    value={editBarnForm.capacity}
                    onChange={(e) => setEditBarnForm({ ...editBarnForm, capacity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {(() => {
                const targetZone = zones.find((z) => Number(z.id) === Number(barn.zoneId));
                if (!targetZone || !targetZone.areaM2) return null;
                const otherBarns = allBarns.filter(
                  (b) => Number(b.zoneId) === Number(barn.zoneId) && Number(b.id) !== Number(barn.id)
                );
                const otherBarnsArea = otherBarns.reduce((sum, b) => sum + (Number(b.areaM2) || 0), 0);
                const maxAllowedArea = Math.max(0, Number(targetZone.areaM2) - otherBarnsArea);
                const requestedArea = Number(editBarnForm.areaM2) || 0;
                const isExceeded = otherBarnsArea + requestedArea > Number(targetZone.areaM2);
                return (
                  <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                    isExceeded
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-blue-50/70 border-blue-200 text-blue-900'
                  }`}>
                    <div className="flex items-center justify-between font-bold">
                      <span>Khu nuôi: {targetZone.name} (Tổng: {targetZone.areaM2} m²)</span>
                      {isExceeded ? (
                        <span className="text-rose-600 flex items-center gap-1 font-black">
                          <AlertTriangle className="h-4 w-4" /> Vượt quá diện tích khu!
                        </span>
                      ) : (
                        <span className="text-blue-700 font-semibold">
                          Tối đa cho chuồng: <strong>{maxAllowedArea} m²</strong>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 flex justify-between">
                      <span>Các chuồng khác: <strong>{otherBarnsArea} m²</strong></span>
                      <span>Tổng sau sửa: <strong>{otherBarnsArea + requestedArea} / {targetZone.areaM2} m²</strong></span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mô Tả Đặc Tính Chuồng</label>
                <textarea
                  rows={3}
                  value={editBarnForm.description}
                  onChange={(e) => setEditBarnForm({ ...editBarnForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditBarnModalOpen(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Lưu Thông Tin Chuồng
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: SỬA TÊN LỨA & NGÀY BẮT ĐẦU */}
      {isEditBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-emerald-600" />
                <span>Sửa Tên Lứa & Ngày Bắt Đầu</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsEditBatchModalOpen(false);
                onRefresh?.();
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên / Mã Lứa Nuôi</label>
                <input
                  type="text"
                  value={editBatchForm.batchName}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, batchName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ngày Thả Giống / Bắt Đầu</label>
                <input
                  type="date"
                  value={editBatchForm.startDate}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditBatchModalOpen(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Lưu Thay Đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: BÁO HAO HỤT NHANH */}
      {isReportMortalityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-rose-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <span>Báo Cáo Hao Hụt & Chết Đột Xuất</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsReportMortalityModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsReportMortalityModalOpen(false);
                onRefresh?.();
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số Lượng Chết (con)</label>
                  <input
                    type="number"
                    value={mortalityReportForm.deadCount}
                    onChange={(e) => setMortalityReportForm({ ...mortalityReportForm, deadCount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-rose-500 font-bold text-rose-700"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Loại Thải Còi Cọc (con)</label>
                  <input
                    type="number"
                    value={mortalityReportForm.cullCount}
                    onChange={(e) => setMortalityReportForm({ ...mortalityReportForm, cullCount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500 font-bold text-amber-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nguyên Nhân Nghi Ngờ</label>
                <input
                  type="text"
                  value={mortalityReportForm.reason}
                  onChange={(e) => setMortalityReportForm({ ...mortalityReportForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ngày Ghi Nhận</label>
                <input
                  type="date"
                  value={mortalityReportForm.date}
                  onChange={(e) => setMortalityReportForm({ ...mortalityReportForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReportMortalityModalOpen(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Xác Nhận Hao Hụt
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BarnBatchDetailView;
