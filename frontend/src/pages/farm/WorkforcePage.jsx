import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Banknote,
  Award,
  Sparkles,
  UserCheck,
  Phone,
  CreditCard,
  Building,
  Clock,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Hammer,
  BadgeCheck,
  FileSpreadsheet,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { apiClient } from '@/services/api/apiClient';
import { toast } from '@/store/useToastStore';
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters';

// ================= DỮ LIỆU NHÂN SỰ MẪU CHUẨN THỰC CHIẾN FARMGO =================

export const MOCK_BARNS_AND_BATCHES = [
  { id: 1, barnName: 'Chuồng Gà A1', batchName: 'Lứa Gà Thịt T11 (3.000 con)' },
  { id: 2, barnName: 'Chuồng Gà A2', batchName: 'Lứa Gà Thịt T10 (Chuẩn bị thả)' },
  { id: 3, barnName: 'Chuồng Heo B1', batchName: 'Lứa Heo Thịt H09 (120 con)' },
  { id: 4, barnName: 'Chuồng Heo B2', batchName: 'Lứa Heo Thịt H08 (Đã xuất chuồng)' },
];

export const INITIAL_FIXED_WORKERS = [
  {
    id: 1,
    code: 'NV-001',
    fullName: 'Nguyễn Văn Nam',
    phone: '0977 444 888',
    idCard: '075095001234',
    jobTitle: 'Tổ trưởng chuồng gà thịt',
    department: 'Khu A - Gà thịt',
    startDate: '2025-06-15',
    baseSalary: 9000000,
    allowance: 1000000,
    totalMonthlySalary: 10000000,
    advancePaid: 3000000,
    remainingSalary: 7000000,
    status: 'ACTIVE',
    hasAppAccount: true,
    appEmail: 'nhanvien1@gmail.com',
  },
  {
    id: 2,
    code: 'NV-002',
    fullName: 'Trần Văn Hùng',
    phone: '0988 123 456',
    idCard: '075092008899',
    jobTitle: 'Chăm sóc & cho ăn chuồng heo',
    department: 'Khu B - Heo thịt',
    startDate: '2025-08-01',
    baseSalary: 8500000,
    allowance: 500000,
    totalMonthlySalary: 9000000,
    advancePaid: 2000000,
    remainingSalary: 7000000,
    status: 'ACTIVE',
    hasAppAccount: false,
    appEmail: null,
  },
  {
    id: 3,
    code: 'NV-003',
    fullName: 'Lê Văn Bình',
    phone: '0911 222 333',
    idCard: '075088005544',
    jobTitle: 'Vận hành kho cám & phối trộn',
    department: 'Kho Cám Khu A & B',
    startDate: '2026-01-10',
    baseSalary: 8000000,
    allowance: 500000,
    totalMonthlySalary: 8500000,
    advancePaid: 0,
    remainingSalary: 8500000,
    status: 'ACTIVE',
    hasAppAccount: false,
    appEmail: null,
  },
  {
    id: 4,
    code: 'NV-004',
    fullName: 'Phạm Thị Mai',
    phone: '0933 777 999',
    idCard: '075196003322',
    jobTitle: 'Tạp vụ & nấu ăn ca trang trại',
    department: 'Toàn trại',
    startDate: '2025-10-01',
    baseSalary: 7000000,
    allowance: 500000,
    totalMonthlySalary: 7500000,
    advancePaid: 2500000,
    remainingSalary: 5000000,
    status: 'ACTIVE',
    hasAppAccount: false,
    appEmail: null,
  },
  {
    id: 5,
    code: 'NV-005',
    fullName: 'Đỗ Văn Tài',
    phone: '0944 666 555',
    idCard: '075089007711',
    jobTitle: 'Bảo vệ & khử trùng xe cám',
    department: 'Cổng Khử Trùng Số 1',
    startDate: '2025-05-20',
    baseSalary: 7000000,
    allowance: 500000,
    totalMonthlySalary: 7500000,
    advancePaid: 2000000,
    remainingSalary: 5500000,
    status: 'ACTIVE',
    hasAppAccount: false,
    appEmail: null,
  },
  {
    id: 6,
    code: 'NV-006',
    fullName: 'Ngô Văn Thắng',
    phone: '0966 888 777',
    idCard: '075091004455',
    jobTitle: 'Kỹ thuật bảo dưỡng điện nước & giàn lạnh',
    department: 'Toàn trại',
    startDate: '2025-07-15',
    baseSalary: 8500000,
    allowance: 1000000,
    totalMonthlySalary: 9500000,
    advancePaid: 3000000,
    remainingSalary: 6500000,
    status: 'ACTIVE',
    hasAppAccount: false,
    appEmail: null,
  },
];

export const INITIAL_SEASONAL_TASKS = [
  {
    id: 1,
    workDate: '2026-11-14',
    taskName: 'Bốc vác 300 bao cám từ xe vào kho B',
    workerOrTeam: 'Đội bốc vác Long Khánh (4 người)',
    barnId: 3,
    barnName: 'Chuồng Heo B1',
    batchName: 'Lứa Heo Thịt H09',
    calcType: 'PIECEWORK', // Theo sản lượng khoán
    workload: '300 Bao (x 2.000 đ/bao)',
    totalWage: 600000,
    paymentStatus: 'PAID', // Đã trả tiền
    paymentMethod: 'CASH',
    refCashSlip: 'PC-2026-052',
  },
  {
    id: 2,
    workDate: '2026-11-13',
    taskName: 'Thuê đội bắt gà xuất bán đợt 1 ban đêm',
    workerOrTeam: 'Tổ bắt gà anh Bảy (6 người)',
    barnId: 1,
    barnName: 'Chuồng Gà A1',
    batchName: 'Lứa Gà Thịt T11',
    calcType: 'PIECEWORK',
    workload: '3.000 Con (x 600 đ/con)',
    totalWage: 1800000,
    paymentStatus: 'PAID',
    paymentMethod: 'BANK',
    refCashSlip: 'PC-2026-050',
  },
  {
    id: 3,
    workDate: '2026-11-10',
    taskName: 'Tiêm phòng vắc-xin Dịch tả & Tai xanh cho heo',
    workerOrTeam: 'Đội thú y dịch vụ Gia Kiệm (3 người)',
    barnId: 3,
    barnName: 'Chuồng Heo B1',
    batchName: 'Lứa Heo Thịt H09',
    calcType: 'DAILY', // Theo công nhật
    workload: '3 người x 1 ngày (350.000 đ/công)',
    totalWage: 1050000,
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    refCashSlip: 'PC-2026-049',
  },
  {
    id: 4,
    workDate: '2026-11-06',
    taskName: 'Xịt rửa áp lực cao & rắc vôi khử trùng chuồng gà',
    workerOrTeam: 'Tổ vệ sinh chuồng Tân Phú (5 người)',
    barnId: 2,
    barnName: 'Chuồng Gà A2',
    batchName: 'Lứa Gà Thịt T10',
    calcType: 'DAILY',
    workload: '5 người x 1 ngày (300.000 đ/công)',
    totalWage: 1500000,
    paymentStatus: 'UNPAID', // Chưa trả
    paymentMethod: null,
    refCashSlip: null,
  },
];

