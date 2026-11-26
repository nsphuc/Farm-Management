import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { financeService } from '@/services/modules/financeService';
import { apiClient } from '@/services/api/apiClient';
import {
  LayoutDashboard,
  ClipboardList,
  Scale,
  Receipt,
  Wallet,
  Calendar,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Layers,
  TrendingUp,
  Syringe,
  DollarSign,
  Building2,
  Activity,
  ArrowRight,
  TrendingDown,
  Info,
  Check,
  User,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  PieChart,
  Bar,
  Line,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatCurrency, formatNumber } from '@/utils/formatters';

// ================= DỮ LIỆU MẪU SÁT THỰC TẾ TRANG TRẠI CHĂN NUÔI =================

// Dữ liệu đàn và chuồng theo từng chi nhánh
const MOCK_BARNS_BY_BRANCH = {
  // Chi nhánh 1: Trại Heo Hòa Bình
  1: [
    { id: 101, name: 'Chuồng B1 (Heo thịt)', zone: 'Khu B', livestock: 'SWINE', currentQuantity: 275, capacity: 300, fcr: 2.35, dailyFeedKg: 770 },
    { id: 102, name: 'Chuồng B2 (Heo thịt)', zone: 'Khu B', livestock: 'SWINE', currentQuantity: 280, capacity: 300, fcr: 2.38, dailyFeedKg: 780 },
    { id: 103, name: 'Chuồng B3 (Heo cai sữa)', zone: 'Khu B', livestock: 'SWINE', currentQuantity: 320, capacity: 350, fcr: 1.65, dailyFeedKg: 420 },
    { id: 104, name: 'Chuồng B4 (Hậu bị)', zone: 'Khu B', livestock: 'SWINE', currentQuantity: 150, capacity: 180, fcr: 2.10, dailyFeedKg: 390 },
  ],
  // Chi nhánh 2: Trại Gà Ba Vì
  2: [
    { id: 201, name: 'Chuồng A1 (Gà thịt CP)', zone: 'Khu A', livestock: 'POULTRY', currentQuantity: 1950, capacity: 2000, fcr: 1.58, dailyFeedKg: 280 },
    { id: 202, name: 'Chuồng A2 (Gà thịt CP)', zone: 'Khu A', livestock: 'POULTRY', currentQuantity: 1980, capacity: 2000, fcr: 1.62, dailyFeedKg: 290 },
    { id: 203, name: 'Chuồng A3 (Gà ri thả vườn)', zone: 'Khu A', livestock: 'POULTRY', currentQuantity: 2200, capacity: 2500, fcr: 1.85, dailyFeedKg: 260 },
  ],
  // Chi nhánh 3: Trại Cá Sông Đà
  3: [
    { id: 301, name: 'Ao nuôi 1 (Cá rô phi)', zone: 'Khu Thủy sản', livestock: 'AQUACULTURE', currentQuantity: 8500, capacity: 10000, fcr: 1.45, dailyFeedKg: 350 },
    { id: 302, name: 'Ao nuôi 2 (Cá điêu hồng)', zone: 'Khu Thủy sản', livestock: 'AQUACULTURE', currentQuantity: 9200, capacity: 10000, fcr: 1.48, dailyFeedKg: 380 },
  ],
};

// Danh sách tổng hợp toàn hệ thống
const ALL_SYSTEM_BARNS = [
  ...MOCK_BARNS_BY_BRANCH[1],
  ...MOCK_BARNS_BY_BRANCH[2],
  ...MOCK_BARNS_BY_BRANCH[3],
];

// Dữ liệu biểu đồ Cám Tiêu thụ Thực tế vs Định mức chuẩn (ComposedChart 7 ngày)
const FEED_CONSUMPTION_SERIES_7D = [
  { day: '09/11', actualKg: 1050, standardKg: 1020, variance: '+2.9%' },
  { day: '10/11', actualKg: 1080, standardKg: 1050, variance: '+2.8%' },
  { day: '11/11', actualKg: 1120, standardKg: 1080, variance: '+3.7%' },
  { day: '12/11', actualKg: 1140, standardKg: 1110, variance: '+2.7%' },
  { day: '13/11', actualKg: 1190, standardKg: 1140, variance: '+4.3%' },
  { day: '14/11', actualKg: 1210, standardKg: 1170, variance: '+3.4%' },
  { day: '15/11 (Hôm nay)', actualKg: 1310, standardKg: 1200, variance: '+9.1%' },
];

