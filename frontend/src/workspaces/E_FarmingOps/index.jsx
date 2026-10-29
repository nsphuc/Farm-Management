import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Plus,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Apple,
  Search,
  RefreshCw,
  Edit,
  CheckCircle,
  Clock,
  Layers,
  MapPin,
  Calendar,
  AlertCircle,
  Flag,
  Repeat,
  TrendingUp,
  Info,
  Trash2,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { Input } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { formatDate, formatArea, formatNumber } from '@/utils/formatters';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';
import { farmingService } from '@/services/modules/farmingService';
import { toast } from '@/store/useToastStore';
import { CropSeasonModal } from './components/CropSeasonModal';
import { LivestockGroupModal } from './components/LivestockGroupModal';
import { RoutineTaskTemplateTab } from './components/RoutineTaskTemplateTab';
import { FarmingLogsTimelineTab } from './components/FarmingLogsTimelineTab';
import { GrowthAndHarvestTab } from './components/GrowthAndHarvestTab';
import { LivestockIndividualsTab } from './components/LivestockIndividualsTab';

/**
 * Workspace E: Bàn Làm Việc Canh Tác & Chăn Nuôi Hiện Trường (Điều 2.5 File 08)
 * Phân quyền phân cấp:
 * - FARM_MANAGER (Role 2): Lập kế hoạch cấp trại — Khởi tạo Mùa vụ trồng trọt, Nhập Đàn vật nuôi mới,
 *   Thiết lập khung Công việc cố định hàng ngày, theo dõi tiến độ/cảnh báo cách ly PHI và Đóng mùa vụ / Kết thúc đàn.
 * - TECHNICAL_LEAD (Role 3): Ghi nhật ký bón phân/tiêm thuốc hàng ngày và thu hoạch chi tiết.
 */