export const INITIAL_PAYROLL_HISTORY = [
  {
    id: 1,
    refCashSlip: 'PC-2026-044',
    date: '2026-11-05',
    workerName: 'Toàn thể 6 nhân công chuồng trại',
    payoutType: 'PAYROLL_FULL', // Thanh toán lương tháng
    amount: 85000000,
    fundSource: 'CASH',
    notes: 'Chi trả lương cứng và thưởng năng suất tháng 10/2026',
  },
  {
    id: 2,
    refCashSlip: 'PC-2026-048',
    date: '2026-11-08',
    workerName: 'Nguyễn Văn Nam',
    payoutType: 'ADVANCE', // Tạm ứng
    amount: 3000000,
    fundSource: 'CASH',
    notes: 'Tạm ứng chi phí sinh hoạt gia đình đợt 1',
  },
  {
    id: 3,
    refCashSlip: 'PC-2026-049',
    date: '2026-11-10',
    workerName: 'Phạm Thị Mai',
    payoutType: 'ADVANCE',
    amount: 2500000,
    fundSource: 'BANK',
    notes: 'Tạm ứng tiền gửi về quê chuyển khoản Vietcombank',
  },
  {
    id: 4,
    refCashSlip: 'PC-2026-050',
    date: '2026-11-13',
    workerName: 'Tổ bắt gà anh Bảy (6 người)',
    payoutType: 'SEASONAL', // Trả công thời vụ
    amount: 1800000,
    fundSource: 'BANK',
    notes: 'Thanh toán tiền công khoán bắt 3.000 con gà chuồng A1',
  },
  {
    id: 5,
    refCashSlip: 'PC-2026-051',
    date: '2026-11-14',
    workerName: 'Ngô Văn Thắng',
    payoutType: 'ADVANCE',
    amount: 3000000,
    fundSource: 'BANK',
    notes: 'Tạm ứng chi phí cá nhân chuyển khoản',
  },
];