const FEED_CONSUMPTION_SERIES_14D = [
  { day: '02/11', actualKg: 920, standardKg: 910 },
  { day: '03/11', actualKg: 950, standardKg: 930 },
  { day: '04/11', actualKg: 970, standardKg: 950 },
  { day: '05/11', actualKg: 990, standardKg: 980 },
  { day: '06/11', actualKg: 1010, standardKg: 1000 },
  { day: '07/11', actualKg: 1030, standardKg: 1010 },
  { day: '08/11', actualKg: 1040, standardKg: 1020 },
  ...FEED_CONSUMPTION_SERIES_7D,
];

// Dữ liệu biểu đồ Doanh thu vs Chi phí 6 tháng (Dành cho Chủ trại & Kế toán)
const FINANCIAL_SERIES_6M = [
  { month: 'T06', revenue: 420000000, cost: 360000000, profit: 60000000 },
  { month: 'T07', revenue: 480000000, cost: 395000000, profit: 85000000 },
  { month: 'T08', revenue: 530000000, cost: 410000000, profit: 120000000 },
  { month: 'T09', revenue: 390000000, cost: 340000000, profit: 50000000 },
  { month: 'T10', revenue: 610000000, cost: 450000000, profit: 160000000 },
  { month: 'T11 (Ước tính)', revenue: 680000000, cost: 475000000, profit: 205000000 },
];

// Dữ liệu biểu đồ tròn Cơ cấu đàn vật nuôi (Dành cho Trại trưởng & Nhân sự kỹ thuật khi không có quyền xem tiền)
const HERD_DISTRIBUTION_PIE = [
  { name: 'Gà thịt CP thương phẩm', value: 3930, color: '#10B981', percent: '56.5%' },
  { name: 'Gà ri thả vườn', value: 2200, color: '#3B82F6', percent: '31.6%' },
  { name: 'Heo thịt 3 máu', value: 875, color: '#F59E0B', percent: '11.9%' },
];

// Cảnh báo cần xử lý hôm nay
const ACTIONABLE_ALERTS = [
  {
    id: 'ALT-01',
    type: 'VACCINE',
    level: 'warning',
    badgeText: 'Lịch kỹ thuật',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    title: 'Vắc-xin Gumboro lần 2 (Chuồng A1)',
    desc: 'Lịch tiêm phòng cho 1.950 con gà thịt mốc 28 ngày tuổi. Cắt nước 2h trước khi nhỏ/pha.',
    actionText: 'Xử lý ngay',
    actionRoute: '/app/daily-logs',
    barnId: 201,
    requiresFinance: false,
  },
  {
    id: 'ALT-02',
    type: 'FEED_OVERAGE',
    level: 'critical',
    badgeText: 'Bất thường cám',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    title: 'Chuồng B1 cám vượt định mức +12%',
    desc: 'Tiêu thụ 770 kg/ngày so với mức quy trình 688 kg (+82 kg). Cần rà soát máng ăn rơi vãi.',
    actionText: 'Xem chi tiết',
    actionRoute: '/app/daily-logs',
    barnId: 101,
    requiresFinance: false,
  },
  {
    id: 'ALT-03',
    type: 'EXPIRY_NEAR',
    level: 'caution',
    badgeText: 'Cảnh báo kho',
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    title: 'Vắc-xin Newcastle Lô VC-2025 cận hạn',
    desc: 'Còn 15 ngày hết hạn sử dụng (HSD: 30/11/2026). Còn tồn 25 lọ trong Kho Thuốc.',
    actionText: 'Kiểm tra kho',
    actionRoute: '/app/inventory',
    requiresFinance: false,
  },
  {
    id: 'ALT-04',
    type: 'DEBT_DUE',
    level: 'finance',
    badgeText: 'Công nợ đến hạn',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    title: 'Khách hàng Lò mổ Tuấn Béo đến hạn thanh toán',
    desc: 'Số tiền 35.000.000 đ theo phiếu xuất chuồng XK-2026-081 đã quá hạn cam kết 2 ngày.',
    actionText: 'Thu tiền',
    actionRoute: '/app/cashbook',
    requiresFinance: true, // Chỉ hiện cho Chủ trại / Kế toán
  },
];