export function FarmingOpsWorkspace() {
  const { isOwner, isFarmManager } = useAuthStore();
  const owner = isOwner();
  const farmManager = isFarmManager();

  const { activeFarmId, activeFarmType, supportsCrop, supportsLivestock, syncTrigger, notifyDataChanged } = useActiveFarmStore();
  const isSpecificFarm = Boolean(activeFarmId && activeFarmId !== 'ALL');
  const queryFarmId = isSpecificFarm ? Number(activeFarmId) : undefined;

  // Lĩnh vực: 'CROP' (Trồng trọt) | 'LIVESTOCK' (Chăn nuôi)
  const [sector, setSector] = useState(activeFarmType === 'LIVESTOCK' ? 'LIVESTOCK' : 'CROP');

  // Tự động thích ứng sector theo farmType của trang trại đang chọn
  useEffect(() => {
    if (activeFarmType === 'CROP') {
      setSector('CROP');
    } else if (activeFarmType === 'LIVESTOCK') {
      setSector('LIVESTOCK');
    }
  }, [activeFarmId, activeFarmType]);

  // Dữ liệu bảng
  const [seasons, setSeasons] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);

  const [isLivestockModalOpen, setIsLivestockModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  // Drawer chi tiết & Tabs trong Drawer
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerActiveTab, setDrawerActiveTab] = useState('routines');

  // Loading state cho các thao tác đóng vụ / kết thúc đàn
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Nạp dữ liệu vụ mùa hoặc đàn nuôi theo Farm
  const fetchData = async () => {
    if (!queryFarmId) {
      setSeasons([]);
      setGroups([]);
      return;
    }

    try {
      setIsLoading(true);
      if (sector === 'CROP') {
        const res = await farmingService.getCropSeasons(queryFarmId, { size: 100 });
        const list = res?.content || (Array.isArray(res) ? res : []);
        setSeasons(list);
      } else {
        const res = await farmingService.getLivestockGroups(queryFarmId, { size: 100 });
        const list = res?.content || (Array.isArray(res) ? res : []);
        setGroups(list);
      }
    } catch (err) {
      console.error(`Lỗi khi nạp dữ liệu ${sector}:`, err);
      if (sector === 'CROP') setSeasons([]);
      else setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [queryFarmId, sector, syncTrigger?.zones, syncTrigger?.seasons, syncTrigger?.groups]);

  // Xử lý Đóng Mùa Vụ (CLOSED)
  const handleCloseCropSeason = async (season) => {
    if (season.status !== 'HARVESTING') {
      toast.warning('Chỉ có thể đóng mùa vụ khi đang ở giai đoạn Thu hoạch (HARVESTING)!');
      return;
    }

    const confirmed = window.confirm(
      `Xác nhận kết thúc và ĐÓNG MÙA VỤ: ${season.seasonCode}?\n\nToàn bộ các công việc thường nhật (tưới cây, bón phân...) gắn với phân khu này sẽ tự động dừng lại!`
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(season.id);
      await farmingService.closeCropSeason(queryFarmId, season.id);
      toast.success(`Đã đóng thành công mùa vụ ${season.seasonCode}! Toàn bộ nhiệm vụ thường nhật đã được dừng.`);
      notifyDataChanged?.('all');
      notifyDataChanged?.('zones');
      notifyDataChanged?.('locations');
      notifyDataChanged?.('seasons');
      notifyDataChanged?.('tasks');
      fetchData();
    } catch (err) {
      console.error('Lỗi khi đóng mùa vụ:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi đóng mùa vụ');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Xử lý Kết Thúc Đàn (SOLD)
  const handleCloseLivestockGroup = async (group) => {
    const confirmed = window.confirm(
      `Xác nhận đàn ${group.groupCode} đã xuất chuồng bán hết (SOLD)?\n\nHệ thống sẽ đóng sổ đàn và tự động dừng toàn bộ công việc cố định hàng ngày (cho ăn, dọn chuồng) của đàn này!`
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(group.id);
      await farmingService.closeLivestockGroup(queryFarmId, group.id);
      toast.success(`Đã kết thúc thành công đàn ${group.groupCode}! Toàn bộ nhiệm vụ thường nhật đã dừng.`);
      notifyDataChanged?.('all');
      notifyDataChanged?.('zones');
      notifyDataChanged?.('locations');
      notifyDataChanged?.('groups');
      notifyDataChanged?.('tasks');
      fetchData();
    } catch (err) {
      console.error('Lỗi khi kết thúc đàn nuôi:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi kết thúc đàn nuôi');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Xử lý Xóa Mùa Vụ (CLOSED/ARCHIVED)
  const handleDeleteCropSeason = async (season) => {
    const confirmed = window.confirm(
      `Xác nhận XÓA MÙA VỤ: ${season.seasonCode} (${season.cycleName || ''})?\n\nMùa vụ sẽ được đóng và dừng toàn bộ nhiệm vụ thường nhật.`
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(season.id);
      await farmingService.deleteCropSeason(queryFarmId, season.id);
      toast.success(`Đã xóa mùa vụ ${season.seasonCode}!`);
      notifyDataChanged?.('all');
      notifyDataChanged?.('zones');
      notifyDataChanged?.('locations');
      notifyDataChanged?.('seasons');
      notifyDataChanged?.('tasks');
      fetchData();
    } catch (err) {
      console.error('Lỗi khi xóa mùa vụ:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi xóa mùa vụ');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Xử lý Xóa Đàn Nuôi (CLOSED/ARCHIVED)
  const handleDeleteLivestockGroup = async (group) => {
    const confirmed = window.confirm(
      `Xác nhận XÓA ĐÀN VẬT NUÔI: ${group.groupCode} (${group.breedName || ''})?\n\nĐàn vật nuôi sẽ được đóng và lưu trữ vào hồ sơ lịch sử.`
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(group.id);
      await farmingService.deleteLivestockGroup(queryFarmId, group.id);
      toast.success(`Đã xóa đàn vật nuôi ${group.groupCode}!`);
      notifyDataChanged?.('all');
      notifyDataChanged?.('zones');
      notifyDataChanged?.('locations');
      notifyDataChanged?.('groups');
      notifyDataChanged?.('tasks');
      fetchData();
    } catch (err) {
      console.error('Lỗi khi xóa đàn vật nuôi:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi xóa đàn vật nuôi');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Lọc dữ liệu client-side theo từ khóa tìm kiếm
  const filteredSeasons = seasons.filter((s) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      s.seasonCode?.toLowerCase().includes(q) ||
      s.cropTypeName?.toLowerCase().includes(q) ||
      s.zoneName?.toLowerCase().includes(q) ||
      s.status?.toLowerCase().includes(q)
    );
  });

  const filteredGroups = groups.filter((g) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      g.groupCode?.toLowerCase().includes(q) ||
      g.breedName?.toLowerCase().includes(q) ||
      g.zoneName?.toLowerCase().includes(q) ||
      g.status?.toLowerCase().includes(q)
    );
  });

  // ==========================================
  // Cột Dữ Liệu: Kế Hoạch Trồng Trọt (CROP)
  // ==========================================
  const cropColumns = [
    {
      key: 'seasonCode',
      header: 'Mã Vụ Mùa',
      width: '150px',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 block text-xs">{row.seasonCode}</span>
          {row.cycleName && (
            <span className="text-[10px] text-slate-400 block truncate">
              {row.cycleName}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'cropTypeName',
      header: 'Giống Cây Trồng',
      width: '160px',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Sprout className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-slate-800 text-xs truncate">
            {row.cropTypeName || 'Giống —'}
          </span>
        </div>
      ),
    },
    {
      key: 'zoneName',
      header: 'Phân Khu Canh Tác',
      width: '160px',
      render: (row) => (
        <div>
          <span className="text-xs text-slate-700 font-medium block truncate">
            {row.zoneName || `Phân khu #${row.zoneId}`}
          </span>
        </div>
      ),
    },
    {
      key: 'plantedAreaM2',
      header: 'Diện Tích',
      align: 'right',
      width: '110px',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {formatArea(row.plantedAreaM2)}
        </span>
      ),
    },
    {
      key: 'schedule',
      header: 'Lịch Canh Tác',
      width: '170px',
      render: (row) => (
        <div className="text-[11px] space-y-0.5">
          <div className="text-slate-600">
            Gieo: <strong>{formatDate(row.startDate)}</strong>
          </div>
          {row.expectedHarvestDate && (
            <div className="text-emerald-700 font-medium">
              Dự kiến: {formatDate(row.expectedHarvestDate)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      width: '130px',
      render: (row) => (
        <div>
          <StatusBadge status={row.status} size="sm" />
          {row.isInPhiQuarantine && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 px-1.5 py-0.2 text-[9px] font-bold border border-rose-200 mt-1">
              <ShieldAlert className="h-2.5 w-2.5" />
              <span>Cách ly PHI</span>
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác Giám Đốc',
      align: 'center',
      width: '260px',
      render: (row) => {
        const isClosed = row.status === 'CLOSED' || row.status === 'CANCELLED';
        const isHarvesting = row.status === 'HARVESTING';
        const isLoadingThis = actionLoadingId === row.id;

        return (
          <div className="flex items-center justify-center gap-1.5">
            {/* Nút Sửa Kế Hoạch */}
            <Can permission="PERM_CROP_PLAN" role={["ROLE_TECHNICAL_STAFF", "ROLE_FARM_MANAGER"]}>
              <Button
                size="xs"
                variant="outline"
                icon={<Edit className="h-3 w-3" />}
                disabled={isClosed}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingSeason(row);
                  setIsCropModalOpen(true);
                }}
                title={isClosed ? 'Vụ mùa đã đóng' : 'Sửa kế hoạch mùa vụ'}
              >
                Sửa
              </Button>
            </Can>

            {/* Nút Đóng Mùa Vụ (Chỉ mở khi đang HARVESTING - Độc quyền Farm Manager) */}
            <Can permission="PERM_CROP_PLAN" role="ROLE_FARM_MANAGER">
              <Button
                size="xs"
                variant={isHarvesting ? 'danger' : 'outline'}
                icon={<Flag className="h-3 w-3" />}
                disabled={isClosed || !isHarvesting || isLoadingThis}
                isLoading={isLoadingThis}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseCropSeason(row);
                }}
                title={
                  isClosed
                    ? 'Mùa vụ đã kết thúc'
                    : isHarvesting
                    ? 'Bấm để đóng vụ mùa và tự động dừng toàn bộ nhiệm vụ thường nhật'
                    : 'Chỉ đóng vụ mùa khi trạng thái là Đang thu hoạch (HARVESTING)'
                }
              >
                {isClosed ? 'Đã Đóng' : 'Đóng Vụ'}
              </Button>
            </Can>

            {/* Nút Xóa Mùa Vụ */}
            <Can permission="PERM_CROP_PLAN" role="ROLE_FARM_MANAGER">
              <Button
                size="xs"
                variant="outline"
                icon={<Trash2 className="h-3 w-3 text-rose-500" />}
                disabled={isLoadingThis}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCropSeason(row);
                }}
                title="Xóa mùa vụ"
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Xóa
              </Button>
            </Can>

            {/* Nút Chi Tiết */}
            <Button
              size="xs"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedItem(row);
                setDrawerActiveTab('routines');
                setIsDrawerOpen(true);
              }}
              title="Xem việc cố định, nhật ký và cách ly PHI"
            >
              Chi tiết
            </Button>
          </div>
        );
      },
    },
  ];

  // ==========================================
  // Cột Dữ Liệu: Kế Hoạch Chăn Nuôi (LIVESTOCK)
  // ==========================================
  const livestockColumns = [
    {
      key: 'groupCode',
      header: 'Mã Đàn Nuôi',
      width: '150px',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 block text-xs">{row.groupCode}</span>
          {row.cycleName && (
            <span className="text-[10px] text-slate-400 block truncate">
              {row.cycleName}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'breedName',
      header: 'Giống Vật Nuôi',
      width: '160px',
      render: (row) => (
        <span className="font-semibold text-slate-800 text-xs">
          {row.breedName || 'Giống vật nuôi'}
        </span>
      ),
    },
    {
      key: 'zoneName',
      header: 'Phân Khu Chuồng',
      width: '160px',
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium truncate block">
          {row.zoneName || `Chuồng #${row.zoneId}`}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Số Lượng Đầu Con',
      align: 'right',
      width: '140px',
      render: (row) => (
        <div className="font-mono text-xs">
          <span className="font-bold text-slate-900">{formatNumber(row.currentQuantity)}</span>
          <span className="text-slate-400 text-[11px]"> / {formatNumber(row.initialQuantity)} con</span>
        </div>
      ),
    },
    {
      key: 'entryDate',
      header: 'Ngày Nhập Đàn',
      width: '130px',
      render: (row) => (
        <span className="text-xs text-slate-700">{formatDate(row.entryDate)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      width: '130px',
      render: (row) => (
        <div>
          <StatusBadge status={row.status} size="sm" />
          {row.isInWithdrawalQuarantine && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 px-1.5 py-0.2 text-[9px] font-bold border border-rose-200 mt-1">
              <ShieldAlert className="h-2.5 w-2.5" />
              <span>Cách ly thuốc</span>
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác Giám Đốc',
      align: 'center',
      width: '260px',
      render: (row) => {
        const isSold = row.status === 'SOLD' || row.status === 'CULLED';
        const isLoadingThis = actionLoadingId === row.id;

        return (
          <div className="flex items-center justify-center gap-1.5">
            {/* Nút Sửa Đàn */}
            <Can permission="PERM_LIVESTOCK_MANAGE" role={["ROLE_TECHNICAL_STAFF", "ROLE_FARM_MANAGER"]}>
              <Button
                size="xs"
                variant="outline"
                icon={<Edit className="h-3 w-3" />}
                disabled={isSold}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingGroup(row);
                  setIsLivestockModalOpen(true);
                }}
                title={isSold ? 'Đàn đã xuất bán hết' : 'Sửa thông tin đàn nuôi'}
              >
                Sửa
              </Button>
            </Can>

            {/* Nút Kết Thúc Đàn (SOLD) */}
            <Can permission="PERM_LIVESTOCK_MANAGE" role="ROLE_FARM_MANAGER">
              <Button
                size="xs"
                variant={isSold ? 'outline' : 'danger'}
                icon={<Flag className="h-3 w-3" />}
                disabled={isSold || isLoadingThis}
                isLoading={isLoadingThis}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseLivestockGroup(row);
                }}
                title={
                  isSold
                    ? 'Đàn đã xuất chuồng xong'
                    : 'Bấm khi đã xuất bán hết đàn để tự động dừng công việc cho ăn/dọn chuồng'
                }
              >
                {isSold ? 'Đã Xuất Bán' : 'Kết Thúc Đàn'}
              </Button>
            </Can>

            {/* Nút Xóa Đàn Nuôi */}
            <Can permission="PERM_LIVESTOCK_MANAGE" role="ROLE_FARM_MANAGER">
              <Button
                size="xs"
                variant="outline"
                icon={<Trash2 className="h-3 w-3 text-rose-500" />}
                disabled={isLoadingThis}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteLivestockGroup(row);
                }}
                title="Xóa đàn vật nuôi"
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Xóa
              </Button>
            </Can>

            {/* Nút Xem Thẻ Tai RFID */}
            <Button
              size="xs"
              variant="outline"
              icon={<Tag className="h-3 w-3 text-purple-600" />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedItem(row);
                setDrawerActiveTab('individuals');
                setIsDrawerOpen(true);
              }}
              title="Xem danh sách cá thể đeo thẻ tai RFID"
              className="text-purple-700 border-purple-200 hover:bg-purple-50"
            >
              Thẻ RFID
            </Button>

            {/* Nút Chi Tiết */}
            <Button
              size="xs"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedItem(row);
                setDrawerActiveTab('routines');
                setIsDrawerOpen(true);
              }}
              title="Xem việc cố định, nhật ký và tăng trưởng ADG"
            >
              Chi tiết
            </Button>
          </div>
        );
      },
    },
  ];

  // Danh sách các tab trong Slide-over Drawer
  const drawerTabs = [
    { id: 'routines', label: '1. Việc Cố Định & Thu Hoạch', icon: Repeat },
    { id: 'logs', label: '2. Nhật Ký Trừ Kho FEFO', icon: BookOpen },
    { id: 'growth', label: sector === 'CROP' ? '3. Cách Ly PHI & Thu Hoạch' : '3. Cách Ly & Tăng Trưởng ADG', icon: ShieldCheck },
    ...(sector === 'LIVESTOCK' ? [{ id: 'individuals', label: '4. Cá Thể Thẻ Tai RFID', icon: Tag }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. TOP BANNER & SECTOR SWITCHER                         */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                WS-E: Kế Hoạch Mùa Vụ & Vận Hành Hiện Trường
              </h1>
              {farmManager && (
                <span className="rounded-full bg-emerald-100 text-emerald-900 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-300">
                  Giám Đốc Trại (Role 2)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Thiết lập kế hoạch mùa vụ trồng trọt, quản lý đàn vật nuôi và kiểm soát cách ly an toàn sinh học PHI
            </p>
          </div>
        </div>

        {/* Thanh chuyển đổi lĩnh vực Trồng trọt / Chăn nuôi */}
        {supportsCrop && supportsLivestock ? (
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setSector('CROP')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                sector === 'CROP'
                  ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌾 TRỒNG TRỌT (CROP)
            </button>
            <button
              type="button"
              onClick={() => setSector('LIVESTOCK')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                sector === 'LIVESTOCK'
                  ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🐄 CHĂN NUÔI (LIVESTOCK)
            </button>
          </div>
        ) : supportsCrop ? (
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-1.5 border border-emerald-200 text-xs font-bold text-emerald-800">
            <span>🌾 TRỒNG TRỌT (CROP)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-1.5 border border-emerald-200 text-xs font-bold text-emerald-800">
            <span>🐄 CHĂN NUÔI (LIVESTOCK)</span>
          </div>
        )}

        {/* Nút bấm Tạo Mới của Kỹ thuật & Giám đốc trại */}
        <div className="flex items-center gap-2">
          {sector === 'CROP' ? (
            <Can permission="PERM_CROP_PLAN" role={["ROLE_TECHNICAL_STAFF", "ROLE_FARM_MANAGER"]}>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setEditingSeason(null);
                  setIsCropModalOpen(true);
                }}
              >
                + Mở Mùa Vụ Trồng Trọt Mới
              </Button>
            </Can>
          ) : (
            <Can permission="PERM_LIVESTOCK_MANAGE" role={["ROLE_TECHNICAL_STAFF", "ROLE_FARM_MANAGER"]}>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setEditingGroup(null);
                  setIsLivestockModalOpen(true);
                }}
              >
                + Nhập Đàn / Lứa Nuôi Mới
              </Button>
            </Can>
          )}
        </div>
      </div>

      {/* Thông điệp định hướng vai trò */}
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-950 shadow-2xs">
        <Info className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <strong>Trách nhiệm phân cấp của Giám đốc Trang trại (Role 2):</strong>
          <p className="text-emerald-800">
            Khởi tạo kế hoạch Mùa vụ trồng trọt hoặc Nhập Đàn nuôi mới cho trang trại; thiết lập khung công việc cố định và theo dõi đến ngày thu hoạch / xuất chuồng. Khi mùa vụ đạt giai đoạn thu hoạch hoặc đàn đã bán hết, bấm <strong>Đóng Mùa Vụ / Kết Thúc Đàn</strong> để hệ thống tự động giải phóng phân khu và dừng các công việc thường nhật.
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. THANH TÌM KIẾM & BẢNG DỮ LIỆU TƯƠNG ỨNG               */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Input
              prefixIcon={<Search className="h-4 w-4 text-slate-400" />}
              placeholder={
                sector === 'CROP'
                  ? 'Tìm mã vụ mùa, tên giống, phân khu...'
                  : 'Tìm mã đàn, giống vật nuôi, ô chuồng...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => fetchData()}
            isLoading={isLoading}
          >
            Làm Mới
          </Button>
        </div>

        {/* Bảng Trồng trọt */}
        {sector === 'CROP' && (
          <DataTable
            columns={cropColumns}
            data={filteredSeasons}
            isLoading={isLoading}
            onRowClick={(row) => {
              setSelectedItem(row);
              setDrawerActiveTab('routines');
              setIsDrawerOpen(true);
            }}
            emptyStateProps={{
              title: 'Chưa có vụ mùa nào đang mở tại trang trại này',
              description: isSpecificFarm
                ? 'Hãy bấm "+ Mở Mùa Vụ Trồng Trọt Mới" để bắt đầu gieo trồng trên các phân khu nhà màng.'
                : 'Vui lòng chọn trang trại cụ thể trên thanh trên cùng để xem danh sách mùa vụ.',
              actionLabel: '+ Mở Mùa Vụ Mới',
              onAction: () => {
                setEditingSeason(null);
                setIsCropModalOpen(true);
              },
            }}
          />
        )}

        {/* Bảng Chăn nuôi */}
        {sector === 'LIVESTOCK' && (
          <DataTable
            columns={livestockColumns}
            data={filteredGroups}
            isLoading={isLoading}
            onRowClick={(row) => {
              setSelectedItem(row);
              setDrawerActiveTab('routines');
              setIsDrawerOpen(true);
            }}
            emptyStateProps={{
              title: 'Chưa có đàn vật nuôi nào tại trang trại này',
              description: isSpecificFarm
                ? 'Hãy bấm "+ Nhập Đàn / Lứa Nuôi Mới" để khai báo đàn gia súc/gia cầm mới vào chuồng trại.'
                : 'Vui lòng chọn trang trại cụ thể trên thanh trên cùng để xem danh sách đàn nuôi.',
              actionLabel: '+ Nhập Đàn Mới',
              onAction: () => {
                setEditingGroup(null);
                setIsLivestockModalOpen(true);
              },
            }}
          />
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. MODALS KHỞI TẠO & CẬP NHẬT KẾ HOẠCH                  */}
      {/* ======================================================== */}
      <CropSeasonModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        farmId={queryFarmId}
        editingSeason={editingSeason}
        onSuccess={fetchData}
      />

      <LivestockGroupModal
        isOpen={isLivestockModalOpen}
        onClose={() => setIsLivestockModalOpen(false)}
        farmId={queryFarmId}
        editingGroup={editingGroup}
        onSuccess={fetchData}
      />

      {/* ======================================================== */}
      {/* 4. SLIDE-OVER DRAWER XEM CHI TIẾT 3 TABS                */}
      {/* ======================================================== */}
      <SlideOverDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={
          selectedItem
            ? sector === 'CROP'
              ? `Vụ Mùa: ${selectedItem.seasonCode} (${selectedItem.cropTypeName || 'Cây trồng'})`
              : `Đàn Nuôi: ${selectedItem.groupCode} (${selectedItem.breedName || 'Vật nuôi'})`
            : 'Chi Tiết Kế Hoạch'
        }
        subtitle={
          selectedItem
            ? `${selectedItem.zoneName || 'Phân khu'} • Bắt đầu: ${formatDate(selectedItem.startDate || selectedItem.entryDate)}`
            : ''
        }
        tabs={drawerTabs}
        activeTab={drawerActiveTab}
        onTabChange={setDrawerActiveTab}
        width="max-w-4xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Trạng thái:</span>
              {selectedItem && <StatusBadge status={selectedItem.status} size="sm" />}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Edit className="h-3.5 w-3.5" />}
                onClick={() => {
                  setIsDrawerOpen(false);
                  if (sector === 'CROP') {
                    setEditingSeason(selectedItem);
                    setIsCropModalOpen(true);
                  } else {
                    setEditingGroup(selectedItem);
                    setIsLivestockModalOpen(true);
                  }
                }}
              >
                Sửa Kế Hoạch
              </Button>

              <Button variant="secondary" size="sm" onClick={() => setIsDrawerOpen(false)}>
                Đóng Khay
              </Button>
            </div>
          </div>
        }
      >
        <div className="p-5 space-y-5 text-xs text-slate-600">
          {/* Tóm tắt thông tin đầu khay */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mã Định Danh</span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {selectedItem?.seasonCode || selectedItem?.groupCode}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Phân Khu / Chuồng</span>
              <span className="font-semibold text-slate-800 text-xs truncate block">
                {selectedItem?.zoneName || `Khu #${selectedItem?.zoneId}`}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                {sector === 'CROP' ? 'Diện Tích Canh Tác' : 'Số Lượng Đầu Con'}
              </span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {sector === 'CROP'
                  ? formatArea(selectedItem?.plantedAreaM2)
                  : `${formatNumber(selectedItem?.currentQuantity)} / ${formatNumber(selectedItem?.initialQuantity)} con`}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                {sector === 'CROP' ? 'Dự Kiến Thu Hoạch' : 'Ngày Nhập Đàn'}
              </span>
              <span className="text-xs font-semibold text-emerald-800">
                {formatDate(selectedItem?.expectedHarvestDate || selectedItem?.entryDate)}
              </span>
            </div>
          </div>

          {/* TAB 1: CÔNG VIỆC CỐ ĐỊNH HÀNG NGÀY & LỊCH THU HOẠCH */}
          {drawerActiveTab === 'routines' && selectedItem && (
            <RoutineTaskTemplateTab
              item={selectedItem}
              sector={sector}
              farmId={queryFarmId}
              onDataChanged={fetchData}
            />
          )}

          {/* TAB 2: NHẬT KÝ HIỆN TRƯỜNG & TRỪ KHO AUTO-BACKFLUSHING */}
          {drawerActiveTab === 'logs' && selectedItem && (
            <FarmingLogsTimelineTab
              item={selectedItem}
              sector={sector}
              farmId={queryFarmId}
            />
          )}

          {/* TAB 3: CÁCH LY AN TOÀN SINH HỌC & TĂNG TRƯỞNG ADG / THU HOẠCH */}
          {drawerActiveTab === 'growth' && selectedItem && (
            <GrowthAndHarvestTab
              item={selectedItem}
              sector={sector}
              farmId={queryFarmId}
            />
          )}

          {/* TAB 4: QUẢN LÝ CÁ THỂ ĐEO THẺ TAI RFID (BẢNG livestock_individuals #23) */}
          {drawerActiveTab === 'individuals' && selectedItem && sector === 'LIVESTOCK' && (
            <LivestockIndividualsTab
              item={selectedItem}
              farmId={queryFarmId}
              onDataChanged={fetchData}
            />
          )}
        </div>
      </SlideOverDrawer>
    </div>
  );
}

export default FarmingOpsWorkspace;