export function WorkforcePage() {
  const { userInfo, isOwner, isSuperAdmin, hasPermission } = useAuthStore();
  const { activeFarmId } = useActiveFarmStore();
  const { activeBranchId } = useActiveBranchStore();
  const userRoles = (userInfo?.roles || []).map((r) => (typeof r === 'string' ? r : r?.code)).filter(Boolean);

  // Phân quyền RBAC
  // Chỉ Chủ trại, Kế toán kho, Trại trưởng được xem phân hệ này
  const canAccessWorkforce = useMemo(() => {
    return (
      isOwner?.() ||
      isSuperAdmin?.() ||
      userRoles.includes('ROLE_FARM_OWNER') ||
      userRoles.includes('ROLE_ACCOUNTANT') ||
      userRoles.includes('ROLE_FARM_MANAGER') ||
      hasPermission?.('workforce.view')
    );
  }, [userInfo, userRoles]);

  // Trại trưởng không có quyền workforce.salary.view / financial.price.view sẽ bị ẩn toàn bộ các thẻ và cột tiền bạc
  const canViewSalary = useMemo(() => {
    return (
      isOwner?.() ||
      isSuperAdmin?.() ||
      userRoles.includes('ROLE_FARM_OWNER') ||
      userRoles.includes('ROLE_ACCOUNTANT') ||
      hasPermission?.('workforce.salary.view') ||
      hasPermission?.('workforce.view_salary') ||
      hasPermission?.('financial.price.view') ||
      hasPermission?.('financial.view_cost')
    );
  }, [userInfo, userRoles]);

  // 3 Tab chính
  const [activeTab, setActiveTab] = useState('FIXED_WORKERS'); // FIXED_WORKERS, SEASONAL_TASKS, PAYROLL_HISTORY

  // State danh sách (dữ liệu thật từ Backend API)
  const [workers, setWorkers] = useState([]);
  const [seasonalTasks, setSeasonalTasks] = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const defaultFarmId = Number(userInfo?.accessibleFarms?.[0]?.farmId || userInfo?.accessibleFarms?.[0]?.id || 1);
  const targetFarmId = activeFarmId && activeFarmId !== 'ALL' ? activeFarmId : defaultFarmId;

  const loadWorkforceOverview = useCallback(async () => {
    if (!canAccessWorkforce) return;
    setIsLoading(true);
    try {
      const params = {};
      if (activeBranchId && activeBranchId !== 'ALL') {
        params.branchId = activeBranchId;
      }
      const res = await apiClient.get(`/farms/${targetFarmId}/workforce/overview`, { params });
      const data = res?.data || {};

      const mappedWorkers = (data.fixedWorkers || []).map((w) => ({
        id: w.id,
        code: w.code || `NV-${w.id}`,
        fullName: w.fullName || '',
        phone: w.phone || '',
        idCard: w.idCard || '',
        jobTitle: w.jobTitle || 'Nhân viên chăn nuôi',
        department: w.department || 'Khu nuôi',
        startDate: w.startDate || '',
        baseSalary: Number(w.baseSalary || 0),
        allowance: Number(w.allowance || 0),
        totalMonthlySalary: Number(w.totalMonthlySalary || 0),
        advancePaid: Number(w.advancePaid || 0),
        remainingSalary: Number(w.remainingSalary || 0),
        status: 'ACTIVE',
        paymentStatus: w.paymentStatus || 'UNPAID',
        hasAppAccount: false,
        appEmail: null,
      }));

      const mappedTasks = (data.pieceworkContracts || []).map((t) => ({
        id: t.id,
        workDate: t.workDate || '',
        taskName: t.taskType || t.contractCode || 'Công khoán',
        workerOrTeam: t.workerName || '',
        barnId: t.barnId || 1,
        barnName: t.barnName || 'Chuồng trại',
        batchName: t.batchName || 'Lứa nuôi',
        calcType: 'PIECEWORK',
        workload: `${formatNumber(t.quantity || 1)} ${t.unit || 'Công'} (x ${formatNumber(t.unitPrice || 0)} đ)`,
        totalWage: Number(t.totalAmount || 0),
        paymentStatus: t.paymentStatus || 'UNPAID',
        paymentMethod: t.paymentStatus === 'PAID' ? 'CASH' : null,
        refCashSlip: t.paymentStatus === 'PAID' ? `PC-${t.contractCode}` : null,
      }));

      const mappedHistory = (data.payrollHistory || []).map((h) => ({
        id: h.id,
        refCashSlip: h.refCashSlip || `PC-${h.id}`,
        date: h.date || '',
        workerName: h.workerName || '',
        payoutType: h.payoutType || 'PAYROLL_FULL',
        amount: Number(h.amount || 0),
        fundSource: h.fundSource === 'CASH' ? 'CASH' : 'BANK',
        notes: h.notes || '',
      }));

      setWorkers(mappedWorkers);
      setSeasonalTasks(mappedTasks);
      setPayrollHistory(mappedHistory);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể tải dữ liệu Nhân công & Quỹ lương');
    } finally {
      setIsLoading(false);
    }
  }, [canAccessWorkforce, targetFarmId, activeBranchId]);

  useEffect(() => {
    loadWorkforceOverview();
  }, [loadWorkforceOverview]);

  // Bộ lọc Tab 1
  const [workerSearch, setWorkerSearch] = useState('');
  const [workerStatusFilter, setWorkerStatusFilter] = useState('ACTIVE'); // ACTIVE, RESIGNED, ALL

  // Bộ lọc Tab 2
  const [taskBarnFilter, setTaskBarnFilter] = useState('ALL');

  // Modals
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [workerForm, setWorkerForm] = useState({
    fullName: '',
    phone: '',
    idCard: '',
    jobTitle: '',
    department: 'Khu A - Gà thịt',
    startDate: new Date().toISOString().split('T')[0],
    baseSalary: 8500000,
    allowance: 500000,
    hasAppAccount: false,
    appEmail: '',
  });

  // Modal Ghi nhận công thời vụ
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    workDate: new Date().toISOString().split('T')[0],
    taskName: 'Bốc vác cám từ xe vào kho B',
    workerOrTeam: 'Đội bốc vác Long Khánh (4 người)',
    barnId: 1,
    calcType: 'DAILY', // DAILY hoặc PIECEWORK
    peopleCount: 4,
    daysCount: 1,
    dailyRate: 300000,
    workloadAmount: 300,
    pieceworkRate: 2000,
    payNow: true,
    fundSource: 'CASH',
  });

  // Modal Tạm ứng / Chốt lương
  const [isSalaryActionModalOpen, setIsSalaryActionModalOpen] = useState(false);
  const [selectedWorkerForSalary, setSelectedWorkerForSalary] = useState(null);
  const [salaryActionMode, setSalaryActionMode] = useState('PAY_FULL'); // PAY_FULL hoặc ADVANCE
  const [salaryActionForm, setSalaryActionForm] = useState({
    bonusAmount: 0,
    advanceAmount: 2000000,
    fundSource: 'CASH',
    notes: '',
  });

  // ================= TÍNH TOÁN TOP KPI CARDS =================
  const kpiStats = useMemo(() => {
    const activeWorkersCount = workers.filter((w) => w.status === 'ACTIVE').length;
    const seasonalTeamsCount = seasonalTasks.length;

    let totalAdvance = 0;
    let totalPayrollAndTasks = 0;

    workers.forEach((w) => {
      if (w.status === 'ACTIVE') {
        totalAdvance += w.advancePaid || 0;
        totalPayrollAndTasks += w.totalMonthlySalary || 0;
      }
    });

    seasonalTasks.forEach((t) => {
      totalPayrollAndTasks += t.totalWage || 0;
    });

    return {
      activeWorkersCount,
      seasonalTeamsCount,
      totalAdvance, // 12.500.000 đ
      totalPayrollAndTasks, // 48.000.000 đ
    };
  }, [workers, seasonalTasks]);

  // ================= LỌC DANH SÁCH TAB 1 =================
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (workerStatusFilter !== 'ALL' && w.status !== workerStatusFilter) return false;
      if (workerSearch.trim()) {
        const q = workerSearch.toLowerCase();
        const matchName = w.fullName.toLowerCase().includes(q);
        const matchPhone = (w.phone || '').includes(q);
        const matchJob = (w.jobTitle || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchJob) return false;
      }
      return true;
    });
  }, [workers, workerStatusFilter, workerSearch]);

  // ================= LỌC DANH SÁCH TAB 2 =================
  const filteredTasks = useMemo(() => {
    return seasonalTasks.filter((t) => {
      if (taskBarnFilter !== 'ALL' && String(t.barnId) !== String(taskBarnFilter)) return false;
      return true;
    });
  }, [seasonalTasks, taskBarnFilter]);

  // ================= XỬ LÝ MODAL 1: THÊM / SỬA NHÂN CÔNG =================
  const handleOpenWorkerModal = (worker = null) => {
    setEditingWorker(worker);
    if (worker) {
      setWorkerForm({
        fullName: worker.fullName,
        phone: worker.phone || '',
        idCard: worker.idCard || '',
        jobTitle: worker.jobTitle || '',
        department: worker.department || 'Toàn trại',
        startDate: worker.startDate || new Date().toISOString().split('T')[0],
        baseSalary: worker.baseSalary || 8000000,
        allowance: worker.allowance || 500000,
        hasAppAccount: worker.hasAppAccount || false,
        appEmail: worker.appEmail || '',
      });
    } else {
      setWorkerForm({
        fullName: '',
        phone: '',
        idCard: '',
        jobTitle: 'Chăm sóc chuồng nuôi',
        department: 'Khu A - Gà thịt',
        startDate: new Date().toISOString().split('T')[0],
        baseSalary: 8500000,
        allowance: 500000,
        hasAppAccount: false,
        appEmail: '',
      });
    }
    setIsWorkerModalOpen(true);
  };

  const handleSaveWorker = async (e) => {
    e.preventDefault();
    if (!workerForm.fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên nhân công');
      return;
    }

    const base = Number(workerForm.baseSalary) || 0;
    const cleanPhone = (workerForm.phone || '0901234567').replace(/\s+/g, '');
    const cleanIdCard = (workerForm.idCard || '075095001234').replace(/\s+/g, '');
    const defaultEmail = workerForm.appEmail?.trim()
      ? workerForm.appEmail.trim()
      : `nv${Date.now() % 100000}@gmail.com`;

    try {
      if (editingWorker) {
        await apiClient.put(`/farms/${targetFarmId}/workforce/workers/${editingWorker.id}`, {
          fullName: workerForm.fullName.trim(),
          phone: cleanPhone,
          idCardNumber: cleanIdCard,
          position: workerForm.jobTitle || 'Nhân viên chăn nuôi',
          department: workerForm.department || 'Khu nuôi',
          baseSalary: base,
        });
        toast.success(`Đã cập nhật hồ sơ "${workerForm.fullName}" thành công!`);
      } else {
        await apiClient.post(`/farms/${targetFarmId}/workforce/workers`, {
          farmId: Number(targetFarmId),
          employeeCode: `NV-${String(Date.now() % 100000).padStart(5, '0')}`,
          fullName: workerForm.fullName.trim(),
          phone: cleanPhone,
          email: defaultEmail,
          idCardNumber: cleanIdCard,
          dateOfBirth: '1995-01-01',
          position: workerForm.jobTitle || 'Nhân viên chăn nuôi',
          department: workerForm.department || 'Khu nuôi',
          joinedDate: workerForm.startDate || new Date().toISOString().split('T')[0],
          baseSalary: base,
          contractType: 'FULL_TIME',
        });
        toast.success(`Đã thêm mới nhân công "${workerForm.fullName}"!`);
      }
      setIsWorkerModalOpen(false);
      await loadWorkforceOverview();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể lưu hồ sơ nhân công');
    }
  };

  // ================= XỬ LÝ MODAL 2: GHI NHẬN CÔNG THỜI VỤ =================
  const handleOpenTaskModal = () => {
    setTaskForm({
      workDate: new Date().toISOString().split('T')[0],
      taskName: 'Thuê đội tiêm vắc-xin cho đàn',
      workerOrTeam: 'Đội thú y dịch vụ Gia Kiệm',
      barnId: 1,
      calcType: 'DAILY',
      peopleCount: 3,
      daysCount: 1,
      dailyRate: 350000,
      workloadAmount: 2000,
      pieceworkRate: 600,
      payNow: true,
      fundSource: 'CASH',
    });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    const barnObj = MOCK_BARNS_AND_BATCHES.find((b) => b.id === Number(taskForm.barnId));

    let quantity = 1;
    let unitPrice = 0;
    let unit = 'Công';

    if (taskForm.calcType === 'DAILY') {
      const p = Number(taskForm.peopleCount) || 1;
      const d = Number(taskForm.daysCount) || 1;
      quantity = p * d;
      unitPrice = Number(taskForm.dailyRate) || 0;
      unit = 'Công';
    } else {
      quantity = Number(taskForm.workloadAmount) || 1;
      unitPrice = Number(taskForm.pieceworkRate) || 0;
      unit = 'Đơn vị';
    }

    try {
      const res = await apiClient.post(`/farms/${targetFarmId}/workforce/piecework`, {
        workerName: taskForm.workerOrTeam,
        barnId: Number(taskForm.barnId),
        barnName: barnObj?.barnName || 'Chuồng trại',
        batchName: barnObj?.batchName || 'Lứa nuôi',
        workDate: taskForm.workDate,
        taskType: taskForm.taskName,
        quantity,
        unit,
        unitPrice,
        payNow: Boolean(taskForm.payNow),
        paymentMethod: taskForm.fundSource === 'CASH' ? 'TIEN_MAT' : 'CHUYEN_KHOAN',
        notes: taskForm.taskName,
      });

      const created = res?.data;
      toast.success(
        taskForm.payNow
          ? `Đã ghi nhận công khoán "${created?.contractCode || ''}" và sinh Phiếu Chi vào Sổ quỹ!`
          : `Đã ghi nhận công khoán vào chi phí ${barnObj?.barnName || 'chuồng trại'}!`
      );
      setIsTaskModalOpen(false);
      await loadWorkforceOverview();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể lưu công thời vụ');
    }
  };

  // ================= XỬ LÝ MODAL 3: TẠM ỨNG & CHỐT LƯƠNG =================
  const handleOpenSalaryAction = (worker, mode = 'PAY_FULL') => {
    setSelectedWorkerForSalary(worker);
    setSalaryActionMode(mode);

    if (mode === 'ADVANCE') {
      setSalaryActionForm({
        bonusAmount: 0,
        advanceAmount: 2000000,
        fundSource: 'CASH',
        notes: `Tạm ứng tiền lương đợt này cho ${worker.fullName}`,
      });
    } else {
      setSalaryActionForm({
        bonusAmount: 500000,
        advanceAmount: 0,
        fundSource: 'BANK',
        notes: `Thanh toán lương tháng cho ${worker.fullName}`,
      });
    }

    setIsSalaryActionModalOpen(true);
  };

  const handleConfirmSalaryAction = async () => {
    if (!selectedWorkerForSalary) return;

    const paymentMethod = salaryActionForm.fundSource === 'CASH' ? 'TIEN_MAT' : 'BANK_TRANSFER';
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      if (salaryActionMode === 'ADVANCE') {
        const adv = Number(salaryActionForm.advanceAmount) || 0;
        if (adv <= 0) {
          toast.error('Vui lòng nhập số tiền tạm ứng hợp lệ');
          return;
        }
        const remSalary = Number(selectedWorkerForSalary.remainingSalary ?? 0);
        if (adv > remSalary) {
          toast.error(`Số tiền tạm ứng (${formatCurrency(adv)}) vượt quá lương còn lại (${formatCurrency(remSalary)})`);
          return;
        }

        const res = await apiClient.post(`/farms/${targetFarmId}/workforce/advance`, {
          workerId: selectedWorkerForSalary.id,
          amount: adv,
          advanceDate: todayStr,
          reason: salaryActionForm.notes || `Tạm ứng tiền lương cho ${selectedWorkerForSalary.fullName}`,
          paymentMethod,
        });

        const slipCode = res?.data?.expenseCode || 'PC-UNG';
        toast.success(
          `Đã tạm ứng ${formatCurrency(adv)} cho "${selectedWorkerForSalary.fullName}" và sinh phiếu chi "${slipCode}"!`
        );
      } else {
        const bonus = Number(salaryActionForm.bonusAmount) || 0;
        const netPay = (selectedWorkerForSalary.remainingSalary || 0) + bonus;

        const res = await apiClient.post(`/farms/${targetFarmId}/workforce/pay-salary`, {
          workerId: selectedWorkerForSalary.id,
          amount: netPay,
          payDate: todayStr,
          paymentMethod,
          notes:
            salaryActionForm.notes ||
            `Chốt & Thanh toán lương thực lĩnh (sau trừ tạm ứng) cho ${selectedWorkerForSalary.fullName}`,
        });

        const slipCode = res?.data?.expenseCode || 'PC-LUONG';
        toast.success(
          `Đã thanh toán dứt điểm ${formatCurrency(netPay)} tiền lương cho "${selectedWorkerForSalary.fullName}" và sinh phiếu chi "${slipCode}"!`
        );
      }

      setIsSalaryActionModalOpen(false);
      await loadWorkforceOverview();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể thực hiện giao dịch lương lên hệ thống');
    }
  };

  // ================= NẾU KHÔNG CÓ QUYỀN TRUY CẬP =================
  if (!canAccessWorkforce) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <div className="h-16 w-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Truy Cập Bị Từ Chối (Phân Hệ Nhân Công)</h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Phân hệ <strong>Quản Lý Nhân Công & Quỹ Lương</strong> chỉ dành riêng cho <strong>Chủ trang trại</strong>,{' '}
          <strong>Kế toán kho</strong> và <strong>Trại trưởng</strong>. Tài khoản của bạn không được cấp quyền truy cập.
        </p>
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            Quay Lại Trang Trước
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" />
            <span>Quản Lý Nhân Công & Quỹ Lương</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mô hình trang trại tối giản: Hồ sơ người lao động, lương tháng cố định, công khoán theo lứa nuôi và liên thông Sổ quỹ.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 1: KHỐI THỐNG KÊ NHÂN SỰ & QUỸ LƯƠNG (TOP KPI CARDS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Thẻ 1: Tổng nhân công đang hoạt động */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Tổng Nhân Công Đang Hoạt Động
            </span>
            <div className="text-2xl font-black text-slate-900 tracking-tight my-1">
              {kpiStats.activeWorkersCount} người cố định + {kpiStats.seasonalTeamsCount} tổ thời vụ
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-emerald-600" />
              <span>Chăm sóc chuồng, kho cám, bảo vệ & tạp vụ</span>
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Thẻ 2: Tổng tiền đã tạm ứng trong tháng (Ẩn với Trại trưởng không có quyền xem lương) */}
        {canViewSalary && (
          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between bg-amber-50/20">
            <div>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">
                Tổng Tiền Đã Tạm Ứng Trong Tháng
              </span>
              <div className="text-2xl font-black text-amber-700 font-mono tracking-tight my-1">
                {formatCurrency(kpiStats.totalAdvance)}
              </div>
              <p className="text-[11px] text-amber-600 font-medium">
                Tự động khấu trừ khi chốt lương cuối kỳ
              </p>
            </div>
            <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>
        )}

        {/* Thẻ 3: Tổng chi phí nhân công & khoán việc kỳ này (Ẩn với Trại trưởng) */}
        {canViewSalary && (
          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between bg-emerald-50/20">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                Tổng Chi Phí Nhân Công & Khoán Việc Kỳ Này
              </span>
              <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight my-1">
                {formatCurrency(kpiStats.totalPayrollAndTasks)}
              </div>
              <p className="text-[11px] text-emerald-600 font-medium">
                Bao gồm quỹ lương tháng và công khoán thời vụ
              </p>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
              <Banknote className="h-6 w-6" />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 2: HỆ THỐNG 3 TAB NGHIỆP VỤ CHÍNH (WORKFORCE TABS) */}
      {/* ========================================================================= */}
      <div className="flex border-b border-slate-200 text-xs overflow-x-auto gap-1 bg-white p-1 rounded-xl shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('FIXED_WORKERS')}
          className={`px-3.5 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${
            activeTab === 'FIXED_WORKERS'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          <span>1. Nhân Công Cố Định (Lương Tháng) ({workers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SEASONAL_TASKS')}
          className={`px-3.5 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${
            activeTab === 'SEASONAL_TASKS'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Hammer className="h-4 w-4" />
          <span>2. Công Thời Vụ & Khoán Việc Theo Lứa ({seasonalTasks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PAYROLL_HISTORY')}
          className={`px-3.5 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${
            activeTab === 'PAYROLL_HISTORY'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>3. Lịch Sử Tạm Ứng & Chi Trả Lương ({payrollHistory.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* NỘI DUNG TAB 1: NHÂN CÔNG CỐ ĐỊNH (LƯƠNG THÁNG) */}
      {/* ========================================================================= */}
      {activeTab === 'FIXED_WORKERS' && (
        <div className="space-y-4">
          {/* Toolbar tìm kiếm & Thêm nhân công */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  placeholder="Tìm theo tên nhân viên, SĐT, vị trí..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <select
                value={workerStatusFilter}
                onChange={(e) => setWorkerStatusFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ACTIVE">Đang làm việc</option>
                <option value="RESIGNED">Đã nghỉ việc</option>
                <option value="ALL">Tất cả trạng thái</option>
              </select>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => handleOpenWorkerModal(null)}
              className="font-bold shadow-sm"
            >
              + Thêm Nhân Công Mới
            </Button>
          </div>

          {/* Bảng danh sách nhân công cố định */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Mã NV & Họ Tên</th>
                    <th className="py-3 px-4">Vị Trí / Công Việc</th>
                    <th className="py-3 px-4">Khu Vực Phụ Trách</th>
                    {canViewSalary && (
                      <>
                        <th className="py-3 px-3 text-right">Lương Tháng</th>
                        <th className="py-3 px-3 text-right">Đã Tạm Ứng</th>
                        <th className="py-3 px-3 text-right">Còn Lại Phải Trả</th>
                      </>
                    )}
                    <th className="py-3 px-4 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWorkers.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Mã & Họ tên */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                          <span>{w.fullName}</span>
                          {w.hasAppAccount ? (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-bold"
                              title={`Tài khoản ứng dụng: ${w.appEmail}`}
                            >
                              App Mobile
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-medium">
                              Lao động tự do
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{w.code}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {w.phone}
                          </span>
                        </div>
                      </td>

                      {/* Vị trí công việc */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {w.jobTitle}
                      </td>

                      {/* Khu vực phụ trách */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                          <Building className="h-3 w-3 text-slate-500" />
                          <span>{w.department}</span>
                        </span>
                      </td>

                      {/* Tiền lương (RBAC) */}
                      {canViewSalary && (
                        <>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(w.totalMonthlySalary)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-amber-700">
                            {w.advancePaid > 0 ? formatCurrency(w.advancePaid) : <span className="text-slate-400">0 đ</span>}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-black text-emerald-700">
                            {formatCurrency(w.remainingSalary)}
                          </td>
                        </>
                      )}

                      {/* Hành động */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canViewSalary && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenSalaryAction(w, 'ADVANCE')}
                                className="px-2 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-[11px] transition-colors"
                                title="Tạm ứng nhanh"
                              >
                                Tạm ứng
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenSalaryAction(w, 'PAY_FULL')}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-colors"
                                title="Chốt và thanh toán dứt điểm lương"
                              >
                                Chốt trả lương
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenWorkerModal(w)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Sửa hồ sơ"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NỘI DUNG TAB 2: CÔNG THỜI VỤ & KHOÁN VIỆC THEO LỨA NUÔI */}
      {/* ========================================================================= */}
      {activeTab === 'SEASONAL_TASKS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Lọc theo chuồng & lứa nuôi:</span>
              <select
                value={taskBarnFilter}
                onChange={(e) => setTaskBarnFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Tất Cả Chuồng & Lứa Nuôi</option>
                {MOCK_BARNS_AND_BATCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.barnName} - {b.batchName}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={handleOpenTaskModal}
              className="font-bold shadow-sm"
            >
              + Ghi Nhận Công Thời Vụ / Khoán Việc
            </Button>
          </div>

          {/* Bảng công thời vụ */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Ngày Làm</th>
                    <th className="py-3 px-4">Nội Dung Công Việc</th>
                    <th className="py-3 px-4">Người / Tổ Thực Hiện</th>
                    <th className="py-3 px-4">Chuồng & Lứa Chịu Chi Phí</th>
                    <th className="py-3 px-3">Khối Lượng / Cách Tính</th>
                    {canViewSalary && <th className="py-3 px-3 text-right">Tổng Tiền Công</th>}
                    <th className="py-3 px-4 text-center">Thanh Toán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                        {formatDate(task.workDate)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {task.taskName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium">
                        {task.workerOrTeam}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-800 block">
                          {task.barnName}
                        </span>
                        <span className="text-[11px] text-slate-500">{task.batchName}</span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-700">
                        {task.workload}
                      </td>
                      {canViewSalary && (
                        <td className="py-3.5 px-3 text-right font-mono font-black text-slate-900">
                          {formatCurrency(task.totalWage)}
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-center">
                        {task.paymentStatus === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Đã trả tiền</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <Clock className="h-3 w-3" />
                            <span>Chưa trả</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NỘI DUNG TAB 3: LỊCH SỬ TẠM ỨNG & CHI TRẢ LƯƠNG (PAYROLL HISTORY) */}
      {/* ========================================================================= */}
      {activeTab === 'PAYROLL_HISTORY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              Đối soát toàn bộ chứng từ tạm ứng & chi trả lương liên thông trực tiếp với Sổ Quỹ
            </span>
            <Button
              variant="outline"
              size="xs"
              icon={<ExternalLink className="h-3.5 w-3.5" />}
              onClick={() => (window.location.href = '/app/cashbook')}
            >
              Mở Sổ Quỹ Thu Chi
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Mã Phiếu Chi</th>
                  <th className="py-3 px-4">Ngày Chi</th>
                  <th className="py-3 px-4">Người Nhận Tiền</th>
                  <th className="py-3 px-3">Loại Chi</th>
                  {canViewSalary && <th className="py-3 px-3 text-right">Số Tiền</th>}
                  <th className="py-3 px-3">Nguồn Quỹ Chi</th>
                  <th className="py-3 px-4">Ghi Chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {item.refCashSlip}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {formatDate(item.date)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {item.workerName}
                    </td>
                    <td className="py-3.5 px-3">
                      {item.payoutType === 'ADVANCE' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Tạm ứng lương
                        </span>
                      ) : item.payoutType === 'SEASONAL' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          Trả công thời vụ
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Thanh toán lương tháng
                        </span>
                      )}
                    </td>
                    {canViewSalary && (
                      <td className="py-3.5 px-3 text-right font-mono font-black text-rose-600">
                        -{formatCurrency(item.amount)}
                      </td>
                    )}
                    <td className="py-3.5 px-3">
                      {item.fundSource === 'BANK' ? (
                        <span className="font-semibold text-slate-700">Ngân Hàng</span>
                      ) : (
                        <span className="font-semibold text-slate-700">Tiền Mặt</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate" title={item.notes}>
                      "{item.notes}"
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: THÊM / SỬA HỒ SƠ NHÂN CÔNG */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isWorkerModalOpen}
        onClose={() => setIsWorkerModalOpen(false)}
        title={editingWorker ? `Sửa Hồ Sơ: ${editingWorker.fullName}` : 'Thêm Nhân Công Mới'}
        size="md"
      >
        <form onSubmit={handleSaveWorker} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Họ và tên nhân công <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={workerForm.fullName}
                onChange={(e) => setWorkerForm({ ...workerForm, fullName: e.target.value })}
                placeholder="VD: Nguyễn Văn Nam"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Số điện thoại</label>
              <input
                type="text"
                value={workerForm.phone}
                onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                placeholder="09xx xxx xxx"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Số CCCD / CMND</label>
              <input
                type="text"
                value={workerForm.idCard}
                onChange={(e) => setWorkerForm({ ...workerForm, idCard: e.target.value })}
                placeholder="12 chữ số..."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Ngày bắt đầu làm việc</label>
              <input
                type="date"
                value={workerForm.startDate}
                onChange={(e) => setWorkerForm({ ...workerForm, startDate: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Vị trí / Công việc chính *</label>
              <input
                type="text"
                value={workerForm.jobTitle}
                onChange={(e) => setWorkerForm({ ...workerForm, jobTitle: e.target.value })}
                placeholder="VD: Chăm sóc chuồng gà, Vận hành kho..."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Khu vực phân công phụ trách</label>
              <select
                value={workerForm.department}
                onChange={(e) => setWorkerForm({ ...workerForm, department: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
              >
                <option value="Khu A - Gà thịt">Khu A - Gà thịt</option>
                <option value="Khu B - Heo thịt">Khu B - Heo thịt</option>
                <option value="Kho Cám Khu A & B">Kho Cám Khu A & B</option>
                <option value="Cổng Khử Trùng Số 1">Cổng Khử Trùng Số 1</option>
                <option value="Toàn trại">Toàn trại</option>
              </select>
            </div>
          </div>

          {/* Tùy chọn liên kết tài khoản app */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
              <input
                type="checkbox"
                checked={workerForm.hasAppAccount}
                onChange={(e) => setWorkerForm({ ...workerForm, hasAppAccount: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Người này có sử dụng điện thoại để đăng nhập app ghi nhật ký</span>
            </label>

            {workerForm.hasAppAccount && (
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Email / Tài khoản đăng nhập app:</label>
                <input
                  type="email"
                  value={workerForm.appEmail}
                  onChange={(e) => setWorkerForm({ ...workerForm, appEmail: e.target.value })}
                  placeholder="nhanvien@gmail.com"
                  className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
            )}
          </div>

          {/* Khung lương (Chỉ hiện cho Chủ trại & Kế toán kho) */}
          {canViewSalary && (
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
              <span className="font-bold text-emerald-900 block">Mức lương thỏa thuận hàng tháng</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-emerald-800 block mb-1">Lương cơ bản / tháng (VNĐ):</label>
                  <input
                    type="number"
                    min="0"
                    value={workerForm.baseSalary}
                    onChange={(e) => setWorkerForm({ ...workerForm, baseSalary: Number(e.target.value) || 0 })}
                    className="w-full p-1.5 font-mono font-bold bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-emerald-800 block mb-1">Phụ cấp cố định (ăn ở, độc hại):</label>
                  <input
                    type="number"
                    min="0"
                    value={workerForm.allowance}
                    onChange={(e) => setWorkerForm({ ...workerForm, allowance: Number(e.target.value) || 0 })}
                    className="w-full p-1.5 font-mono font-bold bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsWorkerModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              {editingWorker ? 'Lưu Thay Đổi' : 'Thêm Nhân Công'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: GHI NHẬN CÔNG THỜI VỤ / KHOÁN VIỆC THEO LỨA */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Ghi Nhận Công Thời Vụ / Khoán Việc Theo Lứa Nuôi"
        size="md"
      >
        <form onSubmit={handleSaveTask} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Ngày thực hiện *</label>
              <input
                type="date"
                value={taskForm.workDate}
                onChange={(e) => setTaskForm({ ...taskForm, workDate: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Tên người / Đội nhận khoán *</label>
              <input
                type="text"
                value={taskForm.workerOrTeam}
                onChange={(e) => setTaskForm({ ...taskForm, workerOrTeam: e.target.value })}
                placeholder="VD: Đội bốc vác Long Khánh (4 người)"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Nội dung công việc *</label>
            <input
              type="text"
              value={taskForm.taskName}
              onChange={(e) => setTaskForm({ ...taskForm, taskName: e.target.value })}
              placeholder="VD: Bốc vác cám, bắt gà xuất bán, dọn phân khử trùng..."
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Chuồng & Lứa nuôi chịu chi phí <span className="text-rose-500">*</span>
            </label>
            <select
              value={taskForm.barnId}
              onChange={(e) => setTaskForm({ ...taskForm, barnId: Number(e.target.value) })}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
            >
              {MOCK_BARNS_AND_BATCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.barnName} - {b.batchName}
                </option>
              ))}
            </select>
          </div>

          {/* Cách tính tiền */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <span className="font-bold text-slate-800 block">Cách tính tiền công khoán:</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="calcType"
                  checked={taskForm.calcType === 'DAILY'}
                  onChange={() => setTaskForm({ ...taskForm, calcType: 'DAILY' })}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>Theo công nhật (Số người x Số ngày)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="calcType"
                  checked={taskForm.calcType === 'PIECEWORK'}
                  onChange={() => setTaskForm({ ...taskForm, calcType: 'PIECEWORK' })}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>Theo sản lượng khoán (Số con / Số bao)</span>
              </label>
            </div>

            {taskForm.calcType === 'DAILY' ? (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Số người:</label>
                  <input
                    type="number"
                    min="1"
                    value={taskForm.peopleCount}
                    onChange={(e) => setTaskForm({ ...taskForm, peopleCount: e.target.value })}
                    className="w-full p-1.5 text-center bg-white border border-slate-300 rounded text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Số ngày:</label>
                  <input
                    type="number"
                    min="1"
                    value={taskForm.daysCount}
                    onChange={(e) => setTaskForm({ ...taskForm, daysCount: e.target.value })}
                    className="w-full p-1.5 text-center bg-white border border-slate-300 rounded text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Đơn giá / ngày:</label>
                  <input
                    type="number"
                    min="0"
                    value={taskForm.dailyRate}
                    onChange={(e) => setTaskForm({ ...taskForm, dailyRate: e.target.value })}
                    className="w-full p-1.5 text-right font-mono font-bold bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Khối lượng (Con/Bao/Kg):</label>
                  <input
                    type="number"
                    min="1"
                    value={taskForm.workloadAmount}
                    onChange={(e) => setTaskForm({ ...taskForm, workloadAmount: e.target.value })}
                    className="w-full p-1.5 text-center bg-white border border-slate-300 rounded text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Đơn giá / đơn vị (VNĐ):</label>
                  <input
                    type="number"
                    min="0"
                    value={taskForm.pieceworkRate}
                    onChange={(e) => setTaskForm({ ...taskForm, pieceworkRate: e.target.value })}
                    className="w-full p-1.5 text-right font-mono font-bold bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tùy chọn chi trả ngay */}
          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-900">
              <input
                type="checkbox"
                checked={taskForm.payNow}
                onChange={(e) => setTaskForm({ ...taskForm, payNow: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Thanh toán ngay và sinh Phiếu Chi vào Sổ Quỹ</span>
            </label>

            {taskForm.payNow && (
              <select
                value={taskForm.fundSource}
                onChange={(e) => setTaskForm({ ...taskForm, fundSource: e.target.value })}
                className="py-1 px-2 bg-white border border-slate-300 rounded text-xs font-semibold"
              >
                <option value="CASH">Tiền mặt tại trại</option>
                <option value="BANK">Chuyển khoản Ngân Hàng</option>
              </select>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsTaskModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              Lưu Công Khoán
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: TẠM ỨNG HOẶC CHỐT TRẢ LƯƠNG THÁNG */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isSalaryActionModalOpen}
        onClose={() => setIsSalaryActionModalOpen(false)}
        title={salaryActionMode === 'ADVANCE' ? 'Tạm Ứng Tiền Lương' : 'Chốt & Chi Trả Lương Tháng'}
        size="md"
      >
        {selectedWorkerForSalary && (
          <div className="space-y-4 text-xs">
            {/* Header nhân viên */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-black text-slate-900 text-sm">{selectedWorkerForSalary.fullName}</div>
              <div className="text-[11px] text-slate-500">
                {selectedWorkerForSalary.jobTitle} • {selectedWorkerForSalary.department}
              </div>
            </div>

            {salaryActionMode === 'ADVANCE' ? (
              /* Giao diện Tạm ứng */
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Số tiền tạm ứng (VNĐ) *</label>
                  <input
                    type="number"
                    min="100000"
                    value={salaryActionForm.advanceAmount}
                    onChange={(e) => setSalaryActionForm({ ...salaryActionForm, advanceAmount: e.target.value })}
                    className="w-full p-2 font-mono font-black text-sm text-amber-800 bg-amber-50 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Nguồn quỹ chi trả *</label>
                  <select
                    value={salaryActionForm.fundSource}
                    onChange={(e) => setSalaryActionForm({ ...salaryActionForm, fundSource: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="CASH">Tiền mặt tại Quỹ Trại</option>
                    <option value="BANK">Tài khoản Ngân Hàng (Vietcombank)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Lý do / Ghi chú tạm ứng</label>
                  <input
                    type="text"
                    value={salaryActionForm.notes}
                    onChange={(e) => setSalaryActionForm({ ...salaryActionForm, notes: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            ) : (
              /* Giao diện Chốt trả lương dứt điểm */
              <div className="space-y-3">
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  <div className="p-2.5 flex justify-between bg-slate-50 font-medium">
                    <span>Lương cố định tháng:</span>
                    <span className="font-bold font-mono">{formatCurrency(selectedWorkerForSalary.totalMonthlySalary)}</span>
                  </div>
                  <div className="p-2.5 flex justify-between text-amber-800 font-medium">
                    <span>Đã tạm ứng trong kỳ:</span>
                    <span className="font-bold font-mono">-{formatCurrency(selectedWorkerForSalary.advancePaid)}</span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between">
                    <span className="font-medium text-slate-700">Thưởng / Phụ cấp thêm:</span>
                    <input
                      type="number"
                      min="0"
                      value={salaryActionForm.bonusAmount}
                      onChange={(e) => setSalaryActionForm({ ...salaryActionForm, bonusAmount: e.target.value })}
                      className="w-32 p-1 font-mono text-right border border-slate-300 rounded text-xs font-bold"
                    />
                  </div>
                  <div className="p-3 flex justify-between bg-emerald-50 text-emerald-950 font-black text-sm">
                    <span>SỐ TIỀN THỰC LĨNH CÒN LẠI:</span>
                    <span className="font-mono text-emerald-700">
                      {formatCurrency(
                        (selectedWorkerForSalary.remainingSalary || 0) + (Number(salaryActionForm.bonusAmount) || 0)
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Nguồn quỹ thanh toán lương *</label>
                  <select
                    value={salaryActionForm.fundSource}
                    onChange={(e) => setSalaryActionForm({ ...salaryActionForm, fundSource: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="BANK">Chuyển khoản Ngân Hàng (Vietcombank)</option>
                    <option value="CASH">Tiền mặt tại Quỹ Trại</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsSalaryActionModalOpen(false)}>
                Hủy
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleConfirmSalaryAction} className="font-bold">
                Xác Nhận Chi Trả & Ghi Sổ Quỹ
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