// Nhật ký hoạt động trực tiếp (Live Activity Feed)
const LIVE_ACTIVITIES = [
  {
    id: 'ACT-01',
    user: 'Nguyễn Văn Nam',
    role: 'Tổ trưởng chuồng',
    avatar: 'NV',
    barnId: 201,
    barnName: 'Chuồng A1',
    timeAgo: '10 phút trước',
    content: 'Đã hoàn tất ghi nhật ký: Chết 2 con do tiêu chảy, tiêu thụ 280 kg Cám Giai đoạn 2.',
    type: 'daily_log',
    badge: 'Nhật ký chuồng',
  },
  {
    id: 'ACT-02',
    user: 'Trần Văn Cường',
    role: 'Kế toán kho',
    avatar: 'TC',
    barnId: null,
    barnName: 'Kho Cám Trung Tâm',
    timeAgo: '45 phút trước',
    content: 'Nhập kho 100 bao cám De Heus từ Nhà cung cấp Cargill Việt Nam theo HĐ #NH-882.',
    type: 'inventory',
    badge: 'Nhập hàng',
  },
  {
    id: 'ACT-03',
    user: 'Lê Hoàng Phúc',
    role: 'Trại trưởng',
    avatar: 'LP',
    barnId: 101,
    barnName: 'Chuồng B1 (Heo thịt)',
    timeAgo: '2 giờ trước',
    content: 'Tạo lệnh xuất bán thương phẩm 50 con heo (tổng trọng lượng 5.250 kg) cho Lò mổ Tuấn Béo.',
    type: 'sales',
    badge: 'Xuất bán',
  },
  {
    id: 'ACT-04',
    user: 'Đoàn Thị Lan',
    role: 'Kế toán trưởng',
    avatar: 'DL',
    barnId: null,
    barnName: 'Toàn trại',
    timeAgo: '4 giờ trước',
    content: 'Lập phiếu chi 12.500.000 đ tiền điện vận hành trạm biến áp và dàn lạnh chuồng kín.',
    type: 'cashbook',
    badge: 'Chi quỹ',
    isFinancial: true,
  },
  {
    id: 'ACT-05',
    user: 'Phạm Văn Đức',
    role: 'Kỹ thuật viên thú y',
    avatar: 'PD',
    barnId: 102,
    barnName: 'Chuồng B2 (Heo thịt)',
    timeAgo: 'Hôm qua, 16:30',
    content: 'Đã hoàn thành tiêm phòng vắc-xin Dịch tả heo nhắc lại lần 2 cho toàn đàn 280 con.',
    type: 'veterinary',
    badge: 'Tiêm phòng',
  },
  {
    id: 'ACT-06',
    user: 'Nguyễn Văn Nam',
    role: 'Tổ trưởng chuồng',
    avatar: 'NV',
    barnId: 201,
    barnName: 'Chuồng A1',
    timeAgo: 'Hôm qua, 08:00',
    content: 'Cân mẫu 50 con gà: Trọng lượng trung bình đạt 1.52 kg (ADG đạt 81.4 g/ngày).',
    type: 'sampling',
    badge: 'Cân mẫu',
  },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const { activeFarm, activeBranch, activeBranchId, branches } = useActiveFarmStore();
  const { currentBranchId, dataVersion } = useActiveBranchStore();
  const { userInfo, hasPermission, isOwner, isSuperAdmin } = useAuthStore();

  const [financialSeries, setFinancialSeries] = useState(FINANCIAL_SERIES_6M);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [cashbookBalance, setCashbookBalance] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadRealtimeFinance = async () => {
      try {
        const defaultFarmId = Number(userInfo?.accessibleFarms?.[0]?.farmId || userInfo?.accessibleFarms?.[0]?.id || 1);
        const farmId = activeFarm?.id && activeFarm.id !== 'ALL' ? Number(activeFarm.id) : defaultFarmId;
        const effectiveBranchId = currentBranchId && currentBranchId !== 'ALL' ? Number(currentBranchId) : undefined;
        const [summaryRes, salesRes, cashbookRes] = await Promise.all([
          apiClient.get(`/farms/${farmId}/dashboard/summary`, { params: effectiveBranchId ? { branchId: effectiveBranchId } : {} }).then((r) => r.data).catch(() => null),
          financeService.getFarmSales(farmId, { branchId: effectiveBranchId, size: 100 }).catch(() => null),
          financeService.getCashbook(farmId, { branchId: effectiveBranchId, size: 100 }).catch(() => null),
        ]);
        if (!isMounted) return;

        if (summaryRes) {
          setDashboardSummary(summaryRes);
        }
        if (cashbookRes) {
          setCashbookBalance(Number(cashbookRes.cashBalance || 0) + Number(cashbookRes.bankBalance || 0));
        } else {
          setCashbookBalance(0);
        }

        const salesList = salesRes?.content || (Array.isArray(salesRes) ? salesRes : []);
        const totalSalesRev = salesList.reduce((sum, s) => sum + Number(s.totalAmount ?? s.finalAmount ?? 0), 0);
        const totalCashExpense = Number(cashbookRes?.totalExpense || 0);
        const totalCashIncome = Number(cashbookRes?.totalIncome || 0);

        const currentRev = Math.max(totalSalesRev, totalCashIncome);
        if (currentRev > 0 || totalCashExpense > 0) {
          setFinancialSeries((prev) => {
            const next = [...prev];
            const lastIdx = next.length - 1;
            next[lastIdx] = {
              ...next[lastIdx],
              month: `T${String(new Date().getMonth() + 1).padStart(2, '0')} (Thực tế)`,
              revenue: currentRev,
              cost: totalCashExpense,
              profit: currentRev - totalCashExpense,
            };
            return next;
          });
        } else if (farmId !== 1) {
          setFinancialSeries([
            { month: `T${String(new Date().getMonth() + 1).padStart(2, '0')} (Thực tế)`, revenue: 0, cost: 0, profit: 0 },
          ]);
        }
      } catch {
        // fallback cleanly
      }
    };
    loadRealtimeFinance();
    return () => { isMounted = false; };
  }, [activeFarm?.id, currentBranchId, dataVersion]);

  // Bộ lọc thời gian: TODAY | 7_DAYS | THIS_MONTH
  const [timeFilter, setTimeFilter] = useState('7_DAYS');
  // Chuyển đổi chuỗi ngày của biểu đồ cám (7 ngày hoặc 14 ngày)
  const [chartDayRange, setChartDayRange] = useState('7D');

  // RBAC & Financial View Check
  const userRoles = (userInfo?.roles || []).map((r) => (typeof r === 'string' ? r : r?.code));
  const isBarnWorker = userRoles.includes('ROLE_BARN_WORKER') || userRoles.includes('ROLE_FIELD_STAFF') || userRoles.includes('ROLE_WORKER');
  const isOwnerUser = isOwner?.() || isSuperAdmin?.() || userRoles.includes('ROLE_FARM_OWNER');
  const isAccountant = userRoles.includes('ROLE_ACCOUNTANT');
  const isManager = userRoles.includes('ROLE_FARM_MANAGER');

  // Có quyền xem số liệu tài chính nhạy cảm (Giá trị kho, Tiền quỹ, Doanh thu, Chi phí, Nợ)
  const canViewFinance = isOwnerUser || isAccountant || hasPermission?.('financial.view_cost') || hasPermission?.('cashbook.view');

  // Data Scope cho công nhân: Kiểm tra xem user có bị giới hạn theo barnIds không
  const currentFarmScope = useMemo(() => {
    return userInfo?.accessibleFarms?.find(
      (f) => Number(f.farmId) === Number(activeFarm?.id || 1)
    );
  }, [userInfo, activeFarm]);

  const allowedBarnIds = useMemo(() => {
    if (isBarnWorker && currentFarmScope && currentFarmScope.allBarns === false && Array.isArray(currentFarmScope.barnIds)) {
      return currentFarmScope.barnIds.map(Number);
    }
    return null; // null tức là toàn quyền xem tất cả chuồng
  }, [isBarnWorker, currentFarmScope]);

  // Danh sách chuồng thật theo Chi nhánh / Toàn chuỗi từ API
  const branchBarns = useMemo(() => {
    let barns = Array.isArray(dashboardSummary?.barns) ? dashboardSummary.barns : [];
    if (allowedBarnIds && allowedBarnIds.length > 0) {
      const allowedSet = new Set(allowedBarnIds);
      barns = barns.filter((b) => allowedSet.has(Number(b.id)));
    }
    return barns;
  }, [dashboardSummary, allowedBarnIds]);

  // 1. TÍNH TOÁN CÁC CHỈ SỐ KPI TỔNG QUAN TỪ DỮ LIỆU THẬT
  const totalAnimals = useMemo(() => {
    if (dashboardSummary && !allowedBarnIds) return Number(dashboardSummary.totalActiveHeads ?? 0);
    return branchBarns.reduce((sum, b) => sum + Number(b.currentQuantity || 0), 0);
  }, [dashboardSummary, branchBarns, allowedBarnIds]);

  const activeBarnCount = useMemo(() => {
    if (dashboardSummary && !allowedBarnIds) return Number(dashboardSummary.activeBarnsCount ?? 0);
    return branchBarns.filter((b) => Number(b.currentQuantity || 0) > 0).length;
  }, [dashboardSummary, branchBarns, allowedBarnIds]);

  const totalBarnCapacity = useMemo(() => {
    if (dashboardSummary && !allowedBarnIds) return Number(dashboardSummary.totalCapacity ?? 0);
    return branchBarns.reduce((sum, b) => sum + Number(b.capacity || 0), 0);
  }, [dashboardSummary, branchBarns, allowedBarnIds]);

  const totalDailyFeedKg = useMemo(() => {
    if (dashboardSummary && !allowedBarnIds) return Number(dashboardSummary.todayFeedKg ?? 0);
    return branchBarns.reduce((sum, b) => sum + Number(b.dailyFeedKg || 0), 0);
  }, [dashboardSummary, branchBarns, allowedBarnIds]);

  const avgFcr = useMemo(() => {
    if (dashboardSummary?.avgFcr != null) return Number(dashboardSummary.avgFcr).toFixed(2);
    if (branchBarns.length === 0) return '0.00';
    const sumFcr = branchBarns.reduce((sum, b) => sum + Number(b.fcr || 0), 0);
    return (sumFcr / branchBarns.length).toFixed(2);
  }, [dashboardSummary, branchBarns]);

  const herdDistributionPie = useMemo(() => {
    const palette = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];
    const active = branchBarns.filter((b) => Number(b.currentQuantity || 0) > 0);
    const total = active.reduce((s, b) => s + Number(b.currentQuantity || 0), 0);
    if (total === 0) return [];
    return active.map((b, idx) => {
      const val = Number(b.currentQuantity || 0);
      return {
        name: b.name || `Chuồng #${b.id}`,
        value: val,
        color: palette[idx % palette.length],
        percent: `${((val * 100) / total).toFixed(1)}%`,
      };
    });
  }, [branchBarns]);

  // Lọc Cảnh báo hành động (Actionable Alerts) — không hiện mock alerts trên trại mới chưa có đàn
  const filteredAlerts = useMemo(() => {
    if (totalAnimals === 0 && branchBarns.length === 0) return [];
    return ACTIONABLE_ALERTS.filter((alert) => {
      // Nếu là cảnh báo tài chính mà user không có quyền -> ẩn
      if (alert.requiresFinance && !canViewFinance) return false;
      // Nếu là công nhân chuồng và cảnh báo gắn với chuồng cụ thể -> kiểm tra data scope
      if (allowedBarnIds && alert.barnId && !allowedBarnIds.includes(Number(alert.barnId))) {
        return false;
      }
      return true;
    });
  }, [canViewFinance, allowedBarnIds, totalAnimals, branchBarns.length]);

  // Lọc Dòng hoạt động (Live Activity Feed) — không hiện mock activities trên trại mới chưa có đàn
  const filteredActivities = useMemo(() => {
    if (totalAnimals === 0 && branchBarns.length === 0) return [];
    return LIVE_ACTIVITIES.filter((act) => {
      // Ẩn hoạt động tài chính nếu là công nhân
      if (act.isFinancial && isBarnWorker) return false;
      // Kiểm tra chuồng của công nhân
      if (allowedBarnIds && act.barnId && !allowedBarnIds.includes(Number(act.barnId))) {
        return false;
      }
      return true;
    });
  }, [allowedBarnIds, isBarnWorker, totalAnimals, branchBarns.length]);

  // Tiêu đề tên chi nhánh hiển thị
  const branchDisplayName = useMemo(() => {
    if (!activeBranchId || activeBranchId === 'ALL') {
      return 'Cơ sở chính (Tổng hợp toàn hệ thống)';
    }
    return activeBranch?.name || `Chi nhánh ${activeBranchId}`;
  }, [activeBranchId, activeBranch]);

  return (
    <div className="space-y-6 pb-12" data-testid="dashboard-page">
      {/* ================= KHỐI 1: THANH TIÊU ĐỀ & LỐI TẮT THAO TÁC NHANH ================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Lời chào & Tên chi nhánh & Bộ lọc thời gian */}
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <LayoutDashboard className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                  Tổng quan vận hành — {branchDisplayName}
                </h1>
                <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                  Chào buổi sáng! Theo dõi sức khỏe đàn nuôi, FCR thức ăn và tình trạng vận hành hôm nay.
                </p>
              </div>
            </div>

            {/* Bộ lọc thời gian */}
            <div className="flex items-center gap-1.5 mt-3">
              <span className="text-xs font-medium text-slate-500 mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Kỳ xem:
              </span>
              <button
                type="button"
                onClick={() => setTimeFilter('TODAY')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  timeFilter === 'TODAY'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('7_DAYS')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  timeFilter === '7_DAYS'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                7 ngày qua
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('THIS_MONTH')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  timeFilter === 'THIS_MONTH'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tháng này
              </button>
            </div>
          </div>

          {/* Dãy phím tắt thao tác nhanh (Quick Action Shortcuts) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Ghi nhật ký: Hiển thị cho tất cả (Chủ trại, Trại trưởng, Công nhân) */}
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              onClick={() => navigate('/app/daily-logs')}
            >
              <ClipboardList className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              + Ghi nhật ký
            </Button>

            {/* 2. Xuất bán chuồng: Chủ trại, Trại trưởng */}
            {(isOwnerUser || isManager || hasPermission?.('sales.create')) && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold border-blue-600 text-blue-700 hover:bg-blue-50"
                onClick={() => navigate('/app/sales')}
              >
                <Scale className="w-3.5 h-3.5 mr-1 text-blue-600" />
                + Xuất bán chuồng
              </Button>
            )}

            {/* 3. Nhập kho: Chủ trại, Kế toán kho */}
            {(isOwnerUser || isAccountant || hasPermission?.('purchases.create')) && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold border-amber-600 text-amber-700 hover:bg-amber-50"
                onClick={() => navigate('/app/purchase-invoices')}
              >
                <Receipt className="w-3.5 h-3.5 mr-1 text-amber-600" />
                + Nhập kho
              </Button>
            )}

            {/* 4. Phiếu Thu/Chi: Chủ trại, Kế toán */}
            {canViewFinance && (
              <Button
                variant="primary"
                size="sm"
                className="text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
                onClick={() => navigate('/app/cashbook')}
              >
                <Wallet className="w-3.5 h-3.5 mr-1" />
                + Phiếu Thu/Chi
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ================= KHỐI 2: KHỐI 4 THẺ CHỈ SỐ KPI TỔNG QUAN (ADAPTIVE) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Quy mô Đàn nuôi (Adaptive Data Scope cho công nhân) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Quy mô đàn nuôi
            </span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">
              {formatNumber(totalAnimals)}
            </span>
            <span className="text-xs font-medium text-slate-500">con</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Đang nuôi: <strong>{activeBarnCount} chuồng</strong></span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> 98.2% sống
            </span>
          </div>
        </div>

        {/* Thẻ 2: Tiêu thụ Thức ăn & FCR */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Tiêu thụ cám & FCR
            </span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">
              {timeFilter === 'TODAY' ? formatNumber(totalDailyFeedKg) : '3.250'}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {timeFilter === 'TODAY' ? 'kg/ngày' : 'kg (130 bao)'}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>FCR trung bình: <strong className="text-slate-800">{avgFcr}</strong></span>
            <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold">
              <ArrowDownRight className="w-3 h-3" /> Đạt chuẩn
            </span>
          </div>
        </div>

        {/* Thẻ 3: Kho bãi & Vật tư (RBAC: Giá trị tồn kho vs Tình trạng vật tư) */}
        {canViewFinance ? (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Tổng giá trị tồn kho
              </span>
              <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Package className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-blue-900">
                {formatNumber(Math.round(Number(dashboardSummary?.inventoryValuation ?? 0)))}
              </span>
              <span className="text-xs font-medium text-slate-500">đ</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Theo kho thuộc phạm vi</span>
              <span className="text-blue-600 font-medium">Dữ liệu thực tế</span>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-800 uppercase tracking-wide">
                Tình trạng vật tư
              </span>
              <span className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <span className="text-lg font-bold text-slate-800">
                3 mặt hàng sắp hết
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-amber-100 flex items-center justify-between text-xs text-amber-700">
              <span>Cám Giai đoạn 1 & Amox</span>
              <span className="font-semibold text-rose-600">2 lô cận hạn</span>
            </div>
          </div>
        )}

        {/* Thẻ 4: Tài chính & Công nợ vs Nhắc việc hôm nay (RBAC) */}
        {canViewFinance ? (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Tồn quỹ thực tế
              </span>
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-emerald-700">
                {formatNumber(Math.round(cashbookBalance))}
              </span>
              <span className="text-xs font-medium text-slate-500">đ</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Phải thu: <strong className="text-blue-600">{formatCurrency(Number(dashboardSummary?.totalReceivableDebt ?? 0))}</strong></span>
              <span>Nợ NCC: <strong className="text-rose-600">{formatCurrency(Number(dashboardSummary?.totalPayableDebt ?? 0))}</strong></span>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-800 uppercase tracking-wide">
                Nhắc việc hôm nay
              </span>
              <span className="p-2 rounded-lg bg-blue-100 text-blue-700">
                <Syringe className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <span className="text-lg font-bold text-slate-800">
                2 lịch vắc-xin cần làm
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-blue-100 flex items-center justify-between text-xs text-blue-700">
              <span>Gumboro Chuồng A1</span>
              <span className="font-semibold text-emerald-700">Dịch tả Chuồng B1</span>
            </div>
          </div>
        )}
      </div>

      {/* ================= KHỐI 3: KHỐI BIỂU ĐỒ TRỰC QUAN (CHARTS SECTION - 2 CỘT) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột trái (7/12 ~ 60%): Biểu đồ Cám tiêu thụ Thực tế vs Định mức chuẩn */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Tiêu thụ Thức ăn: Thực tế vs Định mức chuẩn
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  So sánh khối lượng cám thực tế xuất kho/cho ăn so với quy trình kỹ thuật
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setChartDayRange('7D')}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    chartDayRange === '7D'
                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  7 ngày
                </button>
                <button
                  type="button"
                  onClick={() => setChartDayRange('14D')}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    chartDayRange === '14D'
                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  14 ngày
                </button>
              </div>
            </div>

            {/* Recharts Composed Chart (Bar + Line) */}
            <div className="mt-4 h-72 w-full" data-testid="feed-composed-chart">
              <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={260}>
                <ComposedChart
                  data={chartDayRange === '7D' ? FEED_CONSUMPTION_SERIES_7D : FEED_CONSUMPTION_SERIES_14D}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" kg" width={68} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${formatNumber(value)} kg`,
                      name === 'actualKg' ? 'Thực tế ăn' : 'Định mức chuẩn',
                    ]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
                    formatter={(value) => (value === 'actualKg' ? 'Cám thực tế (kg)' : 'Định mức chuẩn (kg)')}
                  />
                  <Bar dataKey="actualKg" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Line type="monotone" dataKey="standardKg" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Ngày 15/11 lượng cám tăng +9.1% do bắt đầu trộn cám đậm đặc giai đoạn vỗ béo.
            </span>
            <span className="font-medium text-emerald-700">Tỷ lệ hao hụt cám: 1.1%</span>
          </div>
        </div>

        {/* Cột phải (5/12 ~ 40%): Biểu đồ Tài chính hoặc Cơ cấu đàn (RBAC) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                {canViewFinance ? (
                  <>
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    Doanh thu vs Chi phí (6 tháng gần nhất)
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Cơ cấu Đàn vật nuôi theo Giống / Khu
                  </>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {canViewFinance
                  ? 'Theo dõi biên độ lợi nhuận và quy mô dòng tiền toàn trại'
                  : 'Tỷ trọng sĩ số các lứa nuôi đang xuất hiện trong hệ thống'}
              </p>
            </div>

            {canViewFinance ? (
              // Biểu đồ Cột đôi Doanh thu vs Chi phí (BarChart)
              <div className="mt-4 h-72 w-full" data-testid="finance-bar-chart">
                <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={260}>
                  <BarChart data={financialSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip
                      formatter={(val, name) => [
                        formatCurrency(val),
                        name === 'revenue' ? 'Doanh thu' : 'Chi phí',
                      ]}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
                      formatter={(val) => (val === 'revenue' ? 'Doanh thu' : 'Chi phí')}
                    />
                    <Bar dataKey="revenue" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="cost" fill="#F43F5E" radius={[3, 3, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              // Biểu đồ Tròn Donut Chart Cơ cấu đàn (dữ liệu thật theo chi nhánh)
              <div className="mt-4 h-72 w-full flex flex-col items-center justify-center" data-testid="herd-pie-chart">
                {herdDistributionPie.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">Chưa có đàn nuôi đang hoạt động trong chi nhánh này</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={210} minWidth={220} minHeight={200}>
                      <PieChart>
                        <Pie
                          data={herdDistributionPie}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {herdDistributionPie.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val, name) => [`${formatNumber(val)} con`, name]}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Chú giải Donut */}
                    <div className="w-full space-y-1.5 px-2 mt-2">
                      {herdDistributionPie.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="truncate max-w-[180px]">{item.name}</span>
                          </div>
                          <span className="font-semibold text-slate-800">{formatNumber(item.value)} con ({item.percent})</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            {canViewFinance ? (
              <>
                <span>Biên lợi nhuận ròng T11: <strong className="text-emerald-700">30.1%</strong></span>
                <button
                  type="button"
                  onClick={() => navigate('/app/cashbook')}
                  className="font-medium text-emerald-600 hover:underline flex items-center gap-0.5"
                >
                  Xem sổ quỹ <ArrowRight className="w-3 h-3" />
                </button>
              </>
            ) : (
              <>
                <span>Tổng sĩ số đàn: <strong className="text-slate-800">{formatNumber(totalAnimals)} con</strong></span>
                <button
                  type="button"
                  onClick={() => navigate('/app/barns')}
                  className="font-medium text-emerald-600 hover:underline flex items-center gap-0.5"
                >
                  Xem danh sách chuồng <ArrowRight className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ================= KHỐI 4: KHỐI CẢNH BÁO CẦN XỬ LÝ & NHẬT KÝ HOẠT ĐỘNG TRỰC TIẾP (2 CỘT DƯỚI) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột trái (6/12 ~ 50%): Trung tâm Cảnh báo & Nhắc việc Hôm nay */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    Trung tâm Cảnh báo & Nhắc việc Hôm nay
                  </h3>
                  <p className="text-xs text-slate-500">
                    Các tác vụ kỹ thuật, bất thường cám và hạn dùng cần can thiệp ngay
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                {filteredAlerts.length} cần xử lý
              </span>
            </div>

            {/* Danh sách Alert Cards */}
            <div className="mt-4 space-y-3">
              {filteredAlerts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  Mọi hoạt động hôm nay đều diễn ra suôn sẻ, không có cảnh báo nào!
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${alert.badgeColor}`}>
                          {alert.badgeText}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                          {alert.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {alert.desc}
                      </p>
                    </div>

                    <div className="shrink-0 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-semibold hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
                        onClick={() => navigate(alert.actionRoute, { state: { barnId: alert.barnId } })}
                      >
                        {alert.actionText}
                        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-400">
              Hệ thống tự động kích hoạt cảnh báo theo thời gian thực và quy trình dinh dưỡng
            </span>
          </div>
        </div>

        {/* Cột phải (6/12 ~ 50%): Nhật ký Hoạt động Trực tiếp (Live Activity Feed) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    Hoạt động Chuồng trại Gần đây
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nhật ký thời gian thực từ các bộ phận chuồng, kho và tài chính
                  </p>
                </div>
              </div>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Trực tiếp
              </span>
            </div>

            {/* Dòng thời gian Timeline */}
            <div className="mt-4 divide-y divide-slate-100">
              {filteredActivities.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  Chưa có hoạt động nào được ghi nhận gần đây.
                </div>
              ) : (
                filteredActivities.map((act) => (
                  <div key={act.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                      {act.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-bold text-slate-800">{act.user}</span>
                          <span className="text-[11px] text-slate-400">({act.role})</span>
                          {act.barnName && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-medium text-slate-600">
                              {act.barnName}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">{act.timeAgo}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {act.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Hiển thị <strong>{filteredActivities.length}</strong> sự kiện gần nhất</span>
            <button
              type="button"
              onClick={() => navigate('/app/daily-logs')}
              className="text-emerald-600 font-medium hover:underline flex items-center gap-1"
            >
              Mở nhật ký đầy đủ <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
