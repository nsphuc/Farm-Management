import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layers,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
  Building,
  Clock,
  Sparkles,
  Info,
  ChevronLeft,
  Syringe,
  Scale,
  DollarSign,
  PieChart,
  Users,
  Feather,
  ArrowUpRight,
  ArrowDownRight,
  Split,
  ShoppingBag,
  CheckSquare,
  XSquare,
  Thermometer,
  FileText,
  Trash2,
  Pencil,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { formatNumber, formatDate } from '@/utils/formatters';
import { barnBatchService } from '@/services/modules/barnBatchService';
import { livestockSettingsService } from '@/services/modules/livestockSettingsService';
import { dailyLogService } from '@/services/modules/dailyLogService';
import { BarnBatchDetailView } from './components/BarnBatchDetailView';

// ================= DỮ LIỆU MẪU CHUẨN THỰC CHIẾN FARMGO =================

const DEFAULT_LIVESTOCK_PROGRAMS = [
  {
    id: 1,
    name: 'Quy trình Gà thịt Ross 308 (45 ngày)',
    species: 'POULTRY',
    livestockType: 'POULTRY',
    livestockTypeName: 'Gia cầm thịt',
    breedName: 'Gà trắng công nghiệp Ross 308 / CP',
    totalDays: 45,
    targetWeightKg: 2.8,
    fcrTarget: 1.65,
    adgTarget: 62,
    initialAvgWeight: 0.045,
    seedUnitPrice: 15000,
  },
  {
    id: 2,
    name: 'Quy trình Heo thịt 120 ngày (Duroc x Landrace x Yorkshire)',
    species: 'SWINE',
    livestockType: 'SWINE',
    livestockTypeName: 'Gia súc thịt',
    breedName: 'Heo ngoại 3 máu thương phẩm',
    totalDays: 120,
    targetWeightKg: 110.0,
    fcrTarget: 2.45,
    adgTarget: 850,
    initialAvgWeight: 7.0,
    seedUnitPrice: 1300000,
  },
  {
    id: 3,
    name: 'Quy trình Vịt siêu thịt Cherry Valley (48 ngày)',
    species: 'POULTRY',
    livestockType: 'POULTRY',
    livestockTypeName: 'Gia cầm thịt',
    breedName: 'Vịt siêu nạc Cherry Valley',
    totalDays: 48,
    targetWeightKg: 3.4,
    fcrTarget: 1.95,
    adgTarget: 70,
    initialAvgWeight: 0.055,
    seedUnitPrice: 18000,
  },
];

const resolveBranchLivestockType = (branch) => {
  if (!branch) return 'POULTRY';
  const type = String(branch.livestockType || '').toUpperCase();
  const name = String(branch.name || '').toUpperCase();
  if (type.includes('SWINE') || type.includes('LIVESTOCK') || type.includes('HEO') || name.includes('HEO') || name.includes('LỢN') || name.includes('LON')) {
    return 'SWINE';
  }
  if (type.includes('POULTRY') || type.includes('GIA_CAM') || type.includes('GA') || name.includes('GÀ') || name.includes('GA') || name.includes('VỊT') || name.includes('VIT')) {
    return 'POULTRY';
  }
  return 'POULTRY';
};

const INITIAL_ZONES_DATA = [
  { id: 1, code: 'KHU_A', name: 'Khu A - Gà thịt CP', livestockType: 'POULTRY', description: 'Chuồng kín hầm lạnh 2.000m²' },
  { id: 2, code: 'KHU_B', name: 'Khu B - Heo thịt thương phẩm', livestockType: 'SWINE', description: 'Chuồng lạnh khép kín máng ăn tự động' },
  { id: 3, code: 'KHU_C', name: 'Khu C - Vịt siêu thịt', livestockType: 'POULTRY', description: 'Chuồng sàn có sân chơi tiêu chuẩn' },
];

const INITIAL_BARNS_DATA = [
  {
    id: 101,
    code: 'CHUONG_A1',
    name: 'Chuồng A1',
    zoneId: 1,
    zoneName: 'Khu A - Gà thịt CP',
    status: 'ACTIVE',
    capacity: 2000,
    areaM2: 180,
    batch: {
      id: 501,
      batchCode: 'LUA-GA-T11-01',
      batchName: 'Lứa Gà Thịt CP T11',
      livestockType: 'POULTRY',
      breedName: 'Gà trắng Ross 308',
      startDate: '2026-10-18',
      initialQuantity: 2000,
      currentQuantity: 1950,
      mortalityCount: 50,
      mortalityRatePct: 2.5,
      currentAgeDays: 28,
      programName: 'Quy trình Gà thịt 45 ngày (CP / Ross 308)',
      currentWeightKg: 1.52,
      targetWeightKg: 2.80,
      fcrCurrent: 1.58,
      fcrTarget: 1.65,
      adgCurrentGram: 64.2,
      totalFeedConsumedKg: 4250,
      feedStandardDailyKg: 280,
      feedActualTodayKg: 295,
      isFeedOverLimit: true,
      vaccineAlert: 'Hôm nay: Tiêm / Nhỏ vắc-xin Gumboro lần 2',
      alertLevel: 'WARNING',
      logsTimeline: [
        { id: 1, date: '2026-10-18', type: 'IMPORT', title: 'Nhập đàn 2.000 con giống', details: 'Trọng lượng 0.045 kg/con, giá 15.000 đ/con. Đã tiêm Marek.' },
        { id: 2, date: '2026-10-22', type: 'VACCINE', title: 'Nhỏ mắt ND-IB lần 1', details: 'Nhỏ mắt 2.000 con, theo dõi sau nhỏ đàn ăn mạnh.' },
        { id: 3, date: '2026-10-28', type: 'VACCINE', title: 'Uống vắc-xin Gumboro D78', details: 'Cắt nước 2h trước uống, pha cùng sữa gầy bảo vệ vắc-xin.' },
        { id: 4, date: '2026-11-01', type: 'WEIGHT', title: 'Cân mẫu 50 con (14 ngày tuổi)', details: 'Trọng lượng bình quân 0.46 kg/con. Chuyển sang Cám GĐ2.' },
        { id: 5, date: '2026-11-05', type: 'MORTALITY', title: 'Báo chết 8 con (Tiêu chảy E.coli)', details: 'Phân sệt vàng, đã cách ly và cấp men tiêu hóa + Amox.' },
        { id: 6, date: '2026-11-12', type: 'SPLIT', title: 'Tách đàn 200 con sang Chuồng A2', details: 'Giảm mật độ chuồng, phân bổ chi phí sang chuồng A2.' },
        { id: 7, date: '2026-11-15', type: 'FEED', title: 'Cho ăn hôm nay: 295 kg cám GĐ2', details: 'Đàn ăn mạnh, vượt định mức 15kg cám, sức khỏe tốt.' },
      ],
      materialsUsed: [
        { id: 1, name: 'Cám Gà Con GĐ1 (0-14 ngày)', qty: 1250, unit: 'kg', unitPrice: 14500, totalCost: 18125000 },
        { id: 2, name: 'Cám Gà Thịt GĐ2 (15-28 ngày)', qty: 3000, unit: 'kg', unitPrice: 13800, totalCost: 41400000 },
        { id: 3, name: 'Vắc-xin Marek, ND-IB, Gumboro', qty: 6, unit: 'lọ', unitPrice: 320000, totalCost: 1920000 },
        { id: 4, name: 'Men tiêu hóa & Kháng sinh phòng', qty: 12, unit: 'gói/chai', unitPrice: 185000, totalCost: 2220000 },
      ],
      financialPnL: {
        totalRevenue: 29700000,
        partialSales: [
          { date: '2026-11-10', buyer: 'Thương lái Miền Đông', qty: 300, weightKg: 660, unitPrice: 45000, totalAmount: 29700000 },
        ],
        seedCost: 30000000,
        feedCost: 59525000,
        medCost: 4140000,
        utilCost: 4500000,
        laborCost: 5000000,
        totalExpenses: 103165000,
        estimatedStockValue: 124488000,
        estimatedGrossProfit: 21323000,
        estimatedCostPerKg: 34812,
      },
    },
  },
  {
    id: 102,
    code: 'CHUONG_A2',
    name: 'Chuồng A2',
    zoneId: 1,
    zoneName: 'Khu A - Gà thịt CP',
    status: 'ACTIVE',
    capacity: 2000,
    areaM2: 180,
    batch: {
      id: 502,
      batchCode: 'LUA-GA-T11-02',
      batchName: 'Lứa Gà Thịt Nhánh A2',
      livestockType: 'POULTRY',
      breedName: 'Gà trắng Ross 308',
      startDate: '2026-11-12',
      initialQuantity: 200,
      currentQuantity: 198,
      mortalityCount: 2,
      mortalityRatePct: 1.0,
      currentAgeDays: 28,
      programName: 'Quy trình Gà thịt 45 ngày (CP / Ross 308)',
      currentWeightKg: 1.50,
      targetWeightKg: 2.80,
      fcrCurrent: 1.56,
      fcrTarget: 1.65,
      adgCurrentGram: 63.5,
      totalFeedConsumedKg: 460,
      feedStandardDailyKg: 30,
      feedActualTodayKg: 30,
      isFeedOverLimit: false,
      vaccineAlert: null,
      alertLevel: 'NORMAL',
      logsTimeline: [
        { id: 1, date: '2026-11-12', type: 'SPLIT', title: 'Nhận tách đàn 200 con từ Chuồng A1', details: 'Sĩ số ban đầu 200 con, đàn ổn định.' },
      ],
      materialsUsed: [
        { id: 1, name: 'Cám Gà Thịt GĐ2 (15-28 ngày)', qty: 460, unit: 'kg', unitPrice: 13800, totalCost: 6348000 },
      ],
      financialPnL: {
        totalRevenue: 0,
        partialSales: [],
        seedCost: 3000000,
        feedCost: 6348000,
        medCost: 400000,
        utilCost: 500000,
        laborCost: 600000,
        totalExpenses: 10848000,
        estimatedStockValue: 12474000,
        estimatedGrossProfit: 1626000,
        estimatedCostPerKg: 36525,
      },
    },
  },
  {
    id: 103,
    code: 'CHUONG_A3',
    name: 'Chuồng A3 - Trống',
    zoneId: 1,
    zoneName: 'Khu A - Gà thịt CP',
    status: 'EMPTY',
    capacity: 2500,
    areaM2: 200,
    sanitized: true,
    restDays: 7,
    batch: null,
  },
  {
    id: 104,
    code: 'CHUONG_B1',
    name: 'Chuồng B1 (Heo thịt)',
    zoneId: 2,
    zoneName: 'Khu B - Heo thịt thương phẩm',
    status: 'ACTIVE',
    capacity: 300,
    areaM2: 320,
    batch: {
      id: 503,
      batchCode: 'LUA-HEO-H10',
      batchName: 'Lứa Heo Thịt 3 Máu H10',
      livestockType: 'SWINE',
      breedName: 'Heo ngoại Duroc x Landrace x Yorkshire',
      startDate: '2026-08-25',
      initialQuantity: 280,
      currentQuantity: 275,
      mortalityCount: 5,
      mortalityRatePct: 1.78,
      currentAgeDays: 82,
      programName: 'Quy trình Heo thịt 120 ngày (3 Máu)',
      currentWeightKg: 78.5,
      targetWeightKg: 115.0,
      fcrCurrent: 2.38,
      fcrTarget: 2.40,
      adgCurrentGram: 820.0,
      totalFeedConsumedKg: 46200,
      feedStandardDailyKg: 770,
      feedActualTodayKg: 785,
      isFeedOverLimit: false,
      vaccineAlert: 'Cần tiêm phòng Dịch tả heo lần 2 trong tuần này',
      alertLevel: 'WARNING',
      logsTimeline: [
        { id: 1, date: '2026-08-25', type: 'IMPORT', title: 'Nhập đàn 280 con heo cai sữa', details: 'Trọng lượng 7.2kg/con, giống cấp 1 đạt chuẩn.' },
        { id: 2, date: '2026-09-08', type: 'VACCINE', title: 'Tiêm Mycoplasma và PRRS', details: 'Tiêm bắp cổ sau tai, đàn ăn uống bình thường.' },
        { id: 3, date: '2026-10-15', type: 'FEED', title: 'Chuyển sang Cám Heo Choai Tăng Trọng', details: 'Đàn ăn khỏe, không tiêu chảy.' },
      ],
      materialsUsed: [
        { id: 1, name: 'Cám Heo Tập Ăn (GĐ1)', qty: 6500, unit: 'kg', unitPrice: 19500, totalCost: 126750000 },
        { id: 2, name: 'Cám Heo Choai (GĐ2)', qty: 39700, unit: 'kg', unitPrice: 14200, totalCost: 563740000 },
        { id: 3, name: 'Vắc-xin Suyễn, Tai xanh, Dịch tả', qty: 280, unit: 'liều', unitPrice: 45000, totalCost: 12600000 },
      ],
      financialPnL: {
        totalRevenue: 0,
        partialSales: [],
        seedCost: 364000000,
        feedCost: 690490000,
        medCost: 28500000,
        utilCost: 22000000,
        laborCost: 35000000,
        totalExpenses: 1139990000,
        estimatedStockValue: 1208962500,
        estimatedGrossProfit: 68972500,
        estimatedCostPerKg: 52807,
      },
    },
  },
  {
    id: 105,
    code: 'CHUONG_B2',
    name: 'Chuồng B2 - Trống',
    zoneId: 2,
    zoneName: 'Khu B - Heo thịt thương phẩm',
    status: 'EMPTY',
    capacity: 300,
    areaM2: 320,
    sanitized: true,
    restDays: 14,
    batch: null,
  },
];

