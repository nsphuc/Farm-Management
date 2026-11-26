import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  ArrowLeftRight,
  Search,
  Filter,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  MapPin,
  Phone,
  User,
  Shield,
  Settings,
  Edit,
  ArrowRight,
  Lock,
  Unlock,
  Check,
  AlertCircle,
  ExternalLink,
  Sliders,
  Scale,
  Activity,
  Percent,
  Trash2,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { branchService } from '@/services/modules/branchService';

// Dữ liệu mẫu 3 chi nhánh thực tế FarmGo
export const INITIAL_BRANCHES = [
  {
    id: 1,
    code: 'CN-01',
    name: 'Chi nhánh 1: Trại Heo Hòa Bình',
    livestockType: 'LIVESTOCK_MEAT',
    livestockLabel: 'Gia súc',
    icon: '🐷',
    address: 'Xã Gia Kiệm, Huyện Thống Nhất, Tỉnh Đồng Nai',
    phone: '0912 888 999',
    managerName: 'Trần Văn Quản',
    managerPhone: '0933 111 222',
    isDefault: true,
    activeBarns: 6,
    totalBarns: 8,
    herdSize: 1200,
    herdUnit: 'con heo thịt',
    inventoryValue: 245000000,
    fcr: 2.35,
    mortalityRate: 1.8,
    revenue: 620000000,
    operatingCost: 460000000,
    netProfit: 160000000,
    isActive: true,
    staffIds: [1, 2, 4],
  },
  {
    id: 2,
    code: 'CN-02',
    name: 'Chi nhánh 2: Trại Gà Ba Vì',
    livestockType: 'POULTRY_MEAT',
    livestockLabel: 'Gia cầm',
    icon: '🐔',
    address: 'Xã Tản Lĩnh, Huyện Ba Vì, TP. Hà Nội',
    phone: '0988 555 777',
    managerName: 'Nguyễn Văn Nam',
    managerPhone: '0977 444 888',
    isDefault: false,
    activeBarns: 8,
    totalBarns: 10,
    herdSize: 24000,
    herdUnit: 'con gà thịt',
    inventoryValue: 185000000,
    fcr: 1.62,
    mortalityRate: 2.4,
    revenue: 430000000,
    operatingCost: 340000000,
    netProfit: 90000000,
    isActive: true,
    staffIds: [1, 3],
  },
  {
    id: 3,
    code: 'CN-03',
    name: 'Chi nhánh 3: Trại Cá Sông Đà',
    livestockType: 'AQUACULTURE',
    livestockLabel: 'Thủy sản',
    icon: '🐟',
    address: 'Vùng lòng hồ Thủy điện Hòa Bình, TP. Hòa Bình',
    phone: '0911 222 333',
    managerName: 'Lê Văn Bình',
    managerPhone: '0911 222 333',
    isDefault: false,
    activeBarns: 4,
    totalBarns: 6,
    herdSize: 15000,
    herdUnit: 'con cá lăng & chiên',
    inventoryValue: 110000000,
    fcr: 1.45,
    mortalityRate: 3.1,
    revenue: 200000000,
    operatingCost: 135000000,
    netProfit: 65000000,
    isActive: true,
    staffIds: [1, 4],
  },
];

export const MOCK_STAFF_USERS = [
  { id: 1, name: 'Nguyễn Văn Chủ (Chủ trại)', role: 'Chủ trang trại' },
  { id: 2, name: 'Trần Văn Quản', role: 'Trại trưởng Khu Heo' },
  { id: 3, name: 'Nguyễn Văn Nam', role: 'Trại trưởng Khu Gà' },
  { id: 4, name: 'Lê Văn Bình', role: 'Quản lý Trại Cá' },
  { id: 5, name: 'Lê Thị Kế Toán', role: 'Kế toán toàn chuỗi' },
];

