import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings,
  Shield,
  Building,
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Users,
  Layers,
  Sparkles,
  Zap,
  Trash2,
  Edit,
  MoreVertical,
  Check,
  ChevronDown,
  X,
  UserPlus,
  Lock,
  Phone,
  Mail,
  Warehouse,
  CheckSquare,
  AlertCircle,
  ExternalLink,
  Sliders,
  DollarSign,
  QrCode,
  ToggleLeft,
  ToggleRight,
  MapPin,
  FileText,
  BadgeAlert,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { rbacService } from '@/services/modules/rbacService';
import { enterpriseService } from '@/services/modules/enterpriseService';
import { farmSettingsService } from '@/services/modules/farmSettingsService';
import { settingsService } from '@/services/modules/settingsService';
import { addonsService } from '@/services/modules/addonsService';
import { barnBatchService } from '@/services/modules/barnBatchService';
import { authService } from '@/services/modules/authService';
import { toast } from '@/store/useToastStore';
import { formatCurrency } from '@/utils/formatters';

// 22 Module phân quyền chuẩn khớp 100% Ảnh 1
export const PERMISSION_MODULES_CONFIG = [
  { id: 'farm_manage', label: 'Quản lý trang trại', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'zone_area', label: 'Khu vực nuôi', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'batches', label: 'Lứa nuôi', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'harvest_type', label: 'Loại thu hoạch', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'labor', label: 'Nhân công', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'profile', label: 'Hồ sơ cá nhân', actions: ['Xem', 'Chỉnh sửa'] },
  { id: 'tag', label: 'Tag', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'goods', label: 'Hàng hoá', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'goods_type', label: 'Loại hàng hóa', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'uom', label: 'Đơn vị tính', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'brands', label: 'Nhãn hiệu', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'customers', label: 'Khách hàng', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'suppliers', label: 'Nhà cung cấp', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'purchase_invoices', label: 'Hóa đơn nhập', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'sales_invoices', label: 'Hóa đơn bán', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'feeding', label: 'Bữa ăn', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'environment', label: 'Môi trường', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'health_status', label: 'Tình trạng sức khỏe', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'egg_harvest', label: 'Thu hoạch trứng', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'tasks', label: 'Việc làm', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'cashflow_type', label: 'Loại thu chi', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
  { id: 'cashflow', label: 'Thu chi', actions: ['Xem', 'Thêm mới', 'Chỉnh sửa', 'Xóa'] },
];

export function GeneralSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { farms, activeFarmId } = useActiveFarmStore();
  const { branches, fetchBranches } = useActiveBranchStore();
  const { userInfo, isOwner } = useAuthStore();
  const currentFarmId = activeFarmId && activeFarmId !== 'ALL' ? Number(activeFarmId) : Number(farms[0]?.id || 1);

  // Tab routing: service-info, users, labor-roles, zone-roles, warehouse-roles, data-rules
  const activeTab = searchParams.get('tab') || 'service-info';
  const setActiveTab = (tabKey) => {
    setSearchParams({ tab: tabKey });
  };

  // =========================================================================
  // MỤC 1: THÔNG TIN DỊCH VỤ (HỒ SƠ TRANG TRẠI & GÓI CƯỚC VNPAY)
  // =========================================================================
  const [facilityInfo, setFacilityInfo] = useState({
    name: 'Trang trại Hòa Bình',
    businessType: 'Cá nhân kinh doanh', // Cá nhân kinh doanh, Hộ kinh doanh, Hợp tác xã, Doanh nghiệp
    phone: '0912 888 999',
    livestockType: 'Gia súc thịt (heo, bò) & Gia cầm thịt (gà, vịt)',
    farmingField: 'Nuôi thương phẩm lấy thịt công nghệ cao',
    address: 'Ấp 3, Xã Gia Kiệm, Huyện Thống Nhất, Tỉnh Đồng Nai',
    zoneCode: 'VN-75-TN-0482',
    logoUrl: '',
  });
  const [isSavingFacility, setIsSavingFacility] = useState(false);

  // Gói cước hiện tại & Add-ons
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    packageName: 'Gói Cá nhân Tiêu chuẩn',
    expiresAt: '2027-12-31',
    userLimit: 5,
    currentUserCount: 3,
    barnLimit: 8,
    currentBarnCount: 5,
  });

  const [addons, setAddons] = useState([
    {
      id: 'BRANCHES',
      title: 'Quản Lý Đa Chi Nhánh',
      desc: 'Quản lý chuỗi trại, luân chuyển vật tư và tổng hợp báo cáo tài chính.',
      price: 1200000,
      priceUnit: 'năm',
      icon: '🏢',
      isEnabled: true,
      badge: 'Chuỗi trại',
    },
    {
      id: 'PAYROLL',
      title: 'Bảng Lương & Chấm Công KPI',
      desc: 'Tính lương tháng tự động, tạm ứng, khoán theo lứa nuôi và khấu trừ.',
      price: 1000000,
      priceUnit: 'năm',
      icon: '💰',
      isEnabled: true,
      badge: 'Nhân sự',
    },
    {
      id: 'UNLIMITED_USERS',
      title: 'Mở Rộng Nhân Sự Không Giới Hạn',
      desc: 'Bỏ giới hạn số lượng tài khoản nhân sự kết nối trên ứng dụng.',
      price: 1500000,
      priceUnit: 'năm',
      icon: '👥',
      isEnabled: false,
      badge: 'Tài khoản',
    },
    {
      id: 'BREEDING',
      title: 'Gia Súc Sinh Sản & Thẻ Tai',
      desc: 'Theo dõi đàn nái đẻ, quản lý phối tinh và gắn thẻ tai RFID thông minh.',
      price: 1200000,
      priceUnit: 'năm',
      icon: '🏷️',
      isEnabled: false,
      badge: 'Nái giống',
    },
    {
      id: 'POULTRY_HATCHERY',
      title: 'Gia Cầm Đẻ Trứng & Ấp Nở',
      desc: 'Sản lượng nhặt trứng hằng ngày, tỉ lệ phôi và tỷ lệ ấp nở lò ấp.',
      price: 1200000,
      priceUnit: 'năm',
      icon: '🥚',
      isEnabled: false,
      badge: 'Gà đẻ trứng',
    },
    {
      id: 'FEED_MILL',
      title: 'Sản Xuất Phối Trộn Cám',
      desc: 'Xây dựng định mức BOM dinh dưỡng, lập kế hoạch và lệnh trộn cám nội bộ.',
      price: 1500000,
      priceUnit: 'năm',
      icon: '🏭',
      isEnabled: false,
      badge: 'Tự trộn cám',
    },
  ]);

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState(null);
  const [upgradePlanMonths, setUpgradePlanMonths] = useState(12);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // =========================================================================
  // MỤC 2: QUYỀN HẠN NGƯỜI DÙNG (THÀNH VIÊN & GHÉP VAI TRÒ)
  // =========================================================================
  const [userSearch, setUserSearch] = useState('');
  const [members, setMembers] = useState([
    {
      id: 1,
      userId: 2,
      fullName: 'Nguyễn Văn Chủ',
      phone: '0912 888 999',
      email: 'owner@gmail.com',
      avatar: '👑',
      isOwner: true,
      status: 'ACTIVE', // ACTIVE, PENDING
      zoneRole: 'Trại trưởng',
      warehouseRole: 'Kế toán kho',
      laborRole: 'Quản lý nhân công & Lương',
      barnScope: 'ALL', // ALL hoặc CUSTOM
      barnsText: 'Toàn bộ trại',
    },
    {
      id: 2,
      userId: 3,
      fullName: 'Trần Văn Quản',
      phone: '0933 111 222',
      email: 'quanly@gmail.com',
      avatar: '👨‍💼',
      isOwner: false,
      status: 'ACTIVE',
      zoneRole: 'Trại trưởng (Toàn quyền kỹ thuật)',
      warehouseRole: 'Không có',
      laborRole: 'Trại trưởng (Chỉ xem & chấm công)',
      barnScope: 'CUSTOM',
      barnsText: 'Chuồng A1, Chuồng A2',
    },
    {
      id: 3,
      userId: 6,
      fullName: 'Lê Thị Kế Toán',
      phone: '0944 555 666',
      email: 'ketoan@gmail.com',
      avatar: '👩‍💼',
      isOwner: false,
      status: 'ACTIVE',
      zoneRole: 'Không có',
      warehouseRole: 'Kế toán kho (Quản lý trọn gói)',
      laborRole: 'Quản lý nhân công & Lương',
      barnScope: 'ALL',
      barnsText: 'Toàn bộ trại (Chỉ xem)',
    },
    {
      id: 4,
      userId: 4,
      fullName: 'Nguyễn Văn Nam',
      phone: '0977 444 888',
      email: 'nhanvien1@gmail.com',
      avatar: '👨‍🌾',
      isOwner: false,
      status: 'ACTIVE',
      zoneRole: 'Công nhân chuồng',
      warehouseRole: 'Phụ kho',
      laborRole: 'Công nhân thường',
      barnScope: 'CUSTOM',
      barnsText: 'Chuồng A1, Chuồng A2, Chuồng B1',
    },
    {
      id: 5,
      userId: 8,
      fullName: 'Hoàng Văn Thú Y',
      phone: '0966 333 444',
      email: 'thuy@gmail.com',
      avatar: '👨‍⚕️',
      isOwner: false,
      status: 'PENDING',
      zoneRole: 'Kỹ thuật viên / Thú y',
      warehouseRole: 'Không có',
      laborRole: 'Không có',
      barnScope: 'ALL',
      barnsText: 'Toàn bộ trại',
    },
  ]);

  // Modal Mời nhân sự qua SĐT
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    phone: '',
    fullName: '',
    zoneRole: 'Công nhân chuồng',
    warehouseRole: 'Không có',
    laborRole: 'Công nhân thường',
  });

  // Modal Cấu hình Quyền hạn Người dùng (Ghép vai trò kiêm nhiệm & Data Scope)
  const [isAssignRolesModalOpen, setIsAssignRolesModalOpen] = useState(false);
  const [selectedMemberForRoles, setSelectedMemberForRoles] = useState(null);
  const [userRoleConfigForm, setUserRoleConfigForm] = useState({
    zoneRole: 'Công nhân chuồng',
    warehouseRole: 'Không có',
    laborRole: 'Công nhân thường',
    barnScopeType: 'ALL', // ALL | CUSTOM
    selectedBarnIds: [],
    branchId: '1',
  });
  const [realBarns, setRealBarns] = useState([]);

  // =========================================================================
  // MỤC 3: VAI TRÒ NHÂN CÔNG (DYNAMIC SCRUD MATRIX)
  // =========================================================================
  const [laborRoles, setLaborRoles] = useState([
    {
      id: 1,
      name: 'Quản lý nhân công & Lương đầy đủ',
      createdAt: '2026-01-10',
      isSystem: true,
      canViewSalary: true,
      matrix: {
        worker_profile: ['S', 'C', 'U', 'D'],
        attendance: ['S', 'C', 'U', 'D'],
        seasonal_tasks: ['S', 'C', 'U', 'D'],
        payroll_calc: ['S', 'C', 'U', 'D'],
        cashbook_reconcile: ['S', 'C', 'U', 'D'],
      },
    },
    {
      id: 2,
      name: 'Trại trưởng (Chỉ xem & chấm công - ẩn cột lương)',
      createdAt: '2026-01-12',
      isSystem: true,
      canViewSalary: false,
      matrix: {
        worker_profile: ['S'],
        attendance: ['S', 'C', 'U'],
        seasonal_tasks: ['S', 'C'],
        payroll_calc: [],
        cashbook_reconcile: [],
      },
    },
    {
      id: 3,
      name: 'Kế Toán',
      createdAt: '2026-01-15',
      isSystem: false,
      canViewSalary: true,
      matrix: {
        worker_profile: ['S', 'C', 'U'],
        attendance: ['S'],
        seasonal_tasks: ['S', 'C', 'U'],
        payroll_calc: ['S', 'C', 'U', 'D'],
        cashbook_reconcile: ['S', 'C', 'U', 'D'],
      },
    },
    {
      id: 4,
      name: 'Công Nhân Chuồng Trại',
      createdAt: '2026-01-10',
      isSystem: true,
      canViewSalary: false,
      matrix: {
        worker_profile: ['S'],
        attendance: ['S'],
        seasonal_tasks: [],
        payroll_calc: [],
        cashbook_reconcile: [],
      },
    },
  ]);
  const [selectedLaborRoleId, setSelectedLaborRoleId] = useState(1);
  const selectedLaborRole = useMemo(
    () => laborRoles.find((r) => r.id === selectedLaborRoleId) || laborRoles[0],
    [laborRoles, selectedLaborRoleId]
  );

  // Modal Tạo/Sửa vai trò nhân công
  const [isLaborRoleModalOpen, setIsLaborRoleModalOpen] = useState(false);
  const [editingLaborRole, setEditingLaborRole] = useState(null);
  const [laborRoleNameInput, setLaborRoleNameInput] = useState('');

  // =========================================================================
  // MỤC 4: VAI TRÒ KHU NUÔI (DYNAMIC SCRUD MATRIX & PHÂN QUYỀN CHUỒNG)
  // =========================================================================
  const [zoneRoles, setZoneRoles] = useState([
    {
      id: 1,
      name: 'Trại trưởng (Toàn quyền kỹ thuật)',
      createdAt: '2026-01-10',
      isSystem: true,
      matrix: {
        zones_batches: ['S', 'C', 'U', 'D'],
        daily_feeding: ['S', 'C', 'U', 'D'],
        daily_medication: ['S', 'C', 'U', 'D'],
        daily_loss_weight: ['S', 'C', 'U', 'D'],
        vaccine_protocols: ['S', 'C', 'U', 'D'],
      },
    },
    {
      id: 2,
      name: 'Kỹ thuật viên / Thú y',
      createdAt: '2026-01-12',
      isSystem: true,
      matrix: {
        zones_batches: ['S'],
        daily_feeding: ['S', 'C', 'U'],
        daily_medication: ['S', 'C', 'U', 'D'],
        daily_loss_weight: ['S', 'C', 'U'],
        vaccine_protocols: ['S', 'C', 'U'],
      },
    },
    {
      id: 3,
      name: 'Công nhân chuồng (Chỉ thêm nhật ký)',
      createdAt: '2026-01-15',
      isSystem: true,
      matrix: {
        zones_batches: ['S'],
        daily_feeding: ['S', 'C'],
        daily_medication: ['S', 'C'],
        daily_loss_weight: ['S', 'C'],
        vaccine_protocols: ['S'],
      },
    },
  ]);
  const [selectedZoneRoleId, setSelectedZoneRoleId] = useState(1);
  const selectedZoneRole = useMemo(
    () => zoneRoles.find((r) => r.id === selectedZoneRoleId) || zoneRoles[0],
    [zoneRoles, selectedZoneRoleId]
  );

  // Danh sách phân quyền quản lý lứa nuôi theo từng Chuồng (Ảnh 2)
  const [zoneBarnGroups, setZoneBarnGroups] = useState([
    {
      zoneName: 'Khu A',
      barns: [
        { id: 'A1', name: 'Nhà A1', staffIds: [2, 3, 4] },
        { id: 'A2', name: 'Nhà A2', staffIds: [2, 3, 4] },
        { id: 'A3', name: 'Nhà A3', staffIds: [2, 3] },
      ],
    },
    {
      zoneName: 'Khu B',
      barns: [
        { id: 'B1', name: 'Nhà B1', staffIds: [2, 4] },
        { id: 'B2', name: 'Nhà B2', staffIds: [2, 3] },
      ],
    },
  ]);
  const [isZoneStaffModalOpen, setIsZoneStaffModalOpen] = useState(false);
  const [editingBarn, setEditingBarn] = useState(null);
  const [selectedStaffIdsForBarn, setSelectedStaffIdsForBarn] = useState([]);

  // Modal Tạo/Sửa vai trò khu nuôi
  const [isZoneRoleModalOpen, setIsZoneRoleModalOpen] = useState(false);
  const [editingZoneRole, setEditingZoneRole] = useState(null);
  const [zoneRoleNameInput, setZoneRoleNameInput] = useState('');

  // =========================================================================
  // MỤC 5: VAI TRÒ KHO HÀNG (DYNAMIC SCRUD MATRIX & PHÂN QUYỀN KHO)
  // =========================================================================
  const [warehouseRoles, setWarehouseRoles] = useState([
    {
      id: 1,
      name: 'Kế toán kho (Quản lý trọn gói Kho, Mua bán, Sổ quỹ)',
      createdAt: '2026-01-10',
      isSystem: true,
      canViewCost: true,
      matrix: {
        inventory_items: ['S', 'C', 'U', 'D'],
        internal_transfers: ['S', 'C', 'U', 'D', 'A'],
        purchase_invoices: ['S', 'C', 'U', 'D'],
        sales_invoices: ['S', 'C', 'U', 'D'],
        cashbook: ['S', 'C', 'U', 'D'],
      },
    },
    {
      id: 2,
      name: 'Phụ kho (Chỉ nhập/xuất số lượng - ẩn giá tiền)',
      createdAt: '2026-01-12',
      isSystem: true,
      canViewCost: false,
      matrix: {
        inventory_items: ['S'],
        internal_transfers: ['S', 'C'],
        purchase_invoices: [],
        sales_invoices: [],
        cashbook: [],
      },
    },
    {
      id: 3,
      name: 'Thủ kho vật tư cám & thuốc',
      createdAt: '2026-01-15',
      isSystem: false,
      canViewCost: false,
      matrix: {
        inventory_items: ['S', 'C', 'U'],
        internal_transfers: ['S', 'C', 'U'],
        purchase_invoices: ['S'],
        sales_invoices: ['S'],
        cashbook: [],
      },
    },
  ]);
  const [selectedWarehouseRoleId, setSelectedWarehouseRoleId] = useState(1);
  const selectedWarehouseRole = useMemo(
    () => warehouseRoles.find((r) => r.id === selectedWarehouseRoleId) || warehouseRoles[0],
    [warehouseRoles, selectedWarehouseRoleId]
  );

  // Danh sách phân quyền quản lý kho hàng (Ảnh 3)
  const [warehouseItems, setWarehouseItems] = useState([
    { id: 'WH01', name: 'Kho cám Khu A', staffIds: [2, 3, 4] },
    { id: 'WH02', name: 'Kho Cám Khu B', staffIds: [2, 3] },
    { id: 'WH03', name: 'Kho thuốc', staffIds: [2, 3, 6] },
    { id: 'WH04', name: 'Kho vaxin', staffIds: [2, 3] },
    { id: 'WH05', name: 'Kho hóa chất', staffIds: [2, 3] },
    { id: 'WH06', name: 'Con giống', staffIds: [2, 3] },
    { id: 'WH07', name: 'Hàng thu hoạch', staffIds: [2, 3, 6] },
    { id: 'WH08', name: 'Nguyên liệu sản xuất', staffIds: [2, 3] },
  ]);
  const [isWarehouseStaffModalOpen, setIsWarehouseStaffModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [selectedStaffIdsForWarehouse, setSelectedStaffIdsForWarehouse] = useState([]);

  // Modal Tạo/Sửa vai trò kho hàng
  const [isWarehouseRoleModalOpen, setIsWarehouseRoleModalOpen] = useState(false);
  const [editingWarehouseRole, setEditingWarehouseRole] = useState(null);
  const [warehouseRoleNameInput, setWarehouseRoleNameInput] = useState('');

  // =========================================================================
  // MỤC 6: DỮ LIỆU & QUY TẮC HỆ THỐNG (3 SUB-TABS)
  // =========================================================================
  const [activeDataSubTab, setActiveDataSubTab] = useState('PARTNERS'); // PARTNERS | FINANCIAL_VIETQR | SYSTEM_FLAGS

  // Sub-tab 6.1: Đối tác (NCC & Khách hàng)
  const [partnerFilter, setPartnerFilter] = useState('ALL');
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partners, setPartners] = useState([
    {
      id: 1,
      name: 'Công ty Cổ phần Thức ăn Chăn nuôi C.P. Việt Nam',
      phone: '0251 3836 251',
      category: 'SUPPLIER', // SUPPLIER | CUSTOMER | BOTH
      categoryLabel: 'Nhà cung cấp',
      address: 'KCN Biên Hòa 2, Đồng Nai',
      debt: 120500000, // Phải trả
      status: 'ACTIVE',
    },
    {
      id: 2,
      name: 'Công ty Thuốc Thú y Trung ương Navetco',
      phone: '028 3855 0846',
      category: 'SUPPLIER',
      categoryLabel: 'Nhà cung cấp',
      address: 'Quận 5, TP. Hồ Chí Minh',
      debt: 18400000,
      status: 'ACTIVE',
    },
    {
      id: 3,
      name: 'Thương lái thu mua heo anh Ba Cần Thơ',
      phone: '0903 888 777',
      category: 'CUSTOMER',
      categoryLabel: 'Khách hàng',
      address: 'Cái Răng, Cần Thơ',
      debt: -45000000, // Khách nợ trại (Phải thu)
      status: 'ACTIVE',
    },
    {
      id: 4,
      name: 'Hợp tác xã Chăn nuôi & Con giống Gia Kiệm',
      phone: '0979 555 444',
      category: 'BOTH',
      categoryLabel: 'Cả hai (Mua giống & Bán thịt)',
      address: 'Gia Kiệm, Thống Nhất, Đồng Nai',
      debt: 0,
      status: 'ACTIVE',
    },
    {
      id: 5,
      name: 'Đại lý Cám & Thuốc Thú Y Hoàng Phát',
      phone: '0918 333 222',
      category: 'SUPPLIER',
      categoryLabel: 'Nhà cung cấp',
      address: 'Trảng Bom, Đồng Nai',
      debt: 35000000,
      status: 'ACTIVE',
    },
  ]);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    phone: '',
    category: 'SUPPLIER',
    address: '',
    taxOrId: '',
  });

  // Sub-tab 6.2: Tài chính & VietQR
  const [vietQrConfig, setVietQrConfig] = useState({
    bankName: 'Vietcombank - Ngân hàng Ngoại thương Việt Nam',
    bankBin: '970436',
    accountNumber: '0388889999',
    accountHolder: 'TRAN VAN HOA (TRANG TRAI HOA BINH)',
    qrTemplate: 'compact2',
  });
  const [cashflowReasons, setCashflowReasons] = useState([
    { id: 1, title: 'Tiền điện sinh hoạt & giàn lạnh', type: 'EXPENSE', isActive: true },
    { id: 2, title: 'Tiền nước giếng khoan & hóa chất xử lý', type: 'EXPENSE', isActive: true },
    { id: 3, title: 'Sửa chữa chuồng & thay quạt thông gió', type: 'EXPENSE', isActive: true },
    { id: 4, title: 'Xăng dầu xe vận chuyển cám & bắt heo', type: 'EXPENSE', isActive: true },
    { id: 5, title: 'Khấu hao chuồng trại & máy phát điện', type: 'EXPENSE', isActive: true },
    { id: 6, title: 'Bán phân chuồng & phụ phẩm chăn nuôi', type: 'INCOME', isActive: true },
    { id: 7, title: 'Thu đền bù hao hụt con giống từ trại giống', type: 'INCOME', isActive: true },
  ]);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [reasonForm, setReasonForm] = useState({ title: '', type: 'EXPENSE' });

  // Sub-tab 6.3: Quy tắc vận hành (System Flags)
  const [systemRules, setSystemRules] = useState({
    enableLotTracking: true, // Quản lý kho theo Lô & Hạn sử dụng (FEFO)
    feedOverWarning: true, // Cảnh báo khi cho ăn vượt định mức > 10%
    allowNegativeStock: false, // Cho phép xuất âm kho tạm thời
    lockDailyLogAfterSave: true, // Khóa công nhân tự sửa/xóa phiếu nhật ký sau khi lưu
  });

  // Danh sách vai trò hệ thống + vai trò tùy chỉnh (Custom Roles) dùng để gán cho thành viên
  const [availableFarmRoles, setAvailableFarmRoles] = useState([]);

  // =========================================================================
  // EFFECTS: TẢI DỮ LIỆU
  // =========================================================================
  const loadSettings = async () => {
    try {
      // 1. Hồ sơ cơ sở & Gói cước
      const serviceData = await settingsService.getServiceSettings(currentFarmId).catch(() => null);
      if (serviceData) {
        if (serviceData.farm) {
          setFacilityInfo((prev) => ({
            ...prev,
            name: serviceData.farm.name || prev.name,
            phone: serviceData.farm.phone || prev.phone,
            address: serviceData.farm.address || prev.address,
            businessType: serviceData.farm.businessType || prev.businessType,
            livestockType: serviceData.farm.livestockType || prev.livestockType,
            farmingField: serviceData.farm.farmingField || prev.farmingField,
            zoneCode: serviceData.farm.veterinaryCode || serviceData.farm.zoneCode || prev.zoneCode,
          }));
        }
        if (serviceData.subscription) {
          setSubscriptionInfo((prev) => ({
            ...prev,
            packageName: serviceData.subscription.packageName || prev.packageName,
            expiresAt: serviceData.subscription.expiresAt || prev.expiresAt,
            userLimit: serviceData.subscription.userLimit || prev.userLimit,
            currentUserCount: serviceData.subscription.currentUserCount || prev.currentUserCount,
            barnLimit: serviceData.subscription.barnLimit || prev.barnLimit,
            currentBarnCount: serviceData.subscription.currentBarnCount || prev.currentBarnCount,
          }));
        }
      }

      // 2. Add-ons (ưu tiên đồng bộ giá & trạng thái từ serviceData.addons + subscriptions/add-ons)
      const addonsData = await settingsService.getAddons(currentFarmId).catch(() => null);
      const serviceAddons = Array.isArray(serviceData?.addons) ? serviceData.addons : [];
      const subAddons = Array.isArray(addonsData) ? addonsData : [];
      if (serviceAddons.length > 0 || subAddons.length > 0) {
        setAddons((prev) =>
          prev.map((ad) => {
            const adIdUpper = String(ad.id || '').toUpperCase();
            const fromService = serviceAddons.find(
              (a) => String(a.addonCode || a.code || a.id || '').toUpperCase() === adIdUpper
            );
            const fromSub = subAddons.find(
              (a) => String(a.addonCode || a.code || a.id || '').toUpperCase() === adIdUpper
            );
            if (fromService || fromSub) {
              const isEnabled =
                fromSub?.status === 'ACTIVE' ||
                Boolean(fromSub?.isEnabled) ||
                fromService?.status === 'ACTIVE' ||
                Boolean(fromService?.isEnabled);
              const yearly = Number(fromService?.yearlyPrice || fromService?.price1Year || ad.price);
              const halfYear = Number(
                fromService?.halfYearPrice || fromService?.price6Months || Math.round(yearly * 0.55)
              );
              return {
                ...ad,
                title: fromService?.name || ad.title,
                desc: fromService?.description || ad.desc,
                price: yearly,
                price6Months: halfYear,
                isEnabled,
                expiresAt: fromSub?.expiresAt || fromService?.expiresAt || ad.expiresAt,
              };
            }
            return ad;
          })
        );
      }

      // 3. Members
      const membersData = await settingsService.getMembers(currentFarmId).catch(() => null);
      if (Array.isArray(membersData) && membersData.length > 0) {
        setMembers(membersData);
      }

      // 4. Roles (bao gồm cả Vai trò tùy chỉnh từ Add-on Mở rộng vai trò)
      const [rolesData, customRolesList] = await Promise.all([
        settingsService.getRoles(currentFarmId).catch(() => null),
        addonsService.getCustomRoles({ farmId: currentFarmId }).catch(() => null),
      ]);
      if (Array.isArray(customRolesList) && customRolesList.length > 0) {
        setAvailableFarmRoles(customRolesList);
      } else {
        const fallbackRoles = await rbacService.getRoles?.().catch(() => []);
        if (Array.isArray(fallbackRoles) && fallbackRoles.length > 0) {
          setAvailableFarmRoles(fallbackRoles);
        }
      }
      if (rolesData) {
        if (Array.isArray(rolesData.laborRoles) && rolesData.laborRoles.length > 0) {
          setLaborRoles(rolesData.laborRoles);
        }
        if (Array.isArray(rolesData.zoneRoles) && rolesData.zoneRoles.length > 0) {
          setZoneRoles(rolesData.zoneRoles);
        }
        if (Array.isArray(rolesData.warehouseRoles) && rolesData.warehouseRoles.length > 0) {
          setWarehouseRoles(rolesData.warehouseRoles);
        }
      }

      // 5. Partners
      const partnersData = await settingsService.getPartners().catch(() => null);
      if (partnersData && (Array.isArray(partnersData.content) || Array.isArray(partnersData))) {
        const list = Array.isArray(partnersData.content) ? partnersData.content : partnersData;
        setPartners(list);
      }

      // 6. Data rules
      const rules = await settingsService.getDataRules(currentFarmId).catch(() => null);
      if (rules) {
        setSystemRules((prev) => ({
          ...prev,
          enableLotTracking: rules.enableLotTracking ?? prev.enableLotTracking,
          feedOverWarning: rules.autoDeductStockOnDailyLog ?? prev.feedOverWarning,
        }));
      }

      // 7. VietQR Financial settings & Danh sách chuồng thật cho Data Scope
      const [fin, barnsRes] = await Promise.all([
        settingsService.getFinancialSettings(currentFarmId).catch(() => null),
        barnBatchService.getBarns({ farmId: currentFarmId }).catch(() => []),
      ]);
      if (fin) {
        setVietQrConfig((prev) => ({
          ...prev,
          bankBin: fin.bankBin || prev.bankBin,
          bankName: fin.bankName || prev.bankName,
          accountNumber: fin.bankAccountNo || prev.accountNumber,
          accountHolder: fin.bankAccountName || fin.bankAccountHolder || prev.accountHolder,
        }));
      }
      if (Array.isArray(barnsRes)) {
        setRealBarns(barnsRes.map((b) => ({
          id: Number(b.id),
          label: b.zoneName ? `${b.zoneName} - ${b.name}` : b.name,
        })));
      }
    } catch (err) {
      console.error('Error loading farm settings:', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [currentFarmId]);

  // VNPAY Return detection & callback handling
  useEffect(() => {
    const vnpResponseCode = searchParams.get('vnp_ResponseCode');
    const vnpTxnRef = searchParams.get('vnp_TxnRef');
    if (vnpResponseCode) {
      if (vnpResponseCode === '00') {
        toast.success(`🎉 Thanh toán VNPAY thành công cho giao dịch ${vnpTxnRef || ''}! Dịch vụ mở rộng đã được kích hoạt.`);
        authService.getMe().catch(() => null);
        loadSettings();
      } else {
        toast.error(`Thanh toán VNPAY không thành công hoặc đã bị hủy (Mã lỗi: ${vnpResponseCode}).`);
      }
      setSearchParams({ tab: activeTab });
    }
  }, [searchParams]);

  // =========================================================================
  // HANDLERS: MỤC 1 (THÔNG TIN DỊCH VỤ)
  // =========================================================================
  const handleSaveFacility = async (e) => {
    e.preventDefault();
    try {
      setIsSavingFacility(true);
      await settingsService.updateServiceSettings(currentFarmId, {
        name: facilityInfo.name,
        businessType: facilityInfo.businessType,
        phone: facilityInfo.phone,
        address: facilityInfo.address,
        veterinaryCode: facilityInfo.zoneCode,
      });
      toast.success('Đã lưu thông tin cơ sở chăn nuôi thành công!');
    } catch (err) {
      toast.error('Không thể lưu thông tin cơ sở');
    } finally {
      setIsSavingFacility(false);
    }
  };

  const handleToggleAddon = (id) => {
    const addon = addons.find((a) => a.id === id);
    if (!addon) return;
    if (addon.isEnabled) {
      toast.info(`Dịch vụ "${addon.title}" đang kích hoạt đến ${addon.expiresAt || 'hết hạn'}.`);
    } else {
      handleOpenUpgradeModal(addon);
    }
  };

  const handleOpenUpgradeModal = (addon) => {
    setSelectedAddon(addon);
    setUpgradePlanMonths(12);
    setIsUpgradeModalOpen(true);
  };

  const handleCheckoutVnPay = async () => {
    if (!selectedAddon) return;
    try {
      setIsProcessingCheckout(true);
      const res = await settingsService.checkoutAddon(currentFarmId, {
        addonCode: selectedAddon.id,
        packagePlan: upgradePlanMonths === 12 ? 'YEARLY' : 'MONTHLY',
        returnUrl: window.location.origin + '/app/general-settings?tab=service-info',
      });
      if (res?.paymentUrl) {
        toast.info('Đang chuyển hướng sang cổng VNPAY Sandbox...');
        window.open(res.paymentUrl, '_blank');
        setIsUpgradeModalOpen(false);
        return;
      }
      toast.success(`Đã khởi tạo đơn hàng #${res?.orderCode || res?.orderNo || ''} thành công!`);
      setIsUpgradeModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi kết nối cổng thanh toán VNPAY');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleSimulateWebhook = async () => {
    if (!selectedAddon) return;
    try {
      setIsProcessingCheckout(true);
      const res = await settingsService.checkoutAddon(currentFarmId, {
        addonCode: selectedAddon.id,
        packagePlan: upgradePlanMonths === 12 ? 'YEARLY' : 'MONTHLY',
        returnUrl: window.location.origin + '/app/general-settings?tab=service-info',
      });
      const orderNo = res?.orderCode || res?.orderNo;
      if (orderNo) {
        await settingsService.simulateWebhook(orderNo);
        const [updatedUser, latestAddons] = await Promise.all([
          authService.getMe().catch(() => null),
          settingsService.getAddons(currentFarmId).catch(() => null),
        ]);
        const currentStoreUser = useAuthStore.getState().userInfo;
        const nextUser = updatedUser || currentStoreUser;
        if (nextUser) {
          const normalizedSubs = Array.isArray(latestAddons)
            ? latestAddons.map((a) => ({
                addonCode: a.addonCode,
                status: a.status,
                isEnabled: a.status === 'ACTIVE' || Boolean(a.isEnabled),
                expiresAt: a.expiresAt,
              }))
            : nextUser.farmAddOnSubscriptions;
          useAuthStore.getState().setUserInfo({
            ...nextUser,
            farmAddOnSubscriptions: normalizedSubs,
          });
        }
        toast.success(`⚡ [Demo Webhook] Đã kích hoạt tức thì dịch vụ "${selectedAddon.title}" ${upgradePlanMonths} tháng!`);
        setIsUpgradeModalOpen(false);
        await loadSettings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi kích hoạt qua Webhook');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // =========================================================================
  // HANDLERS: MỤC 2 (QUYỀN HẠN NGƯỜI DÙNG)
  // =========================================================================
  const filteredMembers = useMemo(() => {
    if (!userSearch.trim()) return members;
    const q = userSearch.toLowerCase();
    return members.filter(
      (m) =>
        (m.fullName || '').toLowerCase().includes(q) ||
        (m.phone || '').includes(q) ||
        (m.email && m.email.toLowerCase().includes(q))
    );
  }, [members, userSearch]);

  const handleOpenInviteModal = () => {
    setInviteForm({
      phone: '',
      fullName: '',
      zoneRole: 'Công nhân chuồng',
      warehouseRole: 'Không có',
      laborRole: 'Công nhân thường',
    });
    setIsInviteModalOpen(true);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }
    try {
      const matchingRole = laborRoles.find((r) => r.name === inviteForm.laborRole) ||
                           zoneRoles.find((r) => r.name === inviteForm.zoneRole) ||
                           { id: 3 };
      await settingsService.upsertMember(currentFarmId, {
        phone: inviteForm.phone.trim(),
        fullName: inviteForm.fullName.trim() || `Nhân sự (${inviteForm.phone})`,
        roleId: matchingRole.id,
        allBarns: true,
      });
      toast.success(`Đã thêm/mời nhân sự mới qua SĐT ${inviteForm.phone}!`);
      setIsInviteModalOpen(false);
      const updatedMembers = await settingsService.getMembers(currentFarmId).catch(() => null);
      if (Array.isArray(updatedMembers)) setMembers(updatedMembers);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi thêm nhân sự');
    }
  };

  const handleOpenAssignRolesModal = (member) => {
    if (!branches || branches.length < 2) {
      fetchBranches?.(currentFarmId);
    }
    setSelectedMemberForRoles(member);
    setUserRoleConfigForm({
      selectedRoleId: member.roleId ? String(member.roleId) : '',
      zoneRole: member.zoneRole || 'Công nhân chuồng',
      warehouseRole: member.warehouseRole || 'Không có',
      laborRole: member.laborRole || 'Công nhân thường',
      barnScopeType: member.allBarns === false || member.barnScope === 'CUSTOM' ? 'CUSTOM' : 'ALL',
      selectedBarnIds: Array.isArray(member.barnIds) ? member.barnIds.map(Number) : [],
      branchId: member.branchId ? String(member.branchId) : String(branches?.[0]?.id || 1),
    });
    setIsAssignRolesModalOpen(true);
  };

  const handleSaveUserRoleConfig = async () => {
    if (!selectedMemberForRoles) return;
    try {
      const matchingRole = laborRoles.find((r) => r.name === userRoleConfigForm.laborRole) ||
                           zoneRoles.find((r) => r.name === userRoleConfigForm.zoneRole) ||
                           { id: selectedMemberForRoles.roleId || 3 };
      const effectiveRoleId = userRoleConfigForm.selectedRoleId
        ? Number(userRoleConfigForm.selectedRoleId)
        : matchingRole.id;
      const isAll = userRoleConfigForm.barnScopeType === 'ALL';
      const numericBarnIds = !isAll
        ? (userRoleConfigForm.selectedBarnIds || []).map(Number).filter((id) => !Number.isNaN(id) && id > 0)
        : [];
      await settingsService.upsertMember(currentFarmId, {
        userId: selectedMemberForRoles.userId || selectedMemberForRoles.id,
        roleId: effectiveRoleId,
        allBarns: isAll,
        barnIds: numericBarnIds,
        branchId: selectedMemberForRoles.isOwner ? null : (userRoleConfigForm.branchId ? Number(userRoleConfigForm.branchId) : 1),
      });
      toast.success(`Đã cập nhật cấu hình phân quyền cho "${selectedMemberForRoles.fullName}"!`);
      setIsAssignRolesModalOpen(false);
      const updatedMembers = await settingsService.getMembers(currentFarmId).catch(() => null);
      if (Array.isArray(updatedMembers)) setMembers(updatedMembers);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật vai trò nhân sự');
    }
  };

  const handleRemoveMember = async (member) => {
    if (member.isOwner) {
      toast.error('Không thể gỡ bỏ tài khoản Chủ trang trại');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn gỡ nhân sự "${member.fullName}" khỏi trang trại?`)) return;
    try {
      await settingsService.deleteMember(currentFarmId, member.userId || member.id);
      toast.success(`Đã gỡ quyền truy cập của "${member.fullName}"`);
      const updatedMembers = await settingsService.getMembers(currentFarmId).catch(() => null);
      if (Array.isArray(updatedMembers)) setMembers(updatedMembers);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi gỡ nhân sự');
    }
  };

  // =========================================================================
  // HANDLERS: MỤC 3 (VAI TRÒ NHÂN CÔNG)
  // =========================================================================
  const handleToggleLaborPermission = (featureKey, action) => {
    setLaborRoles((prev) =>
      prev.map((r) => {
        if (r.id === selectedLaborRole.id) {
          const currentActions = r.matrix[featureKey] || [];
          const updated = currentActions.includes(action)
            ? currentActions.filter((a) => a !== action)
            : [...currentActions, action];
          return {
            ...r,
            matrix: { ...r.matrix, [featureKey]: updated },
          };
        }
        return r;
      })
    );
  };

  const handleToggleLaborSalaryView = () => {
    setLaborRoles((prev) =>
      prev.map((r) =>
        r.id === selectedLaborRole.id ? { ...r, canViewSalary: !r.canViewSalary } : r
      )
    );
    toast.info('Đã cập nhật quyền xem mức lương & tiền thưởng!');
  };

  const handleSaveLaborRole = (e) => {
    e.preventDefault();
    if (!laborRoleNameInput.trim()) {
      toast.error('Vui lòng nhập tên vai trò');
      return;
    }
    if (editingLaborRole) {
      setLaborRoles((prev) =>
        prev.map((r) => (r.id === editingLaborRole.id ? { ...r, name: laborRoleNameInput.trim() } : r))
      );
      toast.success(`Đã cập nhật vai trò "${laborRoleNameInput}"!`);
    } else {
      const newRole = {
        id: Date.now(),
        name: laborRoleNameInput.trim(),
        createdAt: new Date().toISOString().split('T')[0],
        isSystem: false,
        canViewSalary: false,
        matrix: {
          worker_profile: ['S'],
          attendance: ['S', 'C'],
          seasonal_tasks: ['S'],
          payroll_calc: [],
          cashbook_reconcile: [],
        },
      };
      setLaborRoles((prev) => [...prev, newRole]);
      setSelectedLaborRoleId(newRole.id);
      toast.success(`Đã tạo vai trò nhân công mới "${newRole.name}"!`);
    }
    setIsLaborRoleModalOpen(false);
  };

  // =========================================================================
  // HANDLERS: MỤC 4 (VAI TRÒ KHU NUÔI)
  // =========================================================================
  const handleToggleZonePermission = (featureKey, action) => {
    setZoneRoles((prev) =>
      prev.map((r) => {
        if (r.id === selectedZoneRole.id) {
          const currentActions = r.matrix[featureKey] || [];
          const updated = currentActions.includes(action)
            ? currentActions.filter((a) => a !== action)
            : [...currentActions, action];
          return {
            ...r,
            matrix: { ...r.matrix, [featureKey]: updated },
          };
        }
        return r;
      })
    );
  };

  const handleOpenEditBarnStaff = (barn) => {
    setEditingBarn(barn);
    const staff = barn.staffIds && barn.staffIds.includes(2) ? barn.staffIds : [2, ...(barn.staffIds || [])];
    setSelectedStaffIdsForBarn(staff);
    setIsZoneStaffModalOpen(true);
  };

  const handleSaveBarnStaff = () => {
    if (!editingBarn) return;
    const finalStaff = selectedStaffIdsForBarn.includes(2) ? selectedStaffIdsForBarn : [2, ...selectedStaffIdsForBarn];
    setZoneBarnGroups((prev) =>
      prev.map((zone) => ({
        ...zone,
        barns: zone.barns.map((b) => (b.id === editingBarn.id ? { ...b, staffIds: finalStaff } : b)),
      }))
    );
    toast.success(`Đã cập nhật nhân sự phụ trách "${editingBarn.name}"!`);
    setIsZoneStaffModalOpen(false);
  };

  // =========================================================================
  // HANDLERS: MỤC 5 (VAI TRÒ KHO HÀNG)
  // =========================================================================
  const handleToggleWarehousePermission = (featureKey, action) => {
    setWarehouseRoles((prev) =>
      prev.map((r) => {
        if (r.id === selectedWarehouseRole.id) {
          const currentActions = r.matrix[featureKey] || [];
          const updated = currentActions.includes(action)
            ? currentActions.filter((a) => a !== action)
            : [...currentActions, action];
          return {
            ...r,
            matrix: { ...r.matrix, [featureKey]: updated },
          };
        }
        return r;
      })
    );
  };

  const handleToggleWarehouseCostView = () => {
    setWarehouseRoles((prev) =>
      prev.map((r) =>
        r.id === selectedWarehouseRole.id ? { ...r, canViewCost: !r.canViewCost } : r
      )
    );
    toast.info('Đã cập nhật quyền xem giá nhập & giá vốn kho!');
  };

  const handleOpenEditWarehouseStaff = (wh) => {
    setEditingWarehouse(wh);
    const staff = wh.staffIds && wh.staffIds.includes(2) ? wh.staffIds : [2, ...(wh.staffIds || [])];
    setSelectedStaffIdsForWarehouse(staff);
    setIsWarehouseStaffModalOpen(true);
  };

  const handleSaveWarehouseStaff = () => {
    if (!editingWarehouse) return;
    const finalStaff = selectedStaffIdsForWarehouse.includes(2)
      ? selectedStaffIdsForWarehouse
      : [2, ...selectedStaffIdsForWarehouse];
    setWarehouseItems((prev) =>
      prev.map((wh) => (wh.id === editingWarehouse.id ? { ...wh, staffIds: finalStaff } : wh))
    );
    toast.success(`Đã cập nhật nhân sự phụ trách "${editingWarehouse.name}"!`);
    setIsWarehouseStaffModalOpen(false);
  };

  // =========================================================================
  // HANDLERS: MỤC 6 (DỮ LIỆU & QUY TẮC)
  // =========================================================================
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      if (partnerFilter !== 'ALL' && p.category !== partnerFilter) return false;
      if (partnerSearch.trim()) {
        const q = partnerSearch.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.phone.includes(q) || (p.address || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [partners, partnerFilter, partnerSearch]);

  const handleSavePartner = async (e) => {
    e.preventDefault();
    if (!partnerForm.name.trim() || !partnerForm.phone.trim()) {
      toast.error('Vui lòng nhập tên đối tác và số điện thoại');
      return;
    }
    try {
      if (editingPartner) {
        await settingsService.updatePartner(editingPartner.id, {
          name: partnerForm.name.trim(),
          phone: partnerForm.phone.trim(),
          partnerType: partnerForm.category,
          address: partnerForm.address?.trim() || '',
        });
        toast.success(`Đã cập nhật đối tác "${partnerForm.name}"!`);
      } else {
        await settingsService.createPartner({
          name: partnerForm.name.trim(),
          phone: partnerForm.phone.trim(),
          partnerType: partnerForm.category,
          address: partnerForm.address?.trim() || '',
        });
        toast.success(`Đã thêm mới đối tác "${partnerForm.name}"!`);
      }
      setIsPartnerModalOpen(false);
      const res = await settingsService.getPartners().catch(() => null);
      if (res && (Array.isArray(res.content) || Array.isArray(res))) {
        setPartners(Array.isArray(res.content) ? res.content : res);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu đối tác');
    }
  };

  const handleDeletePartner = async (partner) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đối tác "${partner.name}"?`)) return;
    try {
      await settingsService.deletePartner(partner.id);
      toast.success(`Đã xóa đối tác "${partner.name}"!`);
      const res = await settingsService.getPartners().catch(() => null);
      if (res && (Array.isArray(res.content) || Array.isArray(res))) {
        setPartners(Array.isArray(res.content) ? res.content : res);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa đối tác');
    }
  };

  const handleSaveVietQr = async (e) => {
    e.preventDefault();
    try {
      await settingsService.updateFinancialSettings(currentFarmId, {
        bankBin: vietQrConfig.bankBin,
        bankName: vietQrConfig.bankName,
        bankAccountNo: vietQrConfig.accountNumber,
        bankAccountName: vietQrConfig.accountHolder,
        bankAccountHolder: vietQrConfig.accountHolder,
      });
      toast.success('Đã lưu cấu hình tài khoản VietQR thành công!');
    } catch {
      toast.error('Lỗi khi lưu cấu hình VietQR');
    }
  };

  const handleSaveReason = (e) => {
    e.preventDefault();
    if (!reasonForm.title.trim()) {
      toast.error('Vui lòng nhập tên hạng mục');
      return;
    }
    const newReason = {
      id: Date.now(),
      title: reasonForm.title.trim(),
      type: reasonForm.type,
      isActive: true,
    };
    setCashflowReasons((prev) => [...prev, newReason]);
    toast.success(`Đã thêm hạng mục "${newReason.title}"!`);
    setIsReasonModalOpen(false);
  };

  const handleSaveSystemRules = async () => {
    try {
      await settingsService.updateDataRules(currentFarmId, systemRules);
      toast.success('Đã lưu quy tắc vận hành hệ thống thành công!');
    } catch {
      toast.error('Lỗi khi lưu quy tắc vận hành');
    }
  };

  // Helper render Avatar nhóm tròn xếp chồng chuẩn visual FarmGo (Ảnh 2 & 3)
  const renderAvatarStack = (staffIds) => {
    const sortedIds = [2, ...staffIds.filter((id) => id !== 2)];
    const uniqueIds = Array.from(new Set(sortedIds));

    return (
      <div className="flex items-center -space-x-1.5 overflow-hidden py-1">
        {uniqueIds.map((id) => {
          const isOwnerMember = id === 2;
          const member = members.find((m) => m.userId === id);
          const name = member?.fullName || (isOwnerMember ? 'Chủ trang trại (Luôn quản lý)' : 'Nhân sự');

          if (isOwnerMember) {
            return (
              <div
                key={id}
                title={name}
                className="relative inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white select-none shadow-xs overflow-hidden bg-[#1b3a6b] z-30"
              >
                <div className="flex flex-col items-center justify-center w-full h-full text-white">
                  <span className="text-[10px] leading-tight">👨‍🌾</span>
                  <span className="text-[7px] font-black text-amber-300 tracking-tighter -mt-0.5">FarmGo</span>
                </div>
              </div>
            );
          }

          if (id === 3) {
            return (
              <div
                key={id}
                title={name}
                className="relative inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white font-black text-white text-xs select-none shadow-xs bg-[#8cc63f] z-20"
              >
                L
              </div>
            );
          }

          return (
            <div
              key={id}
              title={name}
              className="relative inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white text-[11px] font-bold text-white select-none shadow-xs bg-gradient-to-tr from-amber-700 to-rose-600 z-10"
            >
              {name.charAt(0)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-emerald-600" />
            <span>Thiết Lập Chung Hệ Thống</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình toàn diện mô hình trang trại FarmGo: Hồ sơ dịch vụ, phân quyền đa vai trò kiêm nhiệm và quy tắc dữ liệu vận hành.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6 HORIZONTAL TABS NẰM NGANG LỚN CHUẨN FARMGO */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('service-info')}
          className={`px-3.5 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${
            activeTab === 'service-info'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Building className="h-4 w-4" />
          <span>1. Thông Tin Dịch Vụ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${
            activeTab === 'users'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>2. Quyền Hạn Người Dùng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('labor-roles')}
          className={`px-3.5 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${
            activeTab === 'labor-roles'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>3. Vai Trò Nhân Công</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('zone-roles')}
          className={`px-3.5 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${
            activeTab === 'zone-roles'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>4. Vai Trò Khu Nuôi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('warehouse-roles')}
          className={`px-3.5 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${
            activeTab === 'warehouse-roles'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Warehouse className="h-4 w-4" />
          <span>5. Vai Trò Kho Hàng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('data-rules')}
          className={`px-3.5 py-2.5 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${
            activeTab === 'data-rules'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>6. Dữ Liệu & Quy Tắc</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* NỘI DUNG MỤC 1: THÔNG TIN DỊCH VỤ (HỒ SƠ TRANG TRẠI & GÓI CƯỚC VNPAY) */}
      {/* ========================================================================= */}
      {activeTab === 'service-info' && (
        <div className="space-y-6">
          {/* Khối A - Thông tin Cơ sở chăn nuôi */}
          <form
            onSubmit={handleSaveFacility}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
          >
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building className="h-4 w-4 text-emerald-600" />
                  <span>Thông tin cơ sở chăn nuôi</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cung cấp thông tin pháp lý, mã định danh cơ sở và địa chỉ vùng nuôi để xuất báo cáo kiểm dịch.
                </p>
              </div>
              <Button type="submit" variant="primary" size="sm" disabled={isSavingFacility} className="font-bold">
                {isSavingFacility ? 'Đang lưu...' : 'Lưu Thông Tin Cơ Sở'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <FormField label="Tên trang trại *" required>
                <Input
                  value={facilityInfo.name}
                  onChange={(e) => setFacilityInfo({ ...facilityInfo, name: e.target.value })}
                  placeholder="VD: Trang trại Hòa Bình"
                  required
                />
              </FormField>

              <FormField label="Loại hình kinh doanh">
                <Select
                  value={facilityInfo.businessType}
                  onChange={(e) => setFacilityInfo({ ...facilityInfo, businessType: e.target.value })}
                >
                  <option value="Cá nhân kinh doanh">Cá nhân kinh doanh</option>
                  <option value="Hộ kinh doanh">Hộ kinh doanh</option>
                  <option value="Hợp tác xã">Hợp tác xã</option>
                  <option value="Doanh nghiệp">Doanh nghiệp</option>
                </Select>
              </FormField>

              <FormField label="Số điện thoại liên hệ *" required>
                <Input
                  value={facilityInfo.phone}
                  onChange={(e) => setFacilityInfo({ ...facilityInfo, phone: e.target.value })}
                  placeholder="0912 888 999"
                  required
                />
              </FormField>

              <FormField label="Mã số vùng nuôi (Định danh Chi cục Thú y)">
                <Input
                  value={facilityInfo.zoneCode}
                  onChange={(e) => setFacilityInfo({ ...facilityInfo, zoneCode: e.target.value })}
                  placeholder="VD: VN-75-TN-0482"
                />
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Địa chỉ cơ sở chăn nuôi *" required>
                  <Input
                    value={facilityInfo.address}
                    onChange={(e) => setFacilityInfo({ ...facilityInfo, address: e.target.value })}
                    placeholder="Ấp 3, Xã Gia Kiệm, Huyện Thống Nhất, Tỉnh Đồng Nai"
                    required
                  />
                </FormField>
              </div>
            </div>
          </form>

          {/* Khối B - Quản lý Gói cước & Dịch vụ mở rộng (Add-ons App Store) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  <span>Thông Tin Gói Dịch Vụ & Hạn Mức</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quản lý gói đăng ký hiện tại, dung lượng thành viên và App Store dịch vụ mở rộng liên thông VNPAY Sandbox.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Đang hoạt động ổn định
              </span>
            </div>

            {/* Card trạng thái gói hiện tại */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Gói Cước Đang Sử Dụng</span>
                <div className="text-xl font-black text-slate-900">{subscriptionInfo.packageName}</div>
                <p className="text-xs text-slate-500">
                  Hạn sử dụng đến: <strong className="text-emerald-700">{subscriptionInfo.expiresAt}</strong> (Còn 410 ngày)
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px]">Giới Hạn Thành Viên</span>
                  <span className="font-black text-slate-900">{subscriptionInfo.currentUserCount} / {subscriptionInfo.userLimit} tài khoản</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{ width: `${(subscriptionInfo.currentUserCount / subscriptionInfo.userLimit) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">Có thể mua gói mở rộng để thêm nhân sự không giới hạn</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px]">Quy Mô Chuồng Nuôi</span>
                  <span className="font-black text-slate-900">{subscriptionInfo.currentBarnCount} / {subscriptionInfo.barnLimit} chuồng</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-600 h-2 rounded-full"
                    style={{ width: `${(subscriptionInfo.currentBarnCount / subscriptionInfo.barnLimit) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">Đã kích hoạt 5 chuồng đang có vật nuôi</p>
              </div>
            </div>

            {/* Lưới thẻ 6 Dịch vụ mở rộng (Card Grid) */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Kho Dịch Vụ Mở Rộng & Ứng Dụng Chuyên Sâu (App Store)</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {addons.map((addon) => (
                  <div
                    key={addon.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      addon.isEnabled
                        ? 'border-emerald-300 bg-white shadow-xs'
                        : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="text-2xl">{addon.icon}</div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            addon.isEnabled
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {addon.badge}
                        </span>
                      </div>

                      <h5 className="font-bold text-slate-900 text-xs">{addon.title}</h5>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                        {addon.desc}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-xs">
                        <span className="font-black text-slate-900 font-mono">
                          {formatCurrency(addon.price)}
                        </span>
                        <span className="text-[11px] text-slate-400">/{addon.priceUnit}</span>
                      </div>

                      {addon.isEnabled ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-emerald-600">Đã mua</span>
                          <button
                            type="button"
                            onClick={() => handleToggleAddon(addon.id)}
                            className="text-emerald-600 hover:text-emerald-700 transition-colors"
                            title="Bật/Tắt sử dụng"
                          >
                            <ToggleRight className="h-6 w-6" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenUpgradeModal(addon)}
                          className="font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs py-1 px-2.5"
                        >
                          Mua thêm / Nâng cấp
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NỘI DUNG MỤC 2: QUYỀN HẠN NGƯỜI DÙNG (THÀNH VIÊN & GHÉP VAI TRÒ) */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Thanh công cụ */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                <span>Danh Sách Thành Viên Trang Trại</span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Mời nhân viên qua số điện thoại và gán tổ hợp vai trò chuyên môn kiêm nhiệm.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Tìm theo tên, SĐT thành viên..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<UserPlus className="h-4 w-4" />}
                onClick={handleOpenInviteModal}
                className="font-bold shadow-sm whitespace-nowrap"
                title="Mời nhân sự mới qua số điện thoại"
              >
                + Mời nhân sự mới qua SĐT
              </Button>
            </div>
          </div>

          {/* Bảng danh sách thành viên */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Họ Tên & Số Điện Thoại</th>
                    <th className="py-3 px-4">Tổ Hợp Vai Trò Đang Gán</th>
                    <th className="py-3 px-4">Phạm Vi Chuồng Nuôi</th>
                    <th className="py-3 px-4 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm shadow-xs">
                            {m.avatar}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{m.fullName}</span>
                              {m.isOwner && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                                  Chủ trại
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  m.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : m.status === 'INACTIVE'
                                    ? 'bg-slate-200 text-slate-600'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {m.status === 'PENDING'
                                  ? 'Chờ xác nhận'
                                  : m.status === 'INACTIVE'
                                  ? 'Ngừng hoạt động'
                                  : 'Đang hoạt động'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{m.phone}</div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Tổ hợp vai trò */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {!m.zoneRole && !m.warehouseRole && !m.laborRole && m.roleName ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Shield className="h-3 w-3 text-emerald-600" />
                              <span>{m.roleName}</span>
                            </span>
                          ) : (
                            <>
                              {m.zoneRole && m.zoneRole !== 'Không có' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  <Layers className="h-3 w-3 text-purple-600" />
                                  <span>Khu nuôi: {m.zoneRole}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-400">
                                  Khu nuôi: Không có
                                </span>
                              )}

                              {m.warehouseRole && m.warehouseRole !== 'Không có' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Warehouse className="h-3 w-3 text-amber-600" />
                                  <span>Kho: {m.warehouseRole}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-400">
                                  Kho: Không có
                                </span>
                              )}

                              {m.laborRole && m.laborRole !== 'Không có' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                  <Users className="h-3 w-3 text-sky-600" />
                                  <span>Nhân công: {m.laborRole}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-400">
                                  Nhân công: Không có
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      {/* Cột 3: Phạm vi chuồng nuôi */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-[11px] inline-block">
                          {(() => {
                            if (m.barnsText) return m.barnsText;
                            if (m.allBarns === false && Array.isArray(m.barnIds) && m.barnIds.length > 0) {
                              const names = m.barnIds
                                .map((id) => realBarns.find((b) => Number(b.id) === Number(id))?.label || `Chuồng #${id}`);
                              return names.join(', ');
                            }
                            return 'Tất cả chuồng nuôi';
                          })()}
                        </span>
                      </td>

                      {/* Cột 4: Hành động */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAssignRolesModal(m)}
                            className="font-bold text-slate-700 hover:text-emerald-700 hover:border-emerald-300 text-xs py-1 px-2"
                          >
                            Phân quyền & Gán chuồng
                          </Button>

                          {!m.isOwner && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveMember(m)}
                              className="text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs py-1 px-2"
                              title="Gỡ khỏi trại"
                            >
                              Gỡ
                            </Button>
                          )}
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
      {/* NỘI DUNG MỤC 3: VAI TRÒ NHÂN CÔNG (DYNAMIC SCRUD MATRIX) */}
      {/* ========================================================================= */}
      {activeTab === 'labor-roles' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                <span>Quản Lý Kho Vai Trò Nhân Công (Dynamic Roles)</span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Thiết lập quyền quản lý lao động, xem bảng lương và hạch toán chi phí công khoán lứa nuôi.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditingLaborRole(null);
                setLaborRoleNameInput('');
                setIsLaborRoleModalOpen(true);
              }}
              className="font-bold shadow-sm whitespace-nowrap"
            >
              + Thêm vai trò mới
            </Button>
          </div>

          {/* Bố cục 2 cột (Master-Detail) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Cột trái: Danh sách vai trò */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
              <div className="bg-slate-100 p-3 font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between border-b border-slate-200">
                <span>TÊN VAI TRÒ</span>
                <span className="text-[11px] text-slate-500">NGÀY TẠO</span>
              </div>

              <div className="divide-y divide-slate-100">
                {laborRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedLaborRoleId(role.id)}
                    className={`w-full p-3.5 text-left transition-all flex items-center justify-between ${
                      selectedLaborRoleId === role.id
                        ? 'bg-emerald-50/70 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{role.name}</span>
                        {role.isSystem && (
                          <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                            Hệ thống
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <span>{role.canViewSalary ? '👁️ Cho phép xem lương' : '🔒 Ẩn cột tiền lương'}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{role.createdAt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cột phải: Bảng ma trận tích chọn quyền SCRUD */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
              <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>Ma trận quyền:</span>
                    <span className="text-emerald-700 font-black">{selectedLaborRole.name}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tích chọn quyền Xem (S), Thêm mới (C), Chỉnh sửa (U), Xóa (D) cho từng nghiệp vụ nhân công.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => toast.success(`Đã lưu ma trận quyền cho vai trò "${selectedLaborRole.name}"!`)}
                    className="font-bold"
                  >
                    Lưu Ma Trận Quyền
                  </Button>
                </div>
              </div>

              {/* Toggle quyền đặc biệt: Xem mức lương & Tiền thưởng */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900 block text-xs">
                    Quyền đặc biệt: Xem mức lương & Tiền thưởng
                  </span>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Nếu tắt quyền này (dành cho Trại trưởng/Công nhân), hệ thống sẽ ẩn toàn bộ các cột lương và thẻ KPI tiền bạc.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleLaborSalaryView}
                  className="text-amber-800 hover:text-amber-900 transition-colors"
                >
                  {selectedLaborRole.canViewSalary ? (
                    <ToggleRight className="h-7 w-7 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Bảng ma trận quyền nghiệp vụ */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Nghiệp Vụ Nhân Công</th>
                      <th className="py-2.5 px-3 text-center w-16">Xem (S)</th>
                      <th className="py-2.5 px-3 text-center w-16">Thêm (C)</th>
                      <th className="py-2.5 px-3 text-center w-16">Sửa (U)</th>
                      <th className="py-2.5 px-3 text-center w-16">Xóa (D)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { key: 'worker_profile', title: '1. Hồ sơ nhân công cố định (Lý lịch, CCCD, phân công)' },
                      { key: 'attendance', title: '2. Chấm công nhật & Theo dõi ngày công làm việc' },
                      { key: 'seasonal_tasks', title: '3. Công thời vụ & Khoán việc theo Lứa nuôi' },
                      { key: 'payroll_calc', title: '4. Chốt bảng lương tháng & Tạm ứng tiền lương' },
                      { key: 'cashbook_reconcile', title: '5. Đối soát chứng từ liên thông Sổ quỹ thu chi' },
                    ].map((item) => {
                      const actions = selectedLaborRole.matrix[item.key] || [];
                      return (
                        <tr key={item.key} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{item.title}</td>
                          {['S', 'C', 'U', 'D'].map((act) => (
                            <td key={act} className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={actions.includes(act)}
                                onChange={() => handleToggleLaborPermission(item.key, act)}
                                className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NỘI DUNG MỤC 4: VAI TRÒ KHU NUÔI (DYNAMIC ROLES & PHÂN QUYỀN CHUỒNG) */}
      {/* ========================================================================= */}
      {activeTab === 'zone-roles' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600" />
                <span>Quản Lý Kho Vai Trò Khu Nuôi (Dynamic Roles)</span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Thiết lập ma trận quyền kỹ thuật chăn nuôi và phân bổ nhân lực trực tiếp theo chuồng.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditingZoneRole(null);
                setZoneRoleNameInput('');
                setIsZoneRoleModalOpen(true);
              }}
              className="font-bold shadow-sm whitespace-nowrap"
            >
              + Tạo vai trò mới
            </Button>
          </div>

          {/* Khối 1: Bố cục 2 cột ma trận quyền khu nuôi */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
              <div className="bg-slate-100 p-3 font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between border-b border-slate-200">
                <span>VAI TRÒ KHU NUÔI</span>
                <span className="text-[11px] text-slate-500">NGÀY TẠO</span>
              </div>
              <div className="divide-y divide-slate-100">
                {zoneRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedZoneRoleId(role.id)}
                    className={`w-full p-3.5 text-left transition-all flex items-center justify-between ${
                      selectedZoneRoleId === role.id
                        ? 'bg-purple-50/70 border-l-4 border-purple-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">{role.name}</div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Quyền kỹ thuật & nhật ký chuồng</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{role.createdAt}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>Ma trận quyền:</span>
                    <span className="text-purple-700 font-black">{selectedZoneRole.name}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tích chọn quyền S C U D cho: Khu nuôi, Lứa nuôi, Ghi nhật ký và Thiết lập phác đồ vắc-xin.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => toast.success(`Đã lưu ma trận quyền cho vai trò "${selectedZoneRole.name}"!`)}
                  className="font-bold"
                >
                  Lưu Ma Trận Quyền
                </Button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Nghiệp Vụ Khu Nuôi</th>
                      <th className="py-2.5 px-3 text-center w-16">Xem (S)</th>
                      <th className="py-2.5 px-3 text-center w-16">Thêm (C)</th>
                      <th className="py-2.5 px-3 text-center w-16">Sửa (U)</th>
                      <th className="py-2.5 px-3 text-center w-16">Xóa (D)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { key: 'zones_batches', title: '1. Khu nuôi & Vòng đời Lứa nuôi (Khởi tạo, đóng lứa)' },
                      { key: 'daily_feeding', title: '2. Nhật ký cho ăn & Định mức tiêu thụ cám' },
                      { key: 'daily_medication', title: '3. Nhật ký dùng thuốc & Tiêm phòng vắc-xin' },
                      { key: 'daily_loss_weight', title: '4. Báo cáo heo/gà chết, loại thải & Cân trọng lượng mẫu' },
                      { key: 'vaccine_protocols', title: '5. Thiết lập chăn nuôi (Quy trình mẫu & Lịch vắc-xin)' },
                    ].map((item) => {
                      const actions = selectedZoneRole.matrix[item.key] || [];
                      return (
                        <tr key={item.key} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{item.title}</td>
                          {['S', 'C', 'U', 'D'].map((act) => (
                            <td key={act} className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={actions.includes(act)}
                                onChange={() => handleToggleZonePermission(item.key, act)}
                                className="h-4 w-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Khối 2: Bảng phân quyền quản lý lứa nuôi theo từng Chuồng (Ảnh 2 của FarmGo) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Phân quyền quản lý lứa nuôi theo từng Chuồng.
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gán nhân viên phụ trách trực tiếp vào từng chuồng nuôi để nhận thông báo và ghi nhận số liệu.
                </p>
              </div>
              <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
                Tài khoản <strong className="text-emerald-700">Chủ trang trại</strong> luôn có toàn quyền quản lý
              </span>
            </div>

            <div className="space-y-6 text-xs">
              {zoneBarnGroups.map((group) => (
                <div key={group.zoneName} className="space-y-2">
                  <div className="font-bold text-slate-800 bg-slate-100/80 px-4 py-2 rounded-lg text-xs uppercase tracking-wider">
                    {group.zoneName}
                  </div>

                  <div className="divide-y divide-slate-100">
                    {group.barns.map((barn) => (
                      <div key={barn.id} className="py-3 px-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                        <div className="w-1/4 font-semibold text-slate-900">{barn.name}</div>
                        <div className="w-1/2">{renderAvatarStack(barn.staffIds)}</div>
                        <div className="w-1/4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEditBarnStaff(barn)}
                            className="text-emerald-700 hover:text-emerald-800 hover:underline font-bold text-xs"
                          >
                            Chỉnh sửa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NỘI DUNG MỤC 5: VAI TRÒ KHO HÀNG (DYNAMIC ROLES & PHÂN QUYỀN KHO) */}
      {/* ========================================================================= */}
      {activeTab === 'warehouse-roles' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-emerald-600" />
                <span>Quản Lý Kho Vai Trò Kho Hàng (Dynamic Roles)</span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Cấu hình quyền thủ kho, phụ kho, quản lý hóa đơn mua bán và phân quyền quản lý từng kho vật tư.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditingWarehouseRole(null);
                setWarehouseRoleNameInput('');
                setIsWarehouseRoleModalOpen(true);
              }}
              className="font-bold shadow-sm whitespace-nowrap"
            >
              + Tạo vai trò mới
            </Button>
          </div>

          {/* Khối 1: Bố cục 2 cột ma trận quyền kho hàng */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
              <div className="bg-slate-100 p-3 font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between border-b border-slate-200">
                <span>VAI TRÒ KHO HÀNG</span>
                <span className="text-[11px] text-slate-500">NGÀY TẠO</span>
              </div>
              <div className="divide-y divide-slate-100">
                {warehouseRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedWarehouseRoleId(role.id)}
                    className={`w-full p-3.5 text-left transition-all flex items-center justify-between ${
                      selectedWarehouseRoleId === role.id
                        ? 'bg-amber-50/70 border-l-4 border-amber-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">{role.name}</div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {role.canViewCost ? '💰 Xem giá vốn & giá mua' : '🔒 Ẩn giá tiền (chỉ xem SL)'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{role.createdAt}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>Ma trận quyền:</span>
                    <span className="text-amber-800 font-black">{selectedWarehouseRole.name}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tích chọn quyền S C U D A cho: Tồn kho, Xuất nhập nội bộ, Hóa đơn mua bán và Sổ quỹ.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => toast.success(`Đã lưu ma trận quyền cho vai trò "${selectedWarehouseRole.name}"!`)}
                  className="font-bold"
                >
                  Lưu Ma Trận Quyền
                </Button>
              </div>

              {/* Toggle quyền đặc biệt: Xem giá nhập & Giá vốn */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900 block text-xs">
                    Quyền đặc biệt: Xem giá nhập & Giá vốn hàng hóa
                  </span>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Nếu tắt quyền này (dành cho Phụ kho), nhân viên chỉ thấy số lượng tồn mà không thấy đơn giá và tiền bạc.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleWarehouseCostView}
                  className="text-amber-800 hover:text-amber-900 transition-colors"
                >
                  {selectedWarehouseRole.canViewCost ? (
                    <ToggleRight className="h-7 w-7 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Phân Hệ Kho & Mua Bán</th>
                      <th className="py-2.5 px-3 text-center w-14">Xem (S)</th>
                      <th className="py-2.5 px-3 text-center w-14">Thêm (C)</th>
                      <th className="py-2.5 px-3 text-center w-14">Sửa (U)</th>
                      <th className="py-2.5 px-3 text-center w-14">Xóa (D)</th>
                      <th className="py-2.5 px-3 text-center w-14">Duyệt (A)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { key: 'inventory_items', title: '1. Kho hàng hóa (Tồn kho cám, thuốc, vắc-xin theo lô FEFO)' },
                      { key: 'internal_transfers', title: '2. Xuất nhập nội bộ & Kiểm kê kho thực tế' },
                      { key: 'purchase_invoices', title: '3. Hóa đơn nhập mua thức ăn, thuốc, con giống & Công nợ' },
                      { key: 'sales_invoices', title: '4. Quản lý bán hàng & Xuất bán heo/gà thịt ra thị trường' },
                      { key: 'cashbook', title: '5. Sổ quỹ thu chi & Phân bổ chi phí vận hành vào lứa nuôi' },
                    ].map((item) => {
                      const actions = selectedWarehouseRole.matrix[item.key] || [];
                      return (
                        <tr key={item.key} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{item.title}</td>
                          {['S', 'C', 'U', 'D', 'A'].map((act) => (
                            <td key={act} className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={actions.includes(act)}
                                onChange={() => handleToggleWarehousePermission(item.key, act)}
                                className="h-4 w-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Khối 2: Bảng phân quyền quản lý kho hàng (Ảnh 3 của FarmGo) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Phân quyền quản lý kho hàng.
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chỉ định nhân sự có quyền xuất/nhập và kiểm kê cho từng kho vật tư chuyên biệt.
                </p>
              </div>
              <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
                Tài khoản <strong className="text-emerald-700">Chủ trang trại</strong> luôn có toàn quyền quản lý
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {warehouseItems.map((wh) => (
                <div key={wh.id} className="py-3 px-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div className="w-1/4 font-semibold text-slate-900">{wh.name}</div>
                  <div className="w-1/2">{renderAvatarStack(wh.staffIds)}</div>
                  <div className="w-1/4 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenEditWarehouseStaff(wh)}
                      className="text-emerald-700 hover:text-emerald-800 hover:underline font-bold text-xs"
                    >
                      Chỉnh sửa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NỘI DUNG MỤC 6: DỮ LIỆU & QUY TẮC HỆ THỐNG (3 SUB-TABS) */}
      {/* ========================================================================= */}
      {activeTab === 'data-rules' && (
        <div className="space-y-5">
          {/* Sub-tab Navigation */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveDataSubTab('PARTNERS')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeDataSubTab === 'PARTNERS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>6.1 Đối Tác (NCC & Khách Hàng)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDataSubTab('FINANCIAL_VIETQR')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeDataSubTab === 'FINANCIAL_VIETQR'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <QrCode className="h-4 w-4" />
              <span>6.2 Tài Chính & Mã VietQR</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDataSubTab('SYSTEM_FLAGS')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeDataSubTab === 'SYSTEM_FLAGS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sliders className="h-4 w-4" />
              <span>6.3 Quy Tắc Vận Hành (System Flags)</span>
            </button>
          </div>

          {/* SUB-TAB 6.1: ĐỐI TÁC (NHÀ CUNG CẤP & KHÁCH HÀNG) */}
          {activeDataSubTab === 'PARTNERS' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={partnerSearch}
                      onChange={(e) => setPartnerSearch(e.target.value)}
                      placeholder="Tìm đối tác theo tên, SĐT..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  <select
                    value={partnerFilter}
                    onChange={(e) => setPartnerFilter(e.target.value)}
                    className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">Tất cả đối tác</option>
                    <option value="SUPPLIER">Chỉ Nhà cung cấp</option>
                    <option value="CUSTOMER">Chỉ Khách hàng</option>
                    <option value="BOTH">Cả hai</option>
                  </select>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => {
                    setEditingPartner(null);
                    setPartnerForm({ name: '', phone: '', category: 'SUPPLIER', address: '', taxOrId: '' });
                    setIsPartnerModalOpen(true);
                  }}
                  className="font-bold shadow-sm"
                >
                  + Thêm Đối Tác Mới
                </Button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200 tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Tên Đối Tác</th>
                        <th className="py-3 px-4">Số Điện Thoại</th>
                        <th className="py-3 px-4">Phân Loại</th>
                        <th className="py-3 px-4">Địa Chỉ</th>
                        <th className="py-3 px-3 text-right">Công Nợ Hiện Tại</th>
                        <th className="py-3 px-4 text-right">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPartners.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-700">{p.phone}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                p.category === 'SUPPLIER'
                                  ? 'bg-amber-100 text-amber-800'
                                  : p.category === 'CUSTOMER'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {p.categoryLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{p.address}</td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold">
                            {p.debt > 0 ? (
                              <span className="text-amber-700">Nợ họ: {formatCurrency(p.debt)}</span>
                            ) : p.debt < 0 ? (
                              <span className="text-emerald-700">Họ nợ: {formatCurrency(Math.abs(p.debt))}</span>
                            ) : (
                              <span className="text-slate-400">0 đ</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPartner(p);
                                setPartnerForm({
                                  name: p.name,
                                  phone: p.phone,
                                  category: p.category,
                                  address: p.address,
                                  taxOrId: '',
                                });
                                setIsPartnerModalOpen(true);
                              }}
                              className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-emerald-700"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePartner(p)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors ml-1"
                              title="Xóa đối tác"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 6.2: TÀI CHÍNH & MÃ VIETQR */}
          {activeDataSubTab === 'FINANCIAL_VIETQR' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Cấu hình VietQR */}
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-emerald-600" />
                      <span>Cấu Hình Tài Khoản Ngân Hàng Nhận Tiền (VietQR)</span>
                    </h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Tự động tạo mã QR chuẩn Napas247 khi lập hóa đơn xuất bán vật nuôi ra thị trường.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveVietQr} className="space-y-3.5">
                  <FormField label="Ngân hàng thụ hưởng *" required>
                    <Select
                      value={vietQrConfig.bankName}
                      onChange={(e) => setVietQrConfig({ ...vietQrConfig, bankName: e.target.value })}
                    >
                      <option value="Vietcombank - Ngân hàng Ngoại thương Việt Nam">Vietcombank (VCB)</option>
                      <option value="MBBank - Ngân hàng Quân Đội">MBBank (MB)</option>
                      <option value="Techcombank - Ngân hàng Kỹ Thương">Techcombank (TCB)</option>
                      <option value="BIDV - Ngân hàng Đầu tư và Phát triển">BIDV</option>
                      <option value="Agribank - Ngân hàng Nông nghiệp">Agribank</option>
                      <option value="ACB - Ngân hàng Á Châu">ACB</option>
                      <option value="VPBank - Ngân hàng Việt Nam Thịnh Vượng">VPBank</option>
                    </Select>
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Số tài khoản ngân hàng *" required>
                      <Input
                        value={vietQrConfig.accountNumber}
                        onChange={(e) => setVietQrConfig({ ...vietQrConfig, accountNumber: e.target.value })}
                        placeholder="VD: 0388889999"
                        required
                      />
                    </FormField>

                    <FormField label="Tên chủ tài khoản (In hoa không dấu) *" required>
                      <Input
                        value={vietQrConfig.accountHolder}
                        onChange={(e) => setVietQrConfig({ ...vietQrConfig, accountHolder: e.target.value.toUpperCase() })}
                        placeholder="TRAN VAN HOA"
                        required
                      />
                    </FormField>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" variant="primary" size="sm" className="font-bold">
                      Lưu Cấu Hình VietQR
                    </Button>
                  </div>
                </form>

                {/* Card xem trước VietQR */}
                <div className="p-4 bg-gradient-to-br from-emerald-800 to-teal-950 text-white rounded-2xl shadow-sm space-y-3 mt-4">
                  <div className="flex items-center justify-between text-xs text-emerald-200 font-bold uppercase tracking-wider">
                    <span>Thẻ Nhận Tiền Trang Trại</span>
                    <span className="font-mono">Napas 24/7</span>
                  </div>
                  <div className="font-mono text-lg font-black tracking-widest my-1">
                    {vietQrConfig.accountNumber}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-emerald-300 block">CHỦ TÀI KHOẢN</span>
                      <span className="font-bold uppercase tracking-wider">{vietQrConfig.accountHolder}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-300 block">NGÂN HÀNG</span>
                      <span className="font-bold">{vietQrConfig.bankName.split(' - ')[0]}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danh mục Lý do Thu / Chi ngoài mua bán */}
              <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Danh Mục Lý Do Thu / Chi</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">Tiền điện, nước, bảo dưỡng, phân bổ lứa nuôi.</p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReasonForm({ title: '', type: 'EXPENSE' });
                      setIsReasonModalOpen(true);
                    }}
                    className="font-bold text-xs"
                  >
                    + Thêm hạng mục
                  </Button>
                </div>

                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {cashflowReasons.map((r) => (
                    <div key={r.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            r.type === 'EXPENSE' ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                        />
                        <span className="font-medium text-slate-800">{r.title}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.type === 'EXPENSE'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {r.type === 'EXPENSE' ? 'Chi phí' : 'Thu nhập'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 6.3: QUY TẮC VẬN HÀNH (SYSTEM FLAGS) */}
          {activeDataSubTab === 'SYSTEM_FLAGS' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs max-w-4xl">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-emerald-600" />
                    <span>Quy Tắc Vận Hành Hệ Thống (System Flags)</span>
                  </h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Bật/tắt các ràng buộc logic vận hành kho và bảo vệ dữ liệu chống gian lận.
                  </p>
                </div>
                <Button type="button" variant="primary" size="sm" onClick={handleSaveSystemRules} className="font-bold">
                  Lưu Quy Tắc Vận Hành
                </Button>
              </div>

              <div className="space-y-4">
                {/* Rule 1 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4">
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">
                      Quản lý kho theo Lô & Hạn sử dụng (FEFO)
                    </h5>
                    <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                      Ưu tiên gợi ý xuất kho các lô cám và thuốc thú y có hạn dùng gần nhất trước; đồng thời cảnh báo màu cam khi hạn dùng còn dưới 30 ngày.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemRules({ ...systemRules, enableLotTracking: !systemRules.enableLotTracking })}
                    className="text-emerald-600 transition-colors"
                  >
                    {systemRules.enableLotTracking ? (
                      <ToggleRight className="h-8 w-8 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-400" />
                    )}
                  </button>
                </div>

                {/* Rule 2 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4">
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">
                      Cảnh báo khi cho ăn vượt định mức cám chuẩn &gt; 10%
                    </h5>
                    <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                      Tự động tính toán lượng cám chuẩn theo ngày tuổi lứa nuôi; cảnh báo màu đỏ khi lượng cám thực tế công nhân ghi vượt mức &gt; 10%.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemRules({ ...systemRules, feedOverWarning: !systemRules.feedOverWarning })}
                    className="text-emerald-600 transition-colors"
                  >
                    {systemRules.feedOverWarning ? (
                      <ToggleRight className="h-8 w-8 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-400" />
                    )}
                  </button>
                </div>

                {/* Rule 3 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4">
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">
                      Cho phép xuất âm kho tạm thời
                    </h5>
                    <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                      Cho phép lập phiếu xuất kho cám/thuốc ngay cả khi số lượng tồn chưa kịp cập nhật từ hóa đơn mua về trang trại.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemRules({ ...systemRules, allowNegativeStock: !systemRules.allowNegativeStock })}
                    className="text-emerald-600 transition-colors"
                  >
                    {systemRules.allowNegativeStock ? (
                      <ToggleRight className="h-8 w-8 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-400" />
                    )}
                  </button>
                </div>

                {/* Rule 4 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4">
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">
                      Khóa công nhân tự sửa/xóa phiếu nhật ký sau khi lưu
                    </h5>
                    <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                      Sau khi công nhân bấm lưu nhật ký tại chuồng, phiếu sẽ được khóa ngay; chỉ Trại trưởng và Chủ trại mới có quyền chỉnh sửa để chống gian lận.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemRules({ ...systemRules, lockDailyLogAfterSave: !systemRules.lockDailyLogAfterSave })}
                    className="text-emerald-600 transition-colors"
                  >
                    {systemRules.lockDailyLogAfterSave ? (
                      <ToggleRight className="h-8 w-8 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: MUA THÊM / NÂNG CẤP DỊCH VỤ MỞ RỘNG (VNPAY SANDBOX) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title={selectedAddon ? `Nâng Cấp / Mua Thêm: ${selectedAddon.title}` : 'Mua Thêm Dịch Vụ'}
        size="md"
      >
        {selectedAddon && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <span className="text-3xl">{selectedAddon.icon}</span>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedAddon.title}</h4>
                <p className="text-slate-500 mt-0.5">{selectedAddon.desc}</p>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1.5">Chọn thời hạn đăng ký:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { months: 1, label: '1 Tháng', discount: '' },
                  { months: 6, label: '6 Tháng', discount: 'Tiết kiệm 5%' },
                  { months: 12, label: '12 Tháng (1 Năm)', discount: 'Tặng 1 tháng' },
                ].map((plan) => (
                  <button
                    key={plan.months}
                    type="button"
                    onClick={() => setUpgradePlanMonths(plan.months)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      upgradePlanMonths === plan.months
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{plan.label}</div>
                    {plan.discount && (
                      <div className="text-[10px] text-amber-600 font-semibold mt-0.5">{plan.discount}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
              <div className="flex justify-between items-center text-slate-600">
                <span>Đơn giá niêm yết:</span>
                <span>{formatCurrency(selectedAddon.price)} / năm</span>
              </div>
              <div className="flex justify-between items-center text-slate-900 font-bold text-sm pt-1 border-t border-emerald-200">
                <span>Tổng tiền thanh toán:</span>
                <span className="text-emerald-700 font-mono font-black text-base">
                  {formatCurrency(Math.round((selectedAddon.price / 12) * upgradePlanMonths))}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full font-bold shadow-sm flex items-center justify-center gap-2"
                onClick={handleCheckoutVnPay}
                disabled={isProcessingCheckout}
              >
                <CreditCard className="h-4 w-4" />
                <span>Thanh Toán Qua VNPAY Sandbox</span>
              </Button>

              <button
                type="button"
                onClick={handleSimulateWebhook}
                disabled={isProcessingCheckout}
                className="w-full text-center text-[11px] text-amber-700 hover:text-emerald-700 hover:underline font-bold py-1.5 rounded-lg border border-dashed border-amber-300 bg-amber-50/50"
              >
                ⚡ Kích hoạt Demo Offline (Backend Webhook Simulation)
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: MỜI NHÂN SỰ MỚI QUA SĐT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Mời Nhân Sự Mới Qua Số Điện Thoại"
        size="md"
      >
        <form onSubmit={handleSendInvite} className="space-y-3.5 text-xs">
          <FormField label="Số điện thoại nhân sự *" required>
            <Input
              type="tel"
              value={inviteForm.phone}
              onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
              placeholder="VD: 0988 123 456"
              required
            />
          </FormField>

          <FormField label="Họ và tên nhân sự (Tùy chọn)">
            <Input
              value={inviteForm.fullName}
              onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
              placeholder="VD: Nguyễn Văn Nam"
            />
          </FormField>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="font-bold text-slate-800 block text-xs">Phân quyền ban đầu:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Vai trò Khu nuôi</label>
                <select
                  value={inviteForm.zoneRole}
                  onChange={(e) => setInviteForm({ ...inviteForm, zoneRole: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Công nhân chuồng">Công nhân chuồng</option>
                  <option value="Kỹ thuật viên / Thú y">Kỹ thuật viên</option>
                  <option value="Trại trưởng">Trại trưởng</option>
                  <option value="Không có">Không có</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Vai trò Kho hàng</label>
                <select
                  value={inviteForm.warehouseRole}
                  onChange={(e) => setInviteForm({ ...inviteForm, warehouseRole: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Không có">Không có</option>
                  <option value="Phụ kho">Phụ kho</option>
                  <option value="Kế toán kho">Kế toán kho</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Vai trò Nhân công</label>
                <select
                  value={inviteForm.laborRole}
                  onChange={(e) => setInviteForm({ ...inviteForm, laborRole: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Công nhân thường">Công nhân thường</option>
                  <option value="Trại trưởng (Chỉ xem)">Trại trưởng</option>
                  <option value="Không có">Không có</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              Gửi Lời Mời
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: CẤU HÌNH QUYỀN HẠN NGƯỜI DÙNG (GHÉP 3 NHÓM VAI TRÒ & DATA SCOPE) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAssignRolesModalOpen}
        onClose={() => setIsAssignRolesModalOpen(false)}
        title={selectedMemberForRoles ? `Cấu Hình Quyền Hạn: ${selectedMemberForRoles.fullName}` : 'Cấu Hình Quyền Hạn'}
        size="md"
      >
        {selectedMemberForRoles && (
          <div className="space-y-4 text-xs">
            {/* Khối 0: Chọn Vai trò Hệ thống / Vai trò Tùy chỉnh (Custom Role RBAC) */}
            {availableFarmRoles.length > 0 && (
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                <label className="font-bold text-emerald-900 block text-xs">
                  Vai trò Phân quyền chính (Hệ thống &amp; Vai trò Tùy chỉnh):
                </label>
                <select
                  value={userRoleConfigForm.selectedRoleId || ''}
                  onChange={(e) => setUserRoleConfigForm({ ...userRoleConfigForm, selectedRoleId: e.target.value })}
                  className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Giữ theo tổ hợp vai trò bên dưới --</option>
                  {availableFarmRoles.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.isSystem ? r.name : `[Tùy chỉnh] ${r.name}`}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-emerald-700">
                  Chọn trực tiếp vai trò tùy chỉnh tạo từ mục <strong>Mở rộng vai trò</strong> để áp dụng đúng ma trận quyền hạn cho tài khoản này.
                </p>
              </div>
            )}

            {/* Khối 1: Ghép tổ hợp 3 nhóm vai trò */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-900 block text-xs">
                Tổ hợp vai trò kiêm nhiệm (Chọn 1 vai trò cho mỗi nhóm):
              </span>

              <div className="space-y-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    1. Vai trò Khu nuôi (Chuồng trại & Vật nuôi):
                  </label>
                  <select
                    value={userRoleConfigForm.zoneRole}
                    onChange={(e) => setUserRoleConfigForm({ ...userRoleConfigForm, zoneRole: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="Trại trưởng (Toàn quyền kỹ thuật)">Trại trưởng (Toàn quyền kỹ thuật)</option>
                    <option value="Kỹ thuật viên / Thú y">Kỹ thuật viên / Thú y</option>
                    <option value="Công nhân chuồng">Công nhân chuồng (Chỉ ghi nhật ký)</option>
                    <option value="Không có">Không có vai trò khu nuôi</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    2. Vai trò Kho hàng (Vật tư, Mua bán & Sổ quỹ):
                  </label>
                  <select
                    value={userRoleConfigForm.warehouseRole}
                    onChange={(e) => setUserRoleConfigForm({ ...userRoleConfigForm, warehouseRole: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="Kế toán kho (Quản lý trọn gói)">Kế toán kho (Toàn quyền kho, mua bán & sổ quỹ)</option>
                    <option value="Phụ kho">Phụ kho (Chỉ nhập/xuất số lượng - ẩn giá tiền)</option>
                    <option value="Thủ kho vật tư">Thủ kho vật tư cám & thuốc</option>
                    <option value="Không có">Không có vai trò kho</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    3. Vai trò Nhân công (Lao động & Lương):
                  </label>
                  <select
                    value={userRoleConfigForm.laborRole}
                    onChange={(e) => setUserRoleConfigForm({ ...userRoleConfigForm, laborRole: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="Quản lý nhân công & Lương">Quản lý nhân công & Lương (Đầy đủ quyền)</option>
                    <option value="Trại trưởng (Chỉ xem & chấm công)">Trại trưởng (Chỉ xem & chấm công - ẩn cột lương)</option>
                    <option value="Công nhân thường">Công nhân thường</option>
                    <option value="Không có">Không có vai trò nhân công</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Khối 1.5: Chi nhánh phân công (Branch Scope — nhân sự chỉ thuộc 1 chi nhánh) */}
            {!selectedMemberForRoles.isOwner && (
              <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200 space-y-2">
                <label className="font-bold text-sky-900 block text-xs">
                  Chi nhánh làm việc được phân công:
                </label>
                <select
                  value={userRoleConfigForm.branchId || '1'}
                  onChange={(e) => setUserRoleConfigForm({ ...userRoleConfigForm, branchId: e.target.value })}
                  className="w-full p-2 bg-white border border-sky-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                >
                  {(branches && branches.length > 0
                    ? branches
                    : [{ id: 1, name: 'Chi nhánh 1' }]
                  ).map((br) => (
                    <option key={br.id} value={String(br.id)}>
                      {br.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-sky-700">
                  Nhân sự chỉ được phép xem và thao tác dữ liệu thuộc đúng 1 chi nhánh được Chủ trang trại phân công.
                </p>
              </div>
            )}

            {/* Khối 2: Tích chọn Phạm vi Khu nuôi (Data Scope) */}
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 space-y-3">
              <span className="font-bold text-purple-900 block text-xs">
                Phạm vi Chuồng nuôi áp dụng (Data Scope):
              </span>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="radio"
                    name="barnScopeType"
                    checked={userRoleConfigForm.barnScopeType === 'ALL'}
                    onChange={() => setUserRoleConfigForm({ ...userRoleConfigForm, barnScopeType: 'ALL' })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Tất cả chuồng nuôi trong trang trại</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="radio"
                    name="barnScopeType"
                    checked={userRoleConfigForm.barnScopeType === 'CUSTOM'}
                    onChange={() => setUserRoleConfigForm({ ...userRoleConfigForm, barnScopeType: 'CUSTOM' })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Chỉ định chuồng cụ thể được phép thao tác:</span>
                </label>

                {userRoleConfigForm.barnScopeType === 'CUSTOM' && (
                  <div className="pl-6 pt-1 grid grid-cols-2 gap-2">
                    {realBarns.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic col-span-2">Chưa có chuồng nuôi nào trong trang trại</span>
                    ) : (
                      realBarns.map((b) => (
                        <label key={b.id} className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                          <input
                            type="checkbox"
                            checked={userRoleConfigForm.selectedBarnIds.map(Number).includes(Number(b.id))}
                            onChange={() => {
                              const cur = userRoleConfigForm.selectedBarnIds.map(Number);
                              const updated = cur.includes(Number(b.id))
                                ? cur.filter((x) => x !== Number(b.id))
                                : [...cur, Number(b.id)];
                              setUserRoleConfigForm({ ...userRoleConfigForm, selectedBarnIds: updated });
                            }}
                            className="h-3.5 w-3.5 text-purple-600 rounded border-slate-300"
                          />
                          <span>{b.label}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAssignRolesModalOpen(false)}>
                Hủy
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleSaveUserRoleConfig} className="font-bold">
                Lưu Phân Quyền
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: PHÂN QUYỀN NHÂN SỰ CHUỒNG (ẢNH 2) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isZoneStaffModalOpen}
        onClose={() => setIsZoneStaffModalOpen(false)}
        title={editingBarn ? `Phân Quyền Quản Lý: ${editingBarn.name}` : 'Phân Quyền Chuồng'}
        size="sm"
      >
        {editingBarn && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-500">
              Chọn nhân sự được giao quyền theo dõi và ghi nhật ký cho <strong>{editingBarn.name}</strong>:
            </p>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {members.map((m) => {
                const isOwnerMember = m.userId === 2;
                const isSelected = selectedStaffIdsForBarn.includes(m.userId);

                return (
                  <label
                    key={m.userId}
                    className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-xs">
                        {m.avatar}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">{m.fullName}</span>
                        <span className="text-[10px] text-slate-400">{m.phone}</span>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isSelected || isOwnerMember}
                      disabled={isOwnerMember}
                      onChange={() => {
                        if (isOwnerMember) return;
                        setSelectedStaffIdsForBarn((prev) =>
                          prev.includes(m.userId)
                            ? prev.filter((id) => id !== m.userId)
                            : [...prev, m.userId]
                        );
                      }}
                      className="h-4 w-4 text-emerald-600 rounded border-slate-300"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsZoneStaffModalOpen(false)}>
                Hủy
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleSaveBarnStaff} className="font-bold">
                Lưu Thay Đổi
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: PHÂN QUYỀN NHÂN SỰ KHO (ẢNH 3) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isWarehouseStaffModalOpen}
        onClose={() => setIsWarehouseStaffModalOpen(false)}
        title={editingWarehouse ? `Phân Quyền Kho: ${editingWarehouse.name}` : 'Phân Quyền Kho'}
        size="sm"
      >
        {editingWarehouse && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-500">
              Chọn nhân sự được quyền xuất, nhập và kiểm kê tại <strong>{editingWarehouse.name}</strong>:
            </p>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {members.map((m) => {
                const isOwnerMember = m.userId === 2;
                const isSelected = selectedStaffIdsForWarehouse.includes(m.userId);

                return (
                  <label
                    key={m.userId}
                    className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-xs">
                        {m.avatar}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">{m.fullName}</span>
                        <span className="text-[10px] text-slate-400">{m.phone}</span>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isSelected || isOwnerMember}
                      disabled={isOwnerMember}
                      onChange={() => {
                        if (isOwnerMember) return;
                        setSelectedStaffIdsForWarehouse((prev) =>
                          prev.includes(m.userId)
                            ? prev.filter((id) => id !== m.userId)
                            : [...prev, m.userId]
                        );
                      }}
                      className="h-4 w-4 text-amber-600 rounded border-slate-300"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsWarehouseStaffModalOpen(false)}>
                Hủy
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleSaveWarehouseStaff} className="font-bold">
                Lưu Thay Đổi
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: THÊM / SỬA ĐỐI TÁC (NCC & KHÁCH HÀNG) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        title={editingPartner ? `Sửa Đối Tác: ${editingPartner.name}` : 'Thêm Mới Đối Tác'}
        size="md"
      >
        <form onSubmit={handleSavePartner} className="space-y-3.5 text-xs">
          <FormField label="Tên đối tác (Công ty, Đại lý, Cá nhân) *" required>
            <Input
              value={partnerForm.name}
              onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
              placeholder="VD: Công ty Cổ phần Thức ăn C.P. Việt Nam"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Số điện thoại liên hệ *" required>
              <Input
                type="tel"
                value={partnerForm.phone}
                onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                placeholder="VD: 0988 555 666"
                required
              />
            </FormField>

            <FormField label="Phân loại đối tác *" required>
              <Select
                value={partnerForm.category}
                onChange={(e) => setPartnerForm({ ...partnerForm, category: e.target.value })}
              >
                <option value="SUPPLIER">Nhà cung cấp (Cám, thuốc, giống)</option>
                <option value="CUSTOMER">Khách hàng (Thương lái, lò mổ)</option>
                <option value="BOTH">Cả hai (Vừa mua vừa bán)</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Địa chỉ đối tác">
            <Input
              value={partnerForm.address}
              onChange={(e) => setPartnerForm({ ...partnerForm, address: e.target.value })}
              placeholder="VD: KCN Biên Hòa 2, Tỉnh Đồng Nai"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPartnerModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              {editingPartner ? 'Lưu Thay Đổi' : 'Tạo Đối Tác'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 7: THÊM HẠNG MỤC THU / CHI */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isReasonModalOpen}
        onClose={() => setIsReasonModalOpen(false)}
        title="Thêm Hạng Mục Lý Do Thu / Chi"
        size="sm"
      >
        <form onSubmit={handleSaveReason} className="space-y-3.5 text-xs">
          <FormField label="Tên hạng mục lý do *" required>
            <Input
              value={reasonForm.title}
              onChange={(e) => setReasonForm({ ...reasonForm, title: e.target.value })}
              placeholder="VD: Tiền dầu chạy máy phát điện"
              required
            />
          </FormField>

          <FormField label="Loại giao dịch *" required>
            <Select
              value={reasonForm.type}
              onChange={(e) => setReasonForm({ ...reasonForm, type: e.target.value })}
            >
              <option value="EXPENSE">Chi phí vận hành trang trại</option>
              <option value="INCOME">Thu nhập phụ trợ</option>
            </Select>
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsReasonModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              Lưu Hạng Mục
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 8: TẠO VAI TRÒ NHÂN CÔNG */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isLaborRoleModalOpen}
        onClose={() => setIsLaborRoleModalOpen(false)}
        title={editingLaborRole ? `Sửa Vai Trò: ${editingLaborRole.name}` : 'Tạo Vai Trò Nhân Công Mới'}
        size="sm"
      >
        <form onSubmit={handleSaveLaborRole} className="space-y-3.5 text-xs">
          <FormField label="Tên vai trò mới *" required>
            <Input
              value={laborRoleNameInput}
              onChange={(e) => setLaborRoleNameInput(e.target.value)}
              placeholder="VD: Kế Toán Tiền Lương"
              required
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsLaborRoleModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              Tạo Vai Trò
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