export function BarnsPage() {
  const navigate = useNavigate();
  const { barnId, batchId } = useParams();
  const { farms, activeFarmId } = useActiveFarmStore();
  const { userInfo, hasPermission, isOwner, isSuperAdmin } = useAuthStore();

  const currentFarmId = activeFarmId && activeFarmId !== 'ALL' ? Number(activeFarmId) : Number(farms[0]?.id || 1);

  // RBAC & Data Scope
  const currentAccessibleFarm = useMemo(() => {
    return userInfo?.accessibleFarms?.find(
      (f) => Number(f.farmId) === currentFarmId
    );
  }, [userInfo, currentFarmId]);

  const userRoles = (userInfo?.roles || []).map((r) => (typeof r === 'string' ? r : r?.code)).filter(Boolean);
  const isWorker = userRoles.includes('ROLE_BARN_WORKER') || userRoles.includes('ROLE_WORKER') || userRoles.includes('ROLE_FIELD_STAFF');
  const isOwnerOrManager = isOwner?.() || isSuperAdmin?.() || userRoles.includes('ROLE_FARM_OWNER') || userRoles.includes('ROLE_FARM_MANAGER');

  const canManageBarns = isOwnerOrManager || (!isWorker && hasPermission?.('barns.manage'));
  const canManageBatch = isOwnerOrManager || (!isWorker && hasPermission?.('batches.manage'));
  // Chỉ Chủ trại, Kế toán hoặc vai trò không phải Trại trưởng có quyền financial.view_cost / financial.price.view mới xem được Giá vốn & Hạch toán Lãi/Lỗ
  const isOwnerOrAccountant =
    isOwner?.() ||
    isSuperAdmin?.() ||
    userRoles.includes('ROLE_FARM_OWNER') ||
    userRoles.includes('ROLE_ACCOUNTANT');
  const isFarmManagerOnly = userRoles.includes('ROLE_FARM_MANAGER') && !isOwnerOrAccountant;
  const canViewFinancialPnL =
    !isFarmManagerOnly &&
    (isOwnerOrAccountant ||
      hasPermission?.('financial.view_cost') ||
      hasPermission?.('financial.price.view'));

  // Store & Branch
  const currentBranchId = useActiveBranchStore((s) => s.currentBranchId);
  const currentBranch = useActiveBranchStore((s) => s.currentBranch);
  const branches = useActiveBranchStore((s) => s.branches);
  const dataVersion = useActiveBranchStore((s) => s.dataVersion);
  const triggerRefresh = useActiveBranchStore((s) => s.triggerRefresh);

  // State
  const [zones, setZones] = useState([]);
  const [barns, setBarns] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [batchDetailData, setBatchDetailData] = useState(null);

  // Filters màn hình chính
  const [selectedZoneId, setSelectedZoneId] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, ACTIVE, EMPTY, ALERT
  const [searchKeyword, setSearchKeyword] = useState('');

  // Lựa chọn chuồng để xem chi tiết lứa nuôi (kết hợp route param và state)
  const [activeBarnId, setActiveBarnId] = useState(barnId ? Number(barnId) : null);
  const [batchDetailTab, setBatchDetailTab] = useState('OVERVIEW'); // OVERVIEW, TIMELINE, MATERIALS, PNL

  useEffect(() => {
    if (barnId) {
      setActiveBarnId(Number(barnId));
    }
  }, [barnId]);


  // Load real zones, barns, and programs from Backend
  useEffect(() => {
    let isMounted = true;
    const loadRealData = async () => {
      try {
        const effectiveBranchId = currentBranchId === 'ALL' ? undefined : (currentBranchId || 1);
        const [zonesRes, barnsRes, progsRes] = await Promise.all([
          barnBatchService.getZones({ farmId: currentFarmId, branchId: effectiveBranchId }).catch(() => []),
          barnBatchService.getBarns({ farmId: currentFarmId, branchId: effectiveBranchId }).catch(() => []),
          livestockSettingsService.getPrograms(currentFarmId).catch(() => []),
        ]);

        if (isMounted) {
          if (Array.isArray(zonesRes)) {
            setZones(zonesRes);
          }
          if (Array.isArray(barnsRes)) {
            const mappedBarns = barnsRes.map((b) => {
              const hasBatch = b.currentBatch != null;
              return {
                ...b,
                status: hasBatch ? (b.status === 'ALERT' ? 'ALERT' : 'ACTIVE') : 'EMPTY',
                batch: hasBatch
                  ? {
                      id: b.currentBatch.id,
                      batchCode: b.currentBatch.code,
                      batchName: b.currentBatch.code,
                      livestockType: b.currentBatch.species || 'POULTRY',
                      breedName: b.currentBatch.breedName || 'Giống vật nuôi',
                      initialQuantity: b.currentBatch.initialQuantity || 0,
                      currentQuantity: b.currentBatch.currentQuantity || 0,
                      mortalityCount: b.currentBatch.mortalityCount ?? Math.max(0, (b.currentBatch.initialQuantity || 0) - (b.currentBatch.currentQuantity || 0)),
                      mortalityRatePct: b.currentBatch.mortalityRatePct ?? ((b.currentBatch.initialQuantity || 0) > 0
                        ? Number(((Math.max(0, (b.currentBatch.initialQuantity || 0) - (b.currentBatch.currentQuantity || 0)) / b.currentBatch.initialQuantity) * 100).toFixed(1))
                        : 0),
                      currentAgeDays: b.currentBatch.daysOld || 1,
                      currentWeightKg: b.currentBatch.avgWeightKg || 0.1,
                      targetWeightKg: b.currentBatch.targetWeightKg || 2.5,
                      fcrCurrent: b.currentBatch.fcr || 1.65,
                      fcrTarget: b.currentBatch.standardFcr || 1.65,
                      adgCurrentGram: 60,
                      totalFeedConsumedKg: (b.currentBatch.daysOld || 1) * 20,
                      feedStandardDailyKg: 25,
                      feedActualTodayKg: b.currentBatch.feedConsumedTodayKg || 25,
                      isFeedOverLimit: false,
                      vaccineAlert: 'Theo dõi lịch tiêm phòng định kỳ',
                      alertLevel: b.currentBatch.isAlert ? 'WARNING' : 'NORMAL',
                      logsTimeline: [],
                      materialsUsed: [],
                      financialPnL: {
                        totalRevenue: 0,
                        partialSales: [],
                        seedCost: (b.currentBatch.initialQuantity || 1000) * 15000,
                        feedCost: 0,
                        medCost: 0,
                        utilCost: 0,
                        laborCost: 0,
                        totalExpenses: (b.currentBatch.initialQuantity || 1000) * 15000,
                        estimatedStockValue: (b.currentBatch.initialQuantity || 1000) * 15000,
                        estimatedGrossProfit: 0,
                        estimatedCostPerKg: 0,
                      },
                    }
                  : null,
              };
            });
            setBarns(mappedBarns);
          }
          if (Array.isArray(progsRes) && progsRes.length > 0) {
            setProgramsList(progsRes);
          }
        }
      } catch (err) {
        console.warn('Could not load real barns/zones, using fallback data', err);
      }
    };

    loadRealData();
    return () => {
      isMounted = false;
    };
  }, [currentFarmId, currentBranchId, dataVersion]);

  // Load detailed batch data when activeBarnId is selected
  useEffect(() => {
    let isMounted = true;
    const fetchBatchDetail = async () => {
      if (!activeBarnId) {
        setBatchDetailData(null);
        return;
      }
      const barn = barns.find((b) => b.id === activeBarnId);
      if (barn && barn.batch?.id) {
        try {
          const detail = await barnBatchService.getBatchById(barn.batch.id);
          if (isMounted && detail) {
            setBatchDetailData(detail);
          }
        } catch (err) {
          console.warn('Could not fetch batch detail', err);
        }
      }
    };
    fetchBatchDetail();
    return () => {
      isMounted = false;
    };
  }, [activeBarnId, barns, dataVersion]);


  // Áp dụng Data Scope: Nếu user là công nhân chuồng, chỉ hiển thị các chuồng trong allowed_barn_ids
  const scopedBarns = useMemo(() => {
    if (
      currentAccessibleFarm &&
      currentAccessibleFarm.allBarns === false &&
      Array.isArray(currentAccessibleFarm.barnIds) &&
      currentAccessibleFarm.barnIds.length > 0
    ) {
      const allowedSet = new Set(currentAccessibleFarm.barnIds.map(Number));
      return barns.filter((b) => allowedSet.has(Number(b.id)));
    }
    return barns;
  }, [barns, currentAccessibleFarm]);

  // Lọc theo Khu & Trạng thái & Từ khóa
  const filteredBarns = useMemo(() => {
    return scopedBarns.filter((b) => {
      // Lọc theo Khu
      if (selectedZoneId !== 'ALL' && b.zoneId !== Number(selectedZoneId)) return false;

      // Lọc theo Trạng thái
      const isOccupied = b.batch != null && b.status !== 'EMPTY';
      if (filterStatus === 'ACTIVE' && !isOccupied) return false;
      if (filterStatus === 'EMPTY' && isOccupied) return false;
      if (filterStatus === 'ALERT' && (!b.batch || (b.batch.alertLevel !== 'WARNING' && b.batch.alertLevel !== 'DANGER' && b.status !== 'ALERT'))) {
        return false;
      }

      // Lọc theo Từ khóa
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchName = b.name.toLowerCase().includes(kw);
        const matchCode = b.code.toLowerCase().includes(kw);
        const matchBatch = b.batch?.batchName?.toLowerCase().includes(kw);
        if (!matchName && !matchCode && !matchBatch) return false;
      }

      return true;
    });
  }, [scopedBarns, selectedZoneId, filterStatus, searchKeyword]);

  // Chuồng và Lứa nuôi đang xem chi tiết
  const currentDetailBarn = useMemo(() => {
    if (!activeBarnId) return null;
    return barns.find((b) => b.id === activeBarnId) || null;
  }, [barns, activeBarnId]);

  // ================= MODAL STATES =================
  // Modal 1: Bắt đầu lứa nuôi / Nhập đàn
  const [isStartBatchModalOpen, setIsStartBatchModalOpen] = useState(false);
  const [targetBarnForNewBatch, setTargetBarnForNewBatch] = useState(null);
  const [newBatchForm, setNewBatchForm] = useState({
    batchCode: '',
    batchName: '',
    livestockType: 'POULTRY',
    branchName: '',
    programId: '',
    programName: '',
    breedName: '',
    startDate: new Date().toISOString().split('T')[0],
    initialQuantity: 2000,
    initialAvgWeight: 0.045,
    seedUnitPrice: 15000,
  });

  // Lọc danh sách chương trình nuôi liên kết từ Thiết lập chăn nuôi theo Loại vật nuôi của chi nhánh
  const availableProgramsForModal = useMemo(() => {
    const allPrograms = programsList.length > 0 ? programsList : DEFAULT_LIVESTOCK_PROGRAMS;
    const isSwine = newBatchForm.livestockType === 'SWINE';
    const filtered = allPrograms.filter((p) => {
      const pSpecies = String(p.species || p.livestockType || '').toUpperCase();
      const pName = String(p.name || '').toUpperCase();
      const pBreed = String(p.breedName || '').toUpperCase();
      if (isSwine) {
        return (
          pSpecies.includes('SWINE') ||
          pSpecies.includes('PIG') ||
          pSpecies.includes('LIVESTOCK') ||
          pName.includes('HEO') ||
          pName.includes('LỢN') ||
          pName.includes('LON') ||
          pName.includes('DUROC') ||
          pName.includes('LANDRACE') ||
          pName.includes('YORKSHIRE') ||
          pBreed.includes('HEO') ||
          pBreed.includes('LỢN')
        );
      } else {
        return (
          pSpecies.includes('POULTRY') ||
          pSpecies.includes('BIRD') ||
          pSpecies.includes('CHICKEN') ||
          pSpecies.includes('DUCK') ||
          pName.includes('GÀ') ||
          pName.includes('GA') ||
          pName.includes('VỊT') ||
          pName.includes('VIT') ||
          pName.includes('ROSS') ||
          pName.includes('CP') ||
          pName.includes('CHERRY') ||
          pBreed.includes('GÀ') ||
          pBreed.includes('VỊT')
        );
      }
    });

    if (filtered.length > 0) return filtered;

    // Fallback nghiêm ngặt chỉ lấy đúng loại vật nuôi, không bao giờ lấy chéo loại
    return DEFAULT_LIVESTOCK_PROGRAMS.filter((p) =>
      isSwine
        ? (p.species === 'SWINE' || p.species === 'PIG')
        : (p.species === 'POULTRY')
    );
  }, [programsList, newBatchForm.livestockType]);

  // Modal 2: Tách đàn / Chuyển chuồng
  const [isSplitFlockModalOpen, setIsSplitFlockModalOpen] = useState(false);
  const [splitForm, setSplitForm] = useState({
    splitQuantity: 200,
    avgWeightKg: 1.5,
    targetBarnId: '',
    reason: 'Giảm mật độ chuồng nuôi',
  });

  // Modal 3: Kết thúc lứa nuôi (Chốt sổ đóng chuồng)
  const [isCloseBatchModalOpen, setIsCloseBatchModalOpen] = useState(false);
  const [closeConfirmChecked, setCloseConfirmChecked] = useState(false);

  // Modal 4: Ghi nhật ký nhanh
  const [isQuickLogModalOpen, setIsQuickLogModalOpen] = useState(false);
  const [quickLogForm, setQuickLogForm] = useState({
    logDate: new Date().toISOString().split('T')[0],
    feedConsumedKg: 280,
    mortalityCount: 0,
    mortalityReason: 'Tiêu chảy / E.coli',
    medicineUsed: '',
    notes: '',
  });

  // Modal 5: Tạo khu nuôi mới
  const [isCreateZoneModalOpen, setIsCreateZoneModalOpen] = useState(false);
  const [newZoneForm, setNewZoneForm] = useState({
    code: '',
    name: '',
    livestockType: 'POULTRY',
    areaM2: 1500,
    description: '',
  });

  // Modal 5b: Sửa khu nuôi
  const [isEditZoneModalOpen, setIsEditZoneModalOpen] = useState(false);
  const [editZoneForm, setEditZoneForm] = useState({
    id: null,
    name: '',
    livestockType: 'POULTRY',
    areaM2: 1500,
    description: '',
  });

  // Modal 6: Tạo chuồng mới
  const [isCreateBarnModalOpen, setIsCreateBarnModalOpen] = useState(false);
  const [newBarnForm, setNewBarnForm] = useState({
    name: '',
    zoneId: zones[0]?.id || 1,
    capacity: 2000,
    areaM2: 180,
    description: '',
  });

  // Modal 6b: Sửa chuồng mới
  const [isEditBarnModalOpen, setIsEditBarnModalOpen] = useState(false);
  const [editBarnForm, setEditBarnForm] = useState({
    id: null,
    name: '',
    zoneId: 1,
    capacity: 2000,
    areaM2: 180,
    description: '',
  });

  // ================= HANDLERS =================
  const handleOpenStartBatch = (barn) => {
    if (currentBranchId === 'ALL') {
      toast.warning('Bạn đang ở chế độ xem Tổng hợp toàn chuỗi. Vui lòng chọn một chi nhánh cụ thể trên thanh Header để bắt đầu lứa nuôi (nhập đàn)!');
      return;
    }
    setTargetBarnForNewBatch(barn);

    // 1. Xác định chi nhánh của chuồng
    const barnZone = zones.find((z) => Number(z.id) === Number(barn.zoneId));
    const effectiveBranch =
      branches.find((b) => Number(b.id) === Number(barnZone?.branchId || currentBranchId)) ||
      currentBranch;

    // 2. Liên kết Loại vật nuôi theo loại hình chăn nuôi của chi nhánh
    const branchType = resolveBranchLivestockType(effectiveBranch);
    const isSwine = branchType === 'SWINE';

    // 3. Lọc danh sách chương trình nuôi từ Thiết lập chăn nuôi theo Loại vật nuôi của chi nhánh
    const allPrograms = programsList.length > 0 ? programsList : DEFAULT_LIVESTOCK_PROGRAMS;
    const applicablePrograms = allPrograms.filter((p) => {
      const pSpecies = String(p.species || p.livestockType || '').toUpperCase();
      const pName = String(p.name || '').toUpperCase();
      const pBreed = String(p.breedName || '').toUpperCase();
      if (isSwine) {
        return (
          pSpecies.includes('SWINE') ||
          pSpecies.includes('PIG') ||
          pSpecies.includes('LIVESTOCK') ||
          pName.includes('HEO') ||
          pName.includes('LỢN') ||
          pName.includes('LON') ||
          pName.includes('DUROC') ||
          pName.includes('LANDRACE') ||
          pName.includes('YORKSHIRE') ||
          pBreed.includes('HEO') ||
          pBreed.includes('LỢN')
        );
      } else {
        return (
          pSpecies.includes('POULTRY') ||
          pSpecies.includes('BIRD') ||
          pSpecies.includes('CHICKEN') ||
          pSpecies.includes('DUCK') ||
          pName.includes('GÀ') ||
          pName.includes('GA') ||
          pName.includes('VỊT') ||
          pName.includes('VIT') ||
          pName.includes('ROSS') ||
          pName.includes('CP') ||
          pName.includes('CHERRY') ||
          pBreed.includes('GÀ') ||
          pBreed.includes('VỊT')
        );
      }
    });

    const chosenProg =
      applicablePrograms[0] ||
      DEFAULT_LIVESTOCK_PROGRAMS.find((p) => (isSwine ? (p.species === 'SWINE' || p.species === 'PIG') : p.species === 'POULTRY'));

    const code = `LUA-${barn.code ? barn.code.slice(-2) : '01'}-${new Date().getMonth() + 1}${new Date().getDate()}`;

    setNewBatchForm({
      batchCode: code,
      batchName: `Lứa nuôi mới #${code}`,
      livestockType: isSwine ? 'SWINE' : 'POULTRY',
      branchName: effectiveBranch?.name || '',
      programId: chosenProg ? chosenProg.id : '',
      programName: chosenProg ? chosenProg.name : (isSwine ? 'Quy trình Heo thịt 120 ngày (Duroc x Landrace x Yorkshire)' : 'Quy trình Gà thịt Ross 308 (45 ngày)'),
      breedName: chosenProg?.breedName || (isSwine ? 'Heo ngoại 3 máu Duroc' : 'Gà trắng Ross 308'),
      startDate: new Date().toISOString().split('T')[0],
      initialQuantity: barn.capacity || (isSwine ? 120 : 2000),
      initialAvgWeight: chosenProg?.initialAvgWeight || (isSwine ? 7.0 : 0.045),
      seedUnitPrice: chosenProg?.seedUnitPrice || (isSwine ? 1300000 : 15000),
    });

    setIsStartBatchModalOpen(true);
  };

  const handleProgramChange = (progId) => {
    const selectedProg = availableProgramsForModal.find((p) => String(p.id) === String(progId) || p.name === progId);
    if (!selectedProg) return;

    setNewBatchForm((prev) => ({
      ...prev,
      programId: selectedProg.id,
      programName: selectedProg.name,
      breedName: selectedProg.breedName || prev.breedName,
      initialAvgWeight: selectedProg.initialAvgWeight || prev.initialAvgWeight,
      seedUnitPrice: selectedProg.seedUnitPrice || prev.seedUnitPrice,
    }));
  };

  const handleLivestockTypeChange = (newType) => {
    const isSwine = newType === 'SWINE';
    const allPrograms = programsList.length > 0 ? programsList : DEFAULT_LIVESTOCK_PROGRAMS;
    const filtered = allPrograms.filter((p) => {
      const pSpecies = String(p.species || p.livestockType || '').toUpperCase();
      const pName = String(p.name || '').toUpperCase();
      const pBreed = String(p.breedName || '').toUpperCase();
      if (isSwine) {
        return (
          pSpecies.includes('SWINE') ||
          pSpecies.includes('PIG') ||
          pSpecies.includes('LIVESTOCK') ||
          pName.includes('HEO') ||
          pName.includes('LỢN') ||
          pName.includes('LON') ||
          pName.includes('DUROC') ||
          pName.includes('LANDRACE') ||
          pName.includes('YORKSHIRE') ||
          pBreed.includes('HEO') ||
          pBreed.includes('LỢN')
        );
      } else {
        return (
          pSpecies.includes('POULTRY') ||
          pSpecies.includes('BIRD') ||
          pSpecies.includes('CHICKEN') ||
          pSpecies.includes('DUCK') ||
          pName.includes('GÀ') ||
          pName.includes('GA') ||
          pName.includes('VỊT') ||
          pName.includes('VIT') ||
          pName.includes('ROSS') ||
          pName.includes('CP') ||
          pName.includes('CHERRY') ||
          pBreed.includes('GÀ') ||
          pBreed.includes('VỊT')
        );
      }
    });

    const chosenProg =
      filtered[0] ||
      DEFAULT_LIVESTOCK_PROGRAMS.find((p) => (isSwine ? (p.species === 'SWINE' || p.species === 'PIG') : p.species === 'POULTRY'));

    setNewBatchForm((prev) => ({
      ...prev,
      livestockType: newType,
      programId: chosenProg ? chosenProg.id : '',
      programName: chosenProg ? chosenProg.name : '',
      breedName: chosenProg?.breedName || (isSwine ? 'Heo ngoại 3 máu Duroc' : 'Gà trắng Ross 308'),
      initialQuantity: targetBarnForNewBatch?.capacity || (isSwine ? 120 : 2000),
      initialAvgWeight: chosenProg?.initialAvgWeight || (isSwine ? 7.0 : 0.045),
      seedUnitPrice: chosenProg?.seedUnitPrice || (isSwine ? 1300000 : 15000),
    }));
  };

  const handleSaveStartBatch = async (e) => {
    e.preventDefault();
    if (!targetBarnForNewBatch) return;

    try {
      const selectedBreed =
        availableProgramsForModal.find((p) => String(p.id) === String(newBatchForm.programId) || p.name === newBatchForm.programName) ||
        availableProgramsForModal[0];
      const breedId = selectedBreed ? selectedBreed.id : 1;

      await barnBatchService.createBatch(
        {
          barnId: targetBarnForNewBatch.id,
          code: newBatchForm.batchCode,
          breedId: breedId,
          initialQuantity: Number(newBatchForm.initialQuantity),
          entryDate: newBatchForm.startDate,
          avgInitialWeightKg: Number(newBatchForm.initialAvgWeight),
          unitPrice: Number(newBatchForm.seedUnitPrice),
          notes: newBatchForm.programName,
        },
        { farmId: currentFarmId }
      );

      triggerRefresh();
      setIsStartBatchModalOpen(false);
      toast.success(`Đã khởi tạo và nhập đàn thành công cho ${targetBarnForNewBatch.name}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi mở lứa nuôi mới');
    }
  };

  const handleSaveSplitFlock = async (e) => {
    e.preventDefault();
    if (!currentDetailBarn || !currentDetailBarn.batch) return;
    const splitQty = Number(splitForm.splitQuantity);
    const targetBarn = barns.find((b) => b.id === Number(splitForm.targetBarnId));

    if (!targetBarn) {
      toast.error('Vui lòng chọn chuồng đích');
      return;
    }
    if (splitQty <= 0 || splitQty >= currentDetailBarn.batch.currentQuantity) {
      toast.error('Số lượng tách không hợp lệ');
      return;
    }

    try {
      await barnBatchService.splitBatch(currentDetailBarn.batch.id, {
        targetBarnId: Number(splitForm.targetBarnId),
        splitQuantity: splitQty,
        notes: splitForm.reason,
      });

      triggerRefresh();
      setIsSplitFlockModalOpen(false);
      toast.success(`Đã tách ${splitQty} con sang ${targetBarn.name} thành công!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tách đàn');
    }
  };

  const handleConfirmCloseBatch = async () => {
    if (!currentDetailBarn || !currentDetailBarn.batch) return;
    if (!closeConfirmChecked) {
      toast.error('Vui lòng tích xác nhận chốt sổ lứa nuôi');
      return;
    }

    try {
      await barnBatchService.closeBatch(currentDetailBarn.batch.id);
      triggerRefresh();
      setIsCloseBatchModalOpen(false);
      setCloseConfirmChecked(false);
      setActiveBarnId(null);
      navigate('/app/barns');
      toast.success(`Lứa nuôi tại ${currentDetailBarn.name} đã kết thúc và chuyển chuồng về trạng thái Trống!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi kết thúc lứa nuôi');
    }
  };

  const handleSaveQuickLog = async (e) => {
    e.preventDefault();
    if (!currentDetailBarn || !currentDetailBarn.batch) return;

    try {
      await dailyLogService.createDailyLog({
        farmId: currentFarmId,
        barnId: currentDetailBarn.id,
        batchId: currentDetailBarn.batch.id,
        logDate: quickLogForm.logDate,
        entryType: 'FEED',
        feedAmount: Number(quickLogForm.feedConsumedKg) || 0,
        feedUnit: 'KG',
        notes: quickLogForm.notes,
      });

      triggerRefresh();
      setIsQuickLogModalOpen(false);
      toast.success(`Đã ghi nhận nhật ký hằng ngày cho ${currentDetailBarn.name}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi ghi nhật ký nhanh');
    }
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    if (!newZoneForm.name.trim()) {
      toast.error('Vui lòng nhập tên khu nuôi');
      return;
    }
    try {
      await barnBatchService.createZone(
        {
          name: newZoneForm.name.trim(),
          code: newZoneForm.code?.trim() || undefined,
          zoneType: 'BARN',
          areaM2: Number(newZoneForm.areaM2) || 1500,
          branchId: currentBranchId || undefined,
          soilType: newZoneForm.description,
        },
        { farmId: currentFarmId }
      );

      triggerRefresh();
      setIsCreateZoneModalOpen(false);
      toast.success(`Đã thêm khu nuôi "${newZoneForm.name}" thành công!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo khu nuôi');
    }
  };

  const handleOpenEditZone = (zone) => {
    if (!zone) return;
    setEditZoneForm({
      id: zone.id,
      name: zone.name,
      livestockType: zone.zoneType || 'POULTRY',
      areaM2: zone.areaM2 || 1500,
      description: zone.soilType || zone.description || '',
    });
    setIsEditZoneModalOpen(true);
  };

  const handleUpdateZone = async (e) => {
    e.preventDefault();
    if (!editZoneForm.name.trim()) {
      toast.error('Vui lòng nhập tên khu nuôi');
      return;
    }

    const requestedZoneArea = Number(editZoneForm.areaM2) || 0;
    const barnsInZone = barns.filter((b) => Number(b.zoneId) === Number(editZoneForm.id));
    const totalBarnsArea = barnsInZone.reduce((sum, b) => sum + (Number(b.areaM2) || 0), 0);
    if (requestedZoneArea < totalBarnsArea) {
      toast.error(`Diện tích khu nuôi (${requestedZoneArea} m²) không được nhỏ hơn tổng diện tích các chuồng hiện có (${totalBarnsArea} m²). Vui lòng điều chỉnh lại diện tích các chuồng trước.`);
      return;
    }

    try {
      await barnBatchService.updateZone(
        editZoneForm.id,
        {
          name: editZoneForm.name.trim(),
          zoneType: 'BARN',
          areaM2: requestedZoneArea || 1500,
          soilType: editZoneForm.description,
        },
        { farmId: currentFarmId }
      );
      triggerRefresh();
      setIsEditZoneModalOpen(false);
      toast.success(`Đã cập nhật khu nuôi "${editZoneForm.name}" thành công!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật khu nuôi');
    }
  };

  const handleDeleteZone = async (zoneId) => {
    const zone = zones.find((z) => z.id === zoneId);
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khu nuôi "${zone?.name || ''}"?`)) {
      return;
    }
    try {
      await barnBatchService.deleteZone(zoneId, { farmId: currentFarmId });
      setSelectedZoneId('ALL');
      triggerRefresh();
      toast.success('Đã xóa khu nuôi thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa khu nuôi');
    }
  };

  const handleCreateBarn = async (e) => {
    e.preventDefault();
    if (!newBarnForm.name.trim()) {
      toast.error('Vui lòng nhập tên chuồng nuôi');
      return;
    }

    const requestedArea = Number(newBarnForm.areaM2) || 0;
    const targetZone = zones.find((z) => Number(z.id) === Number(newBarnForm.zoneId));
    if (targetZone && targetZone.areaM2) {
      const barnsInZone = barns.filter((b) => Number(b.zoneId) === Number(newBarnForm.zoneId));
      const currentBarnsArea = barnsInZone.reduce((sum, b) => sum + (Number(b.areaM2) || 0), 0);
      const totalAfterAdd = currentBarnsArea + requestedArea;
      if (totalAfterAdd > Number(targetZone.areaM2)) {
        const remainingArea = Math.max(0, Number(targetZone.areaM2) - currentBarnsArea);
        toast.error(`Tổng diện tích các chuồng (${totalAfterAdd} m²) không được lớn hơn diện tích khu nuôi "${targetZone.name}" (${targetZone.areaM2} m²). Diện tích chuồng còn khả dụng: ${remainingArea} m².`);
        return;
      }
    }

    try {
      await barnBatchService.createBarn(
        {
          name: newBarnForm.name.trim(),
          zoneId: Number(newBarnForm.zoneId),
          capacity: Number(newBarnForm.capacity) || 2000,
          areaM2: requestedArea || 180,
          description: newBarnForm.description,
        },
        { farmId: currentFarmId }
      );

      triggerRefresh();
      setIsCreateBarnModalOpen(false);
      toast.success(`Đã tạo chuồng "${newBarnForm.name}" mới!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo chuồng nuôi');
    }
  };

  const handleOpenEditBarn = (barn) => {
    if (!barn) return;
    setEditBarnForm({
      id: barn.id,
      name: barn.name,
      zoneId: barn.zoneId || (zones[0]?.id || 1),
      capacity: barn.capacity || 1000,
      areaM2: barn.areaM2 || 180,
      description: barn.description || '',
    });
    setIsEditBarnModalOpen(true);
  };

  const handleUpdateBarn = async (e) => {
    e.preventDefault();
    if (!editBarnForm.name.trim()) {
      toast.error('Vui lòng nhập tên chuồng nuôi');
      return;
    }

    const requestedArea = Number(editBarnForm.areaM2) || 0;
    const targetZone = zones.find((z) => Number(z.id) === Number(editBarnForm.zoneId));
    if (targetZone && targetZone.areaM2) {
      const otherBarnsInZone = barns.filter(
        (b) => Number(b.zoneId) === Number(editBarnForm.zoneId) && Number(b.id) !== Number(editBarnForm.id)
      );
      const otherBarnsArea = otherBarnsInZone.reduce((sum, b) => sum + (Number(b.areaM2) || 0), 0);
      const totalAfterUpdate = otherBarnsArea + requestedArea;
      if (totalAfterUpdate > Number(targetZone.areaM2)) {
        const remainingArea = Math.max(0, Number(targetZone.areaM2) - otherBarnsArea);
        toast.error(`Tổng diện tích các chuồng (${totalAfterUpdate} m²) không được lớn hơn diện tích khu nuôi "${targetZone.name}" (${targetZone.areaM2} m²). Diện tích tối đa có thể đặt cho chuồng này: ${remainingArea} m².`);
        return;
      }
    }

    try {
      await barnBatchService.updateBarn(
        editBarnForm.id,
        {
          name: editBarnForm.name.trim(),
          zoneId: Number(editBarnForm.zoneId),
          capacity: Number(editBarnForm.capacity) || 1000,
          areaM2: requestedArea || 180,
          description: editBarnForm.description,
        },
        { farmId: currentFarmId }
      );
      triggerRefresh();
      setIsEditBarnModalOpen(false);
      toast.success(`Đã cập nhật chuồng "${editBarnForm.name}" thành công!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật chuồng nuôi');
    }
  };

  const handleDeleteBarn = async (barnId) => {
    const barn = barns.find((b) => b.id === barnId);
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chuồng "${barn?.name || ''}"? Hành động này không thể hoàn tác.`)) {
      return;
    }
    try {
      await barnBatchService.deleteBarn(barnId, { farmId: currentFarmId });
      triggerRefresh();
      toast.success('Đã xóa chuồng nuôi thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa chuồng nuôi');
    }
  };

  
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {currentDetailBarn ? (
        currentDetailBarn.batch || batchDetailData ? (
          <BarnBatchDetailView
            barn={currentDetailBarn}
            allBarns={scopedBarns}
            zones={zones}
            batchDetail={batchDetailData}
            programsList={programsList}
            canManageBatch={canManageBatch}
            canManageBarns={canManageBarns}
            canViewFinancials={canViewFinancialPnL}
            onRefresh={() => triggerRefresh()}
            onOpenQuickLog={(b) => {
              setQuickLogForm((prev) => ({
                ...prev,
                barnId: b.id,
                batchId: b.batch?.id,
              }));
              setIsQuickLogModalOpen(true);
            }}
            onOpenSplitModal={(b) => {
              setSplitForm({
                splitQuantity: Math.min(200, Math.floor((b.batch?.currentQuantity || 1000) * 0.1)),
                avgWeightKg: b.batch?.currentWeightKg || 1.5,
                targetBarnId: '',
                reason: 'Giảm mật độ chuồng nuôi',
              });
              setIsSplitFlockModalOpen(true);
            }}
            onOpenCloseBatchModal={() => {
              setCloseConfirmChecked(false);
              setIsCloseBatchModalOpen(true);
            }}
          />
        ) : (
          <div className="space-y-6">
            {/* Header cho Chuồng Trống */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => {
                    setActiveBarnId(null);
                    navigate('/app/barns');
                  }}
                  className="hover:text-emerald-700 transition-colors flex items-center gap-1.5 text-slate-500 hover:underline"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>{currentDetailBarn.zoneName || 'Khu nuôi'}</span>
                </button>
                <span className="text-slate-300">/</span>
                <span className="text-slate-900 font-black">{currentDetailBarn.name}</span>
                <span className="ml-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Chuồng Trống (EMPTY)
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <select
                  value={currentDetailBarn.id}
                  onChange={(e) => {
                    const targetBarnId = e.target.value;
                    if (targetBarnId) {
                      setActiveBarnId(Number(targetBarnId));
                      navigate(`/app/barns/${targetBarnId}`);
                    }
                  }}
                  className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="" disabled>Chuyển chuồng khác...</option>
                  {scopedBarns.map((otherBarn) => (
                    <option key={otherBarn.id} value={otherBarn.id}>
                      {otherBarn.name} ({otherBarn.status === 'EMPTY' ? 'Trống' : otherBarn.batch?.batchCode || 'Đang nuôi'})
                    </option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveBarnId(null);
                    navigate('/app/barns');
                  }}
                  className="text-xs font-semibold"
                >
                  Quay Lại Sơ Đồ
                </Button>
              </div>
            </div>

            {/* Trạng thái Chuồng Trống */}
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-2xl mx-auto shadow-xs space-y-5">
              <div className="h-16 w-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
                <Building className="h-8 w-8 text-slate-400" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900">
                  {currentDetailBarn.name} Hiện Đang Trống
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Chuồng đã hoàn tất quy trình tiêu độc, khử trùng an toàn sinh học. Chuồng có diện tích sàn{' '}
                  <strong>{currentDetailBarn.areaM2 || 180} m²</strong>, sức chứa thiết kế{' '}
                  <strong>{formatNumber(currentDetailBarn.capacity || 2000)} con</strong>, sẵn sàng tiếp nhận lứa nuôi mới.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                {canManageBatch && (
                  <Button
                    variant="primary"
                    size="md"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => handleOpenStartBatch(currentDetailBarn)}
                    className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs px-5 py-2.5 text-xs"
                  >
                    + Bắt Đầu Lứa Nuôi (Nhập Đàn)
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setActiveBarnId(null);
                    navigate('/app/barns');
                  }}
                  className="font-semibold text-xs"
                >
                  Quay Lại Sơ Đồ Chuồng
                </Button>
              </div>
            </div>
          </div>
        )
      ) : (
        <>
          {/* THÔNG BÁO CHẾ ĐỘ XEM TỔNG HỢP TOÀN CHUỖI */}
      {currentBranchId === 'ALL' && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs shadow-2xs">
          <Info className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Chế độ xem Tổng hợp:</strong> Đang hiển thị toàn bộ khu nuôi và chuồng của mọi chi nhánh. Vui lòng chọn một chi nhánh cụ thể trên thanh Header để tạo khu nuôi, thêm chuồng hoặc bắt đầu lứa nuôi.
          </span>
        </div>
      )}

      {/* 1. HEADER CHÍNH */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <Building className="h-4 w-4" />
            <span>Hạ Tầng & Vòng Đời Lứa Nuôi</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Khu Nuôi & Chuồng Trại</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {scopedBarns.length} chuồng theo dõi
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Sơ đồ trực quan toàn bộ khu chuồng nuôi. Quản lý trạng thái chuồng trống, đàn đang nuôi, khẩu phần cám và cảnh báo dịch tễ kịp thời.
          </p>
        </div>

        {/* Nút tác vụ Quản lý */}
        <div className="flex items-center gap-2">
          {canManageBarns && (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => {
                  if (currentBranchId === 'ALL') {
                    toast.warning('Bạn đang ở chế độ xem Tổng hợp toàn chuỗi. Vui lòng chọn một chi nhánh cụ thể trên thanh Header để tạo khu nuôi!');
                    return;
                  }
                  setNewZoneForm({ name: '', livestockType: 'POULTRY', description: '' });
                  setIsCreateZoneModalOpen(true);
                }}
                className="text-xs font-bold border-slate-300"
              >
                Tạo Khu Nuôi
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => {
                  if (currentBranchId === 'ALL') {
                    toast.warning('Bạn đang ở chế độ xem Tổng hợp toàn chuỗi. Vui lòng chọn một chi nhánh cụ thể trên thanh Header để tạo chuồng mới!');
                    return;
                  }
                  setNewBarnForm({ name: '', zoneId: zones[0]?.id || 1, capacity: 2000, areaM2: 180 });
                  setIsCreateBarnModalOpen(true);
                }}
                className="text-xs font-bold"
              >
                Tạo Chuồng Mới
              </Button>
            </>
          )}

          {isWorker && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs font-bold">
              <Users className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Phạm vi: Chuồng được phân công</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. THANH ĐIỀU HƯỚNG KHU NUÔI (ZONE FILTER TABS) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 text-xs overflow-x-auto gap-2 bg-white p-1 rounded-xl shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedZoneId('ALL')}
            className={`px-4 py-2 font-bold border-b-2 transition-all whitespace-nowrap rounded-t-lg ${
              selectedZoneId === 'ALL'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/70 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Tất Cả Khu ({scopedBarns.length})
          </button>

          {zones.map((zone) => {
            const barnCount = scopedBarns.filter((b) => b.zoneId === zone.id).length;
            const isSelected = selectedZoneId === String(zone.id);
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZoneId(String(zone.id))}
                className={`px-4 py-2 font-bold border-b-2 transition-all whitespace-nowrap rounded-t-lg ${
                  isSelected
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/70 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {zone.name} ({barnCount})
              </button>
            );
          })}
        </div>

        {/* Nút tác vụ Sửa & Xóa cho Khu nuôi đang chọn */}
        {selectedZoneId !== 'ALL' && canManageBarns && (
          <div className="flex items-center gap-1.5 px-2 pb-1 sm:pb-0 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => handleOpenEditZone(zones.find((z) => String(z.id) === selectedZoneId))}
              title="Sửa khu nuôi"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors flex items-center gap-1 text-[11px] font-bold"
            >
              <Pencil className="h-3.5 w-3.5 text-blue-600" />
              <span>Sửa Khu</span>
            </button>
            <button
              type="button"
              onClick={() => handleDeleteZone(Number(selectedZoneId))}
              title="Xóa khu nuôi"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-700 hover:text-rose-700 transition-colors flex items-center gap-1 text-[11px] font-bold"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              <span>Xóa Khu</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. BỘ LỌC TRẠNG THÁI NHANH & TÌM KIẾM */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Tất Cả ({scopedBarns.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'ACTIVE'
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Đang Nuôi ({scopedBarns.filter((b) => b.batch && b.status !== 'EMPTY').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('EMPTY')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'EMPTY'
                ? 'bg-slate-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Chuồng Trống ({scopedBarns.filter((b) => !b.batch || b.status === 'EMPTY').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('ALERT')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'ALERT'
                ? 'bg-rose-600 text-white'
                : 'bg-white border border-slate-200 text-rose-700 hover:bg-rose-50'
            }`}
          >
            ⚠️ Đang Cảnh Báo ({scopedBarns.filter((b) => b.batch && (b.batch.alertLevel === 'WARNING' || b.batch.alertLevel === 'DANGER' || b.status === 'ALERT')).length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm chuồng, mã lứa..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
          />
        </div>
      </div>

      {/* 4. LƯỚI THẺ CHUỒNG NUÔI (RESPONSIVE CARD GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBarns.map((barn) => {
          const isOccupied = Boolean(barn.batch) && barn.status !== 'EMPTY';

          // TRƯỜNG HỢP 1: CHUỒNG ĐANG NUÔI (VIỀN / NHÃN XANH LÁ)
          if (isOccupied) {
            const batch = barn.batch;
            const progressPct = Math.round((batch.currentQuantity / batch.initialQuantity) * 100);

            return (
              <div
                key={barn.id}
                className="bg-white rounded-2xl border-2 border-emerald-500/70 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                {/* Dải nhãn xanh góc trên */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {barn.zoneName}
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-1">{barn.name}</h3>
                    <p className="text-xs font-bold text-slate-700">{batch.batchName}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                      {batch.currentAgeDays} ngày tuổi
                    </span>
                    {canManageBarns && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditBarn(barn);
                        }}
                        title="Sửa thông tin chuồng"
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Thanh tiến trình sĩ số */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Sĩ số hiện tại:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatNumber(batch.currentQuantity)} / {formatNumber(batch.initialQuantity)} con
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Hao hụt: <strong className="text-rose-600 font-bold">{batch.mortalityRatePct ?? 0}%</strong> ({batch.mortalityCount ?? 0} con)</span>
                    <span>FCR: <strong className="font-mono font-black text-emerald-700">{batch.fcrCurrent ?? '0.00'}</strong></span>
                  </div>
                </div>

                {/* Cảnh báo badge màu cam/đỏ nếu có */}
                {batch.vaccineAlert && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-1.5">
                    <Syringe className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">{batch.vaccineAlert}</span>
                  </div>
                )}

                {/* Footer action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    TL: ~{batch.currentWeightKg} kg/con
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ArrowRight className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setActiveBarnId(barn.id);
                      navigate(`/app/barns/${barn.id}/batch/${batch.id}`);
                    }}
                    className="text-xs font-bold border-slate-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    Xem Chi Tiết
                  </Button>
                </div>
              </div>
            );
          }

          // TRƯỜNG HỢP 2: CHUỒNG TRỐNG (VIỀN NÉT ĐỨT / NHÃN XÁM)
          return (
            <div
              key={barn.id}
              className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-5 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {barn.zoneName}
                </span>
                <div className="flex items-center justify-between mt-1">
                  <h3 className="text-base font-black text-slate-700">{barn.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400">Chuồng Trống</span>
                    {canManageBarns && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditBarn(barn);
                          }}
                          title="Sửa thông tin chuồng"
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBarn(barn.id);
                          }}
                          title="Xóa chuồng trống"
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Diện tích: <strong className="text-slate-800">{barn.areaM2} m²</strong> — Sức chứa tối đa:{' '}
                  <strong className="text-slate-800">{formatNumber(barn.capacity)} con</strong>
                </p>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-700 font-semibold bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Đã sát trùng vôi bột & nghỉ chuồng {barn.restDays || 7} ngày</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => handleOpenStartBatch(barn)}
                  className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  + Bắt Đầu Lứa Nuôi (Nhập Đàn)
                </Button>
              </div>
            </div>
          );
        })}
      </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 5. CÁC MODAL NGHIỆP VỤ QUAN TRỌNG                                         */}
      {/* ========================================================================= */}

      {/* MODAL 1: BẮT ĐẦU LỨA NUÔI & NHẬP ĐÀN */}
      <Modal
        isOpen={isStartBatchModalOpen}
        onClose={() => setIsStartBatchModalOpen(false)}
        title={`Bắt Đầu Lứa Nuôi Tại ${targetBarnForNewBatch?.name || ''}`}
        subtitle="Khởi tạo lứa nuôi và tự động gắn chương trình nuôi chuẩn"
        icon={<Sparkles className="h-5 w-5 text-emerald-600" />}
      >
        <form onSubmit={handleSaveStartBatch} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Mã lứa nuôi" required>
              <Input
                value={newBatchForm.batchCode}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, batchCode: e.target.value })}
              />
            </FormField>
            <FormField label="Tên lứa nuôi" required>
              <Input
                value={newBatchForm.batchName}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, batchName: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Loại vật nuôi"
              required
              hint={newBatchForm.branchName ? `Khóa liên kết theo chi nhánh: ${newBatchForm.branchName}` : 'Loại hình theo chi nhánh'}
            >
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={newBatchForm.livestockType === 'SWINE' ? '🐷 Gia súc thịt (Heo)' : '🐔 Gia cầm thịt (Gà, Vịt)'}
                  className="w-full text-xs font-bold px-3 py-2 bg-slate-100 text-slate-800 rounded-lg border border-slate-300 cursor-not-allowed select-none"
                />
                <span className="absolute right-2.5 top-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Theo chi nhánh
                </span>
              </div>
            </FormField>
            <FormField label="Tên giống" required hint="Tự động điền theo chương trình nuôi chuẩn">
              <Input
                value={newBatchForm.breedName}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, breedName: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Số lượng con" required>
              <Input
                type="number"
                value={newBatchForm.initialQuantity}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, initialQuantity: e.target.value })}
              />
            </FormField>
            <FormField label="TL bình quân (kg/con)" required>
              <Input
                type="number"
                step="0.01"
                value={newBatchForm.initialAvgWeight}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, initialAvgWeight: e.target.value })}
              />
            </FormField>
            <FormField label="Đơn giá giống (đ)">
              <Input
                type="number"
                value={newBatchForm.seedUnitPrice}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, seedUnitPrice: e.target.value })}
              />
            </FormField>
          </div>

          <FormField
            label="Chương trình nuôi áp dụng"
            required
            hint={`Dữ liệu liên kết từ Thiết lập chăn nuôi (${availableProgramsForModal.length} quy trình ${newBatchForm.livestockType === 'SWINE' ? 'Gia súc' : 'Gia cầm'})`}
          >
            <Select
              value={String(newBatchForm.programId || '')}
              onChange={(e) => handleProgramChange(e.target.value)}
              options={availableProgramsForModal.map((p) => ({
                value: String(p.id),
                label: `${p.name} (${p.totalDays || 45} ngày - FCR: ${p.fcrTarget || 1.65})`,
              }))}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsStartBatchModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Xác Nhận Nhập Đàn
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: TÁCH ĐÀN / CHUYỂN CHUỒNG */}
      <Modal
        isOpen={isSplitFlockModalOpen}
        onClose={() => setIsSplitFlockModalOpen(false)}
        title="Tách Đàn / Chuyển Chuồng Nuôi"
        subtitle="Chuyển bớt vật nuôi sang chuồng khác để giảm mật độ hoặc phân loại thể trọng"
        icon={<Split className="h-5 w-5 text-blue-600" />}
      >
        <form onSubmit={handleSaveSplitFlock} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Số lượng con tách đi" required>
              <Input
                type="number"
                value={splitForm.splitQuantity}
                onChange={(e) => setSplitForm({ ...splitForm, splitQuantity: e.target.value })}
              />
            </FormField>
            <FormField label="Trọng lượng bình quân (kg/con)" required>
              <Input
                type="number"
                step="0.01"
                value={splitForm.avgWeightKg}
                onChange={(e) => setSplitForm({ ...splitForm, avgWeightKg: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Chọn chuồng đích" required hint="Chọn chuồng trống để mở lứa mới hoặc chọn chuồng đang nuôi để gộp">
            <Select
              value={splitForm.targetBarnId}
              onChange={(e) => setSplitForm({ ...splitForm, targetBarnId: e.target.value })}
              options={[
                { value: '', label: '-- Chọn chuồng đích tiếp nhận --' },
                ...barns
                  .filter((b) => b.id !== currentDetailBarn?.id)
                  .map((b) => ({
                    value: String(b.id),
                    label: `${b.name} (${b.status === 'EMPTY' ? 'Chuồng trống' : 'Đang nuôi'})`,
                  })),
              ]}
            />
          </FormField>

          <FormField label="Lý do tách đàn">
            <Select
              value={splitForm.reason}
              onChange={(e) => setSplitForm({ ...splitForm, reason: e.target.value })}
              options={[
                { value: 'Giảm mật độ chuồng nuôi', label: 'Giảm mật độ chuồng nuôi' },
                { value: 'Phân loại theo thể trọng (Tách con nhỏ / con lớn)', label: 'Phân loại theo thể trọng' },
                { value: 'Cách ly theo dõi sức khỏe', label: 'Cách ly theo dõi sức khỏe' },
              ]}
            />
          </FormField>

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Info className="h-4 w-4 text-blue-600" />
              <span>Phân Bổ Chi Phí Tự Động:</span>
            </div>
            <p className="text-[11px] text-blue-800">
              Chi phí cám và vắc-xin tích lũy sẽ được hệ thống trích chuyển theo đúng tỷ lệ số con tách sang chuồng đích.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsSplitFlockModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Xác Nhận Tách Đàn
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: KẾT THÚC LỨA NUÔI */}
      <Modal
        isOpen={isCloseBatchModalOpen}
        onClose={() => setIsCloseBatchModalOpen(false)}
        title="Xác Nhận Kết Thúc Lứa Nuôi"
        subtitle="Chốt sổ toàn diện lứa nuôi và đưa chuồng về trạng thái Trống"
        icon={<XSquare className="h-5 w-5 text-rose-600" />}
      >
        <div className="space-y-4">
          {currentDetailBarn?.batch && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <h4 className="font-black text-slate-900 uppercase">Tổng Kết Lứa Nuôi</h4>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>Số con nhập ban đầu: <strong className="text-slate-900">{formatNumber(currentDetailBarn.batch.initialQuantity)}</strong></div>
                <div>Số con hiện tại: <strong className="text-slate-900">{formatNumber(currentDetailBarn.batch.currentQuantity)}</strong></div>
                <div>Tổng hao hụt: <strong className="text-rose-600">{currentDetailBarn.batch.mortalityCount} con ({currentDetailBarn.batch.mortalityRatePct}%)</strong></div>
                <div>FCR tổng kết: <strong className="text-emerald-700 font-mono">{currentDetailBarn.batch.fcrCurrent}</strong></div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Hành động này sẽ đóng lứa nuôi hiện tại, lưu trữ lịch sử báo cáo và chuyển chuồng về trạng thái <strong>Chuồng Trống</strong> để chuẩn bị sát trùng vụ mới.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
            <input
              type="checkbox"
              checked={closeConfirmChecked}
              onChange={(e) => setCloseConfirmChecked(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <span>Xác nhận đóng lứa và đưa chuồng về trạng thái Trống</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCloseBatchModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!closeConfirmChecked}
              onClick={handleConfirmCloseBatch}
            >
              Chốt Sổ & Đóng Chuồng
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: GHI NHẬT KÝ NHANH TẠI CHUỒNG */}
      <Modal
        isOpen={isQuickLogModalOpen}
        onClose={() => setIsQuickLogModalOpen(false)}
        title="Ghi Nhật Ký Nhanh Tại Chuồng"
        subtitle={`Nhập khẩu phần ăn, thuốc và biến động cho ${currentDetailBarn?.name || ''}`}
        icon={<FileText className="h-5 w-5 text-emerald-600" />}
      >
        <form onSubmit={handleSaveQuickLog} className="space-y-4">
          <FormField label="Ngày ghi nhận" required>
            <Input
              type="date"
              value={quickLogForm.logDate}
              onChange={(e) => setQuickLogForm({ ...quickLogForm, logDate: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Lượng cám cho ăn (kg)" required>
              <Input
                type="number"
                step="0.1"
                value={quickLogForm.feedConsumedKg}
                onChange={(e) => setQuickLogForm({ ...quickLogForm, feedConsumedKg: e.target.value })}
              />
            </FormField>

            <FormField label="Số con chết / loại thải (con)">
              <Input
                type="number"
                value={quickLogForm.mortalityCount}
                onChange={(e) => setQuickLogForm({ ...quickLogForm, mortalityCount: e.target.value })}
              />
            </FormField>
          </div>

          {Number(quickLogForm.mortalityCount) > 0 && (
            <FormField label="Lý do tử vong / loại thải" required>
              <Select
                value={quickLogForm.mortalityReason}
                onChange={(e) => setQuickLogForm({ ...quickLogForm, mortalityReason: e.target.value })}
                options={[
                  { value: 'Tiêu chảy / E.coli', label: 'Tiêu chảy / E.coli' },
                  { value: 'Hô hấp / Hen khẹc CRD', label: 'Hô hấp / Hen khẹc CRD' },
                  { value: 'Còi cọc loại thải', label: 'Còi cọc loại thải' },
                  { value: 'Đè / Dẫm đạp nhau', label: 'Đè / Dẫm đạp nhau' },
                  { value: 'Sốc nhiệt / Đột tử', label: 'Sốc nhiệt / Đột tử' },
                ]}
              />
            </FormField>
          )}

          <FormField label="Thuốc thú y / Vắc-xin sử dụng">
            <Input
              placeholder="VD: Men tiêu hóa, Amox 50%, Vắc-xin Gumboro..."
              value={quickLogForm.medicineUsed}
              onChange={(e) => setQuickLogForm({ ...quickLogForm, medicineUsed: e.target.value })}
            />
          </FormField>

          <FormField label="Ghi chú tình trạng đàn">
            <textarea
              rows={2}
              placeholder="Ghi chú phân, tiếng thở, nước uống..."
              value={quickLogForm.notes}
              onChange={(e) => setQuickLogForm({ ...quickLogForm, notes: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsQuickLogModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Lưu Nhật Ký
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: TẠO KHU NUÔI MỚI */}
      <Modal
        isOpen={isCreateZoneModalOpen}
        onClose={() => setIsCreateZoneModalOpen(false)}
        title="Tạo Khu Nuôi Mới"
        subtitle="Mở rộng khu vực chăn nuôi của trang trại"
        icon={<Building className="h-5 w-5 text-emerald-600" />}
      >
        <form onSubmit={handleCreateZone} className="space-y-4">
          <FormField label="Tên khu nuôi" required>
            <Input
              placeholder="VD: Khu C - Chuồng Gà Đẻ, Khu D - Heo Nái..."
              value={newZoneForm.name}
              onChange={(e) => setNewZoneForm({ ...newZoneForm, name: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Mã khu (tự sinh nếu để trống)">
              <Input
                placeholder="VD: KHU-A, KHU-B..."
                value={newZoneForm.code}
                onChange={(e) => setNewZoneForm({ ...newZoneForm, code: e.target.value })}
              />
            </FormField>

            <FormField label="Diện tích (m²)">
              <Input
                type="number"
                value={newZoneForm.areaM2}
                onChange={(e) => setNewZoneForm({ ...newZoneForm, areaM2: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Loại hình chăn nuôi" required>
            <Select
              value={newZoneForm.livestockType}
              onChange={(e) => setNewZoneForm({ ...newZoneForm, livestockType: e.target.value })}
              options={[
                { value: 'POULTRY', label: '🐔 Gia cầm thịt (Gà, Vịt, Ngan)' },
                { value: 'SWINE', label: '🐷 Gia súc thịt (Heo)' },
                { value: 'CATTLE', label: '🐂 Bò thịt / Khác' },
              ]}
            />
          </FormField>

          <FormField label="Mô tả khu vực">
            <textarea
              rows={2}
              placeholder="Diện tích, vị trí địa lý, quy chuẩn chuồng kín..."
              value={newZoneForm.description}
              onChange={(e) => setNewZoneForm({ ...newZoneForm, description: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateZoneModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Tạo Khu Nuôi
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5B: SỬA KHU NUÔI */}
      <Modal
        isOpen={isEditZoneModalOpen}
        onClose={() => setIsEditZoneModalOpen(false)}
        title="Chỉnh Sửa Khu Nuôi"
        subtitle="Cập nhật tên, diện tích và mô tả khu nuôi"
        icon={<Pencil className="h-5 w-5 text-blue-600" />}
      >
        <form onSubmit={handleUpdateZone} className="space-y-4">
          <FormField label="Tên khu nuôi" required>
            <Input
              value={editZoneForm.name}
              onChange={(e) => setEditZoneForm({ ...editZoneForm, name: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Diện tích (m²)">
              <Input
                type="number"
                value={editZoneForm.areaM2}
                onChange={(e) => setEditZoneForm({ ...editZoneForm, areaM2: e.target.value })}
              />
            </FormField>

            <FormField label="Loại hình chăn nuôi">
              <Select
                value={editZoneForm.livestockType}
                onChange={(e) => setEditZoneForm({ ...editZoneForm, livestockType: e.target.value })}
                options={[
                  { value: 'POULTRY', label: '🐔 Gia cầm thịt' },
                  { value: 'SWINE', label: '🐷 Gia súc thịt (Heo)' },
                  { value: 'CATTLE', label: '🐂 Bò thịt / Khác' },
                ]}
              />
            </FormField>
          </div>

          {(() => {
            const barnsInThisZone = barns.filter((b) => Number(b.zoneId) === Number(editZoneForm.id));
            const currentTotalBarnArea = barnsInThisZone.reduce((sum, b) => sum + (Number(b.areaM2) || 0), 0);
            const isTooSmall = (Number(editZoneForm.areaM2) || 0) < currentTotalBarnArea;
            return (
              <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                isTooSmall
                  ? 'bg-rose-50 border-rose-200 text-rose-800 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <div>
                  <span>Tổng diện tích các chuồng hiện có: <strong>{currentTotalBarnArea} m²</strong></span>
                  <span className="block text-[11px] text-slate-500">
                    Diện tích khu nuôi phải ≥ {currentTotalBarnArea} m² để bao quát toàn bộ các chuồng hiện có
                  </span>
                </div>
                {isTooSmall && (
                  <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Quá nhỏ!
                  </span>
                )}
              </div>
            );
          })()}

          <FormField label="Ghi chú / Mô tả">
            <textarea
              rows={2}
              value={editZoneForm.description}
              onChange={(e) => setEditZoneForm({ ...editZoneForm, description: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsEditZoneModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Lưu Thay Đổi
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 6: TẠO CHUỒNG MỚI */}
      <Modal
        isOpen={isCreateBarnModalOpen}
        onClose={() => setIsCreateBarnModalOpen(false)}
        title="Tạo Chuồng Nuôi Mới"
        subtitle="Thêm ô chuồng nuôi vào khu vực đã quy hoạch"
        icon={<Building className="h-5 w-5 text-emerald-600" />}
      >
        <form onSubmit={handleCreateBarn} className="space-y-4">
          <FormField label="Tên chuồng" required>
            <Input
              placeholder="VD: Chuồng A4, Chuồng B3..."
              value={newBarnForm.name}
              onChange={(e) => setNewBarnForm({ ...newBarnForm, name: e.target.value })}
            />
          </FormField>

          <FormField label="Khu nuôi trực thuộc" required>
            <Select
              value={newBarnForm.zoneId}
              onChange={(e) => setNewBarnForm({ ...newBarnForm, zoneId: e.target.value })}
              options={zones.map((z) => ({ value: String(z.id), label: z.name }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Sức chứa tối đa (con)" required>
              <Input
                type="number"
                value={newBarnForm.capacity}
                onChange={(e) => setNewBarnForm({ ...newBarnForm, capacity: e.target.value })}
              />
            </FormField>

            <FormField label="Diện tích (m²)" required>
              <Input
                type="number"
                value={newBarnForm.areaM2}
                onChange={(e) => setNewBarnForm({ ...newBarnForm, areaM2: e.target.value })}
              />
            </FormField>
          </div>

          {(() => {
            const selectedZone = zones.find((z) => Number(z.id) === Number(newBarnForm.zoneId));
            if (!selectedZone || !selectedZone.areaM2) return null;
            const barnsInZone = barns.filter((b) => Number(b.zoneId) === Number(newBarnForm.zoneId));
            const currentUsedArea = barnsInZone.reduce((sum, b) => sum + (Number(b.areaM2) || 0), 0);
            const remainingArea = Math.max(0, Number(selectedZone.areaM2) - currentUsedArea);
            const requestedArea = Number(newBarnForm.areaM2) || 0;
            const isExceeded = currentUsedArea + requestedArea > Number(selectedZone.areaM2);
            return (
              <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                isExceeded
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span>Khu nuôi: {selectedZone.name} (Tổng: {selectedZone.areaM2} m²)</span>
                  {isExceeded ? (
                    <span className="text-rose-600 flex items-center gap-1 font-black">
                      <AlertTriangle className="h-4 w-4" /> Vượt quá diện tích khu!
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">
                      Khả dụng: <strong>{remainingArea} m²</strong>
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 flex justify-between">
                  <span>Đã dùng: <strong>{currentUsedArea} m²</strong> ({barnsInZone.length} chuồng)</span>
                  <span>Sau khi tạo: <strong>{currentUsedArea + requestedArea} / {selectedZone.areaM2} m²</strong></span>
                </div>
              </div>
            );
          })()}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateBarnModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Tạo Chuồng
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 6B: SỬA CHUỒNG NUÔI */}
      <Modal
        isOpen={isEditBarnModalOpen}
        onClose={() => setIsEditBarnModalOpen(false)}
        title="Chỉnh Sửa Chuồng Nuôi"
        subtitle="Cập nhật tên, sức chứa và diện tích chuồng"
        icon={<Pencil className="h-5 w-5 text-blue-600" />}
      >
        <form onSubmit={handleUpdateBarn} className="space-y-4">
          <FormField label="Tên chuồng" required>
            <Input
              value={editBarnForm.name}
              onChange={(e) => setEditBarnForm({ ...editBarnForm, name: e.target.value })}
            />
          </FormField>

          <FormField label="Khu nuôi trực thuộc" required>
            <Select
              value={editBarnForm.zoneId}
              onChange={(e) => setEditBarnForm({ ...editBarnForm, zoneId: e.target.value })}
              options={zones.map((z) => ({ value: String(z.id), label: z.name }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Sức chứa tối đa (con)" required>
              <Input
                type="number"
                value={editBarnForm.capacity}
                onChange={(e) => setEditBarnForm({ ...editBarnForm, capacity: e.target.value })}
              />
            </FormField>

            <FormField label="Diện tích (m²)" required>
              <Input
                type="number"
                value={editBarnForm.areaM2}
                onChange={(e) => setEditBarnForm({ ...editBarnForm, areaM2: e.target.value })}
              />
            </FormField>
          </div>

          {(() => {
            const selectedZone = zones.find((z) => Number(z.id) === Number(editBarnForm.zoneId));
            if (!selectedZone || !selectedZone.areaM2) return null;
            const otherBarns = barns.filter(
              (b) => Number(b.zoneId) === Number(editBarnForm.zoneId) && Number(b.id) !== Number(editBarnForm.id)
            );
            const otherBarnsArea = otherBarns.reduce((sum, b) => sum + (Number(b.areaM2) || 0), 0);
            const maxAllowedArea = Math.max(0, Number(selectedZone.areaM2) - otherBarnsArea);
            const requestedArea = Number(editBarnForm.areaM2) || 0;
            const isExceeded = otherBarnsArea + requestedArea > Number(selectedZone.areaM2);
            return (
              <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                isExceeded
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : 'bg-blue-50/70 border-blue-200 text-blue-900'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span>Khu nuôi: {selectedZone.name} (Tổng: {selectedZone.areaM2} m²)</span>
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
                  <span>Các chuồng khác chiếm: <strong>{otherBarnsArea} m²</strong></span>
                  <span>Tổng sau sửa: <strong>{otherBarnsArea + requestedArea} / {selectedZone.areaM2} m²</strong></span>
                </div>
              </div>
            );
          })()}

          <FormField label="Ghi chú thiết bị / chuồng">
            <textarea
              rows={2}
              value={editBarnForm.description}
              onChange={(e) => setEditBarnForm({ ...editBarnForm, description: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsEditBarnModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Lưu Thay Đổi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default BarnsPage;