export function BranchesPage() {
  const navigate = useNavigate();
  const { currentFarmId, setActiveBranchId } = useActiveFarmStore();
  const { fetchBranches: refreshHeaderBranches, setCurrentBranchId } = useActiveBranchStore();
  const { userInfo, isOwner, hasPermission } = useAuthStore();

  // Kiểm tra quyền tạo chi nhánh (chỉ dành cho Chủ trang trại)
  const roleCodes = (userInfo?.roles || []).map((r) => (typeof r === 'string' ? r : r?.code)).filter(Boolean);
  const canCreateBranch = isOwner?.() || hasPermission?.('branches.create') || hasPermission?.('branches.manage') || roleCodes.includes('ROLE_FARM_OWNER');

  // Danh sách chi nhánh & bộ lọc
  const [branches, setBranches] = useState(INITIAL_BRANCHES);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, LIVESTOCK_MEAT, POULTRY_MEAT, AQUACULTURE

  const loadBranches = async () => {
    try {
      const summary = await branchService.getBranchesSummary(currentFarmId);
      if (summary && Array.isArray(summary.branchComparison) && summary.branchComparison.length > 0) {
        setBranches(summary.branchComparison);
      }
    } catch (err) {
      console.warn('Could not load branch summary from API', err);
    }
  };

  useEffect(() => {
    loadBranches();
  }, [currentFarmId]);

  // Modals
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    phone: '',
    address: '',
    livestockType: 'POULTRY_MEAT',
    syncInventory: true,
    syncPartners: true,
    selectedStaffIds: [1],
  });

  // Modal Điều chuyển liên chi nhánh
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    sourceBranchId: 1,
    destBranchId: 2,
    transferType: 'ITEMS', // ITEMS (Cám/Thuốc) hoặc LIVESTOCK (Con giống)
    itemName: 'Cám hỗn hợp cao cấp De Heus (25kg/bao)',
    quantity: 100,
    unit: 'Bao',
    estimatedValue: 35000000,
    notes: 'Điều chuyển hỗ trợ đàn gà úm đợt mới về chuồng A2',
  });

  // =========================================================================
  // KHỐI 2: THỐNG KÊ HỢP NHẤT TOÀN CHUỖI (CONSOLIDATED KPI CARDS)
  // =========================================================================
  const consolidatedKpi = useMemo(() => {
    let totalActiveBarns = 0;
    let totalBarns = 0;
    let totalInventory = 0;
    let totalRevenue = 0;
    let totalOperatingCost = 0;
    let totalNetProfit = 0;

    branches.forEach((b) => {
      totalActiveBarns += b.activeBarns || 0;
      totalBarns += b.totalBarns || 0;
      totalInventory += b.inventoryValue || 0;
      totalRevenue += b.revenue || 0;
      totalOperatingCost += b.operatingCost || 0;
      totalNetProfit += b.netProfit || 0;
    });

    return {
      branchCount: branches.length,
      activeBarnsText: `${branches.length} Chi nhánh — ${totalActiveBarns} Chuồng/Ao đang nuôi`,
      totalInventory,
      totalRevenue,
      totalNetProfit,
    };
  }, [branches]);

  // Bộ lọc danh sách chi nhánh
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      if (typeFilter !== 'ALL' && b.livestockType !== typeFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          (b.address || '').toLowerCase().includes(q) ||
          (b.managerName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [branches, typeFilter, searchTerm]);

  // =========================================================================
  // ACTIONS: VÀO QUẢN LÝ TRẠI & CẤU HÌNH
  // =========================================================================
  const handleEnterBranch = (branch) => {
    setCurrentBranchId(branch.id);
    setActiveBranchId(branch.id);
    toast.success(`Đã chuyển ngữ cảnh sang "${branch.name}"!`);
    navigate(`/app/barns?branchId=${branch.id}`);
  };

  const handleOpenCreateModal = () => {
    setEditingBranch(null);
    const nextCode = `CN-0${branches.length + 1}`;
    setBranchForm({
      name: '',
      code: nextCode,
      phone: '',
      address: '',
      livestockType: 'POULTRY_MEAT',
      syncInventory: true,
      syncPartners: true,
      selectedStaffIds: [1],
    });
    setIsBranchModalOpen(true);
  };

  const handleOpenEditModal = (branch) => {
    setEditingBranch(branch);
    setBranchForm({
      name: branch.name,
      code: branch.code,
      phone: branch.phone || '',
      address: branch.address || '',
      livestockType: branch.livestockType || 'POULTRY_MEAT',
      syncInventory: true,
      syncPartners: true,
      selectedStaffIds: branch.staffIds || [1],
    });
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = async (e) => {
    e.preventDefault();
    if (!branchForm.name.trim()) {
      toast.error('Vui lòng nhập tên chi nhánh');
      return;
    }

    try {
      if (editingBranch) {
        await branchService.updateBranch(currentFarmId, editingBranch.id, {
          name: branchForm.name.trim(),
          code: branchForm.code.trim(),
          phone: branchForm.phone,
          address: branchForm.address,
          livestockType: branchForm.livestockType,
        });
        toast.success(`Đã cập nhật chi nhánh "${branchForm.name}" thành công!`);
      } else {
        await branchService.createBranch(currentFarmId, {
          name: branchForm.name.trim(),
          code: branchForm.code.trim(),
          phone: branchForm.phone,
          address: branchForm.address,
          livestockType: branchForm.livestockType,
          isDefault: false,
        });
        toast.success(`Đã tạo chi nhánh "${branchForm.name}" mới và tự động khởi tạo kho vật tư!`);
      }

      await loadBranches();
      if (typeof refreshHeaderBranches === 'function') {
        refreshHeaderBranches();
      }
      setIsBranchModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu chi nhánh');
    }
  };

  const handleSetDefault = async (branch) => {
    try {
      await branchService.setDefaultBranch(currentFarmId, branch.id);
      toast.success(`Đã đặt "${branch.name}" làm chi nhánh mặc định của trang trại!`);
      await loadBranches();
      if (typeof refreshHeaderBranches === 'function') {
        refreshHeaderBranches();
      }
    } catch (err) {
      toast.error('Lỗi khi đặt chi nhánh mặc định');
    }
  };

  const handleDeleteBranch = async (branch) => {
    if (branch.isDefault) {
      toast.error('Không thể xóa chi nhánh mặc định của trang trại!');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chi nhánh "${branch.name}" không?`)) {
      return;
    }
    try {
      await branchService.deleteBranch(currentFarmId, branch.id);
      toast.success(`Đã xóa chi nhánh "${branch.name}"!`);
      await loadBranches();
      if (typeof refreshHeaderBranches === 'function') {
        refreshHeaderBranches();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa chi nhánh');
    }
  };

  // =========================================================================
  // ACTIONS: ĐIỀU CHUYỂN LIÊN CHI NHÁNH
  // =========================================================================
  const handleOpenTransferModal = () => {
    setTransferForm({
      sourceBranchId: branches[0]?.id || 1,
      destBranchId: branches[1]?.id || 2,
      transferType: 'ITEMS',
      itemName: 'Cám hỗn hợp cao cấp De Heus (25kg/bao)',
      quantity: 100,
      unit: 'Bao',
      estimatedValue: 35000000,
      notes: 'Điều chuyển vật tư hỗ trợ sản xuất liên chi nhánh',
    });
    setIsTransferModalOpen(true);
  };

  const handleConfirmTransfer = (e) => {
    e.preventDefault();
    if (Number(transferForm.sourceBranchId) === Number(transferForm.destBranchId)) {
      toast.error('Chi nhánh xuất và chi nhánh nhận phải khác nhau!');
      return;
    }

    const sourceB = branches.find((b) => b.id === Number(transferForm.sourceBranchId));
    const destB = branches.find((b) => b.id === Number(transferForm.destBranchId));
    const slipCode = `DC-2026-${Math.floor(100 + Math.random() * 900)}`;

    toast.success(
      `Đã lập phiếu điều chuyển "${slipCode}": ${transferForm.quantity} ${transferForm.unit} từ "${sourceB?.name}" sang "${destB?.name}"!`
    );
    setIsTransferModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-emerald-600" />
            <span>Quản Lý Đa Chi Nhánh (Chuỗi Trang Trại)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mô hình chuỗi trang trại tích hợp: Quản lý độc lập theo từng chi nhánh, điều chuyển vật tư liên trại và tổng hợp tài chính hợp nhất.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 2: KHỐI THỐNG KÊ HỢP NHẤT TOÀN CHUỖI (CONSOLIDATED KPI CARDS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Quy mô hệ thống */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Quy Mô Hệ Thống Toàn Chuỗi
            </span>
            <div className="text-lg font-black text-slate-900 tracking-tight my-1">
              {consolidatedKpi.activeBarnsText}
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              <span>Gia súc, gia cầm và thủy sản lồng bè</span>
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        {/* Thẻ 2: Tổng giá trị tồn kho */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Tổng Giá Trị Tồn Kho Vật Tư
            </span>
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight my-1">
              {formatCurrency(consolidatedKpi.totalInventory)}
            </div>
            <p className="text-[11px] text-slate-400">
              Gồm cám thức ăn, thuốc thú y và vắc-xin tại {consolidatedKpi.branchCount} chi nhánh
            </p>
          </div>
          <div className="p-3 bg-sky-50 text-sky-700 rounded-xl">
            <Package className="h-6 w-6" />
          </div>
        </div>

        {/* Thẻ 3: Doanh thu hợp nhất */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Doanh Thu Hợp Nhất Kỳ Này
            </span>
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight my-1">
              {formatCurrency(consolidatedKpi.totalRevenue)}
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span>Xuất bán thịt heo, gà và cá thương phẩm</span>
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Thẻ 4: Lợi nhuận ròng */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between bg-emerald-50/20">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
              Lợi Nhuận Ròng Hợp Nhất
            </span>
            <div className="text-xl font-black text-emerald-700 font-mono tracking-tight my-1">
              +{formatCurrency(consolidatedKpi.totalNetProfit)}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium">
              Sau khi khấu trừ chi phí cám, con giống & nhân sự
            </p>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 3: DANH SÁCH CHI NHÁNH & SO SÁNH HIỆU SUẤT */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Toolbar lọc & Thêm mới */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên trại, mã số, địa chỉ..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'LIVESTOCK_MEAT', label: 'Gia súc 🐷' },
                { id: 'POULTRY_MEAT', label: 'Gia cầm 🐔' },
                { id: 'AQUACULTURE', label: 'Thủy sản 🐟' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTypeFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    typeFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<ArrowLeftRight className="h-4 w-4 text-emerald-600" />}
              onClick={handleOpenTransferModal}
              className="font-bold text-slate-700 hover:text-emerald-700 hover:border-emerald-300"
            >
              Điều chuyển liên chi nhánh
            </Button>

            {canCreateBranch && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={handleOpenCreateModal}
                className="font-bold shadow-sm whitespace-nowrap"
              >
                + Thêm chi nhánh mới
              </Button>
            )}
          </div>
        </div>

        {/* Lưới thẻ Chi nhánh (Branch Cards Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                branch.isDefault ? 'border-emerald-300 ring-2 ring-emerald-500/10' : 'border-slate-200'
              }`}
            >
              <div className="p-5 space-y-4">
                {/* Header Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl shadow-2xs">
                      {branch.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {branch.code}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          [{branch.livestockLabel}]
                        </span>
                        {branch.isDefault && (
                          <span className="text-[10px] font-bold text-white bg-emerald-600 px-2 py-0.5 rounded-full shadow-2xs">
                            Chi nhánh mặc định
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-slate-900 text-sm mt-1">{branch.name}</h3>
                    </div>
                  </div>
                </div>

                {/* Địa chỉ & Người phụ trách */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] line-clamp-1">{branch.address}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="flex items-center gap-1 text-slate-500">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      Trại trưởng: <strong className="text-slate-800">{branch.managerName}</strong>
                    </span>
                    <span className="font-mono text-slate-500">{branch.managerPhone}</span>
                  </div>
                </div>

                {/* Các chỉ số tóm tắt tại trại */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      Chuồng Đang Hoạt Động
                    </span>
                    <span className="font-black text-slate-900 text-sm mt-0.5 block">
                      {branch.activeBarns} / {branch.totalBarns} chuồng
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      Tổng Sĩ Số Đàn
                    </span>
                    <span className="font-black text-emerald-700 text-sm mt-0.5 block">
                      {formatNumber(branch.herdSize)} {branch.herdUnit}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 col-span-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">Giá trị tồn kho tại trại:</span>
                    <span className="font-mono font-black text-slate-900">
                      {formatCurrency(branch.inventoryValue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer action buttons */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleEnterBranch(branch)}
                  className="font-bold flex items-center gap-1.5 flex-1 justify-center text-xs shadow-xs"
                >
                  <span>Vào quản lý trại</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditModal(branch)}
                  className="text-slate-700 hover:text-emerald-700 hover:border-emerald-300 text-xs px-2.5 font-semibold"
                  title="Cấu hình & Phân nhân sự"
                >
                  Cấu hình / Phân nhân sự
                </Button>

                <button
                  type="button"
                  onClick={() => handleOpenEditModal(branch)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  title="Chỉnh sửa thông tin"
                >
                  <Edit className="h-4 w-4" />
                </button>

                {!branch.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(branch)}
                    className="p-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors"
                    title="Đặt làm chi nhánh mặc định"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )}

                {!branch.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleDeleteBranch(branch)}
                    className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                    title="Xóa chi nhánh"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bảng So sánh Hiệu suất Đa chi nhánh */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs mt-6">
          <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Scale className="h-4 w-4 text-emerald-600" />
                <span>Bảng So Sánh Hiệu Suất Đa Chi Nhánh</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Đối chiếu các chỉ số kỹ thuật chăn nuôi (FCR, hao hụt) và kết quả tài chính giữa các đơn vị trực thuộc.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tên Chi Nhánh</th>
                  <th className="py-3 px-3">Loại Vật Nuôi</th>
                  <th className="py-3 px-3 text-center">Hệ Số FCR Trung Bình</th>
                  <th className="py-3 px-3 text-center">Tỷ Lệ Hao Hụt (%)</th>
                  <th className="py-3 px-3 text-right">Doanh Thu Kỳ Này</th>
                  <th className="py-3 px-3 text-right">Chi Phí Vận Hành</th>
                  <th className="py-3 px-4 text-right">Lãi/Lỗ Ròng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span>{b.icon}</span>
                      <span>{b.name}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                        [{b.livestockLabel}]
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-800">
                      {b.fcr.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-semibold text-rose-600">
                      {b.mortalityRate}%
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(b.revenue)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                      {formatCurrency(b.operatingCost)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700">
                      +{formatCurrency(b.netProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-black border-t-2 border-slate-200 text-slate-900">
                <tr>
                  <td className="py-3 px-4 uppercase tracking-wider" colSpan={4}>
                    Tổng Hợp Nhất Toàn Chuỗi Trang Trại
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {formatCurrency(consolidatedKpi.totalRevenue)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {formatCurrency(consolidatedKpi.totalRevenue - consolidatedKpi.totalNetProfit)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700 text-sm">
                    +{formatCurrency(consolidatedKpi.totalNetProfit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: THÊM / CẤU HÌNH CHI NHÁNH MỚI */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        title={editingBranch ? `Cấu Hình Chi Nhánh: ${editingBranch.name}` : 'Thêm Chi Nhánh Mới Vào Hệ Thống'}
        size="md"
      >
        <form onSubmit={handleSaveBranch} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <FormField label="Tên chi nhánh trang trại *" required>
                <Input
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  placeholder="VD: Trại Gà Đồi Lạc Thủy"
                  required
                />
              </FormField>
            </div>

            <div>
              <FormField label="Mã chi nhánh *" required>
                <Input
                  value={branchForm.code}
                  onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                  placeholder="VD: CN-04"
                  required
                />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Số điện thoại liên hệ *" required>
              <Input
                type="tel"
                value={branchForm.phone}
                onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                placeholder="0988 123 456"
                required
              />
            </FormField>

            <FormField label="Loại hình & Lộ trình nuôi độc lập *" required>
              <Select
                value={branchForm.livestockType}
                onChange={(e) => setBranchForm({ ...branchForm, livestockType: e.target.value })}
              >
                <option value="LIVESTOCK_MEAT">Gia súc nuôi thịt (Heo, Bò thịt)</option>
                <option value="POULTRY_MEAT">Gia cầm nuôi thịt (Gà, Vịt, Ngan)</option>
                <option value="AQUACULTURE">Thủy sản (Cá, Tôm lồng bè)</option>
              </Select>
            </FormField>
          </div>

          <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
            ℹ️ <strong>Lưu ý:</strong> Giao diện và biểu mẫu nhật ký của chi nhánh này sẽ tự động điều chỉnh linh hoạt theo loại hình vật nuôi được chọn.
          </p>

          <FormField label="Địa chỉ cụ thể trang trại *" required>
            <Input
              value={branchForm.address}
              onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
              placeholder="VD: Xã Lạc Thủy, Tỉnh Hòa Bình"
              required
            />
          </FormField>

          {/* Cấu hình đồng bộ dữ liệu */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <span className="font-bold text-slate-800 block text-xs">Cấu hình đồng bộ dữ liệu:</span>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={branchForm.syncInventory}
                onChange={(e) => setBranchForm({ ...branchForm, syncInventory: e.target.checked })}
                className="h-4 w-4 text-emerald-600 rounded border-slate-300"
              />
              <span>Dùng chung danh mục Hàng hóa (Cám, Thuốc) từ Cơ sở chính</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={branchForm.syncPartners}
                onChange={(e) => setBranchForm({ ...branchForm, syncPartners: e.target.checked })}
                className="h-4 w-4 text-emerald-600 rounded border-slate-300"
              />
              <span>Dùng chung danh bạ Đối tác (NCC, Khách hàng) từ Cơ sở chính</span>
            </label>
          </div>

          {/* Gán nhân sự điều hành chi nhánh */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block text-xs">
              Gán nhân sự điều hành chi nhánh:
            </span>
            <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto">
              {MOCK_STAFF_USERS.map((staff) => (
                <label
                  key={staff.id}
                  className="py-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-100 px-1 rounded"
                >
                  <div>
                    <span className="font-semibold text-slate-800 block">{staff.name}</span>
                    <span className="text-[10px] text-slate-400">{staff.role}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={branchForm.selectedStaffIds.includes(staff.id)}
                    onChange={() => {
                      const cur = branchForm.selectedStaffIds;
                      const updated = cur.includes(staff.id)
                        ? cur.filter((x) => x !== staff.id)
                        : [...cur, staff.id];
                      setBranchForm({ ...branchForm, selectedStaffIds: updated });
                    }}
                    className="h-4 w-4 text-emerald-600 rounded border-slate-300"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsBranchModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              {editingBranch ? 'Lưu Thay Đổi' : 'Tạo Chi Nhánh'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: PHIẾU ĐIỀU CHUYỂN VẬT TƯ / CON GIỐNG LIÊN CHI NHÁNH */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Lập Phiếu Điều Chuyển Liên Chi Nhánh"
        size="md"
      >
        <form onSubmit={handleConfirmTransfer} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
            <div>
              <label className="font-bold text-emerald-900 block mb-1">Chi nhánh xuất *</label>
              <select
                value={transferForm.sourceBranchId}
                onChange={(e) => setTransferForm({ ...transferForm, sourceBranchId: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} [{b.livestockLabel}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-emerald-900 block mb-1">Chi nhánh nhận *</label>
              <select
                value={transferForm.destBranchId}
                onChange={(e) => setTransferForm({ ...transferForm, destBranchId: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} [{b.livestockLabel}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-slate-800 block text-xs">Loại điều chuyển:</span>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                <input
                  type="radio"
                  name="transferType"
                  checked={transferForm.transferType === 'ITEMS'}
                  onChange={() => setTransferForm({ ...transferForm, transferType: 'ITEMS', unit: 'Bao' })}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>Vật tư (Cám thức ăn / Thuốc thú y)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                <input
                  type="radio"
                  name="transferType"
                  checked={transferForm.transferType === 'LIVESTOCK'}
                  onChange={() => setTransferForm({ ...transferForm, transferType: 'LIVESTOCK', unit: 'Con' })}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>Con giống (Heo giống / Gà giống)</span>
              </label>
            </div>
          </div>

          <FormField label="Tên mặt hàng / Loại con giống điều chuyển *" required>
            <Input
              value={transferForm.itemName}
              onChange={(e) => setTransferForm({ ...transferForm, itemName: e.target.value })}
              placeholder="VD: Cám hỗn hợp De Heus hoặc Heo giống F1 20kg"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <FormField label="Số lượng *" required>
                <Input
                  type="number"
                  min="1"
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) || 0 })}
                  required
                />
              </FormField>
            </div>

            <div>
              <FormField label="Đơn vị tính *" required>
                <Input
                  value={transferForm.unit}
                  onChange={(e) => setTransferForm({ ...transferForm, unit: e.target.value })}
                  placeholder="Bao / Chai / Con"
                  required
                />
              </FormField>
            </div>

            <div>
              <FormField label="Ước tính giá trị (VNĐ)">
                <Input
                  type="number"
                  min="0"
                  value={transferForm.estimatedValue}
                  onChange={(e) => setTransferForm({ ...transferForm, estimatedValue: Number(e.target.value) || 0 })}
                />
              </FormField>
            </div>
          </div>

          <FormField label="Ghi chú điều chuyển">
            <Input
              value={transferForm.notes}
              onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
              placeholder="Lý do điều chuyển, xe vận chuyển..."
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsTransferModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              Xác Nhận Điều Chuyển
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
