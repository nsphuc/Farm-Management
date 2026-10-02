import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sprout,
  Layers,
  MapPin,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  Calendar,
  Settings,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Droplets,
  Thermometer,
  ShieldAlert,
  ArrowLeft,
  Users,
  Grid,
} from 'lucide-react';
import { farmService } from '../services/farmService';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/useAuthStore';
import { useFarmStore } from '../stores/useFarmStore';
import { toast } from 'sonner';

// Validation Schemas
const zoneSchema = z.object({
  code: z.string().min(2, 'Mã phân khu tối thiểu 2 ký tự').max(50),
  name: z.string().min(2, 'Tên phân khu tối thiểu 2 ký tự').max(255),
  zoneType: z.enum(['NHA_MANG', 'DONG_RUONG', 'CHUONG_TRAI', 'KHO', 'HO_CHUA']),
  areaM2: z.coerce.number().positive('Diện tích phải lớn hơn 0'),
  soilType: z.string().optional().or(z.literal('')),
  waterSource: z.string().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'CULTIVATING', 'ISOLATING', 'DISINFECTING', 'INACTIVE']),
  notes: z.string().optional().or(z.literal('')),
});

const locationSchema = z.object({
  code: z.string().min(1, 'Mã vị trí tối thiểu 1 ký tự').max(50),
  name: z.string().min(2, 'Tên vị trí tối thiểu 2 ký tự').max(255),
  locationType: z.enum(['O_DAT', 'LUONG_RAU', 'CHUONG_NUOI', 'DAY_CHUONG', 'NGAN_KHO']),
  areaM2: z.coerce.number().optional().nullable(),
  capacity: z.coerce.number().optional().nullable(),
  status: z.enum(['EMPTY', 'OCCUPIED', 'MAINTENANCE']),
});

const assignmentSchema = z.object({
  userId: z.coerce.number().positive('Vui lòng chọn nhân viên'),
  roleInFarm: z.enum([
    'FARM_MANAGER',
    'CHIEF_TECHNICIAN',
    'VETERINARIAN',
    'WAREHOUSE_SUPERVISOR',
    'FIELD_LEAD',
    'WORKER',
  ]),
  assignedFrom: z.string().min(1, 'Ngày bắt đầu không được để trống'),
  assignedTo: z.string().optional().or(z.literal('')),
});

const cycleSchema = z.object({
  name: z.string().min(2, 'Tên chu kỳ tối thiểu 2 ký tự').max(255),
  fiscalYear: z.coerce.number().min(2020).max(2050),
  startDate: z.string().min(1, 'Ngày bắt đầu không được để trống'),
  endDate: z.string().min(1, 'Ngày kết thúc không được để trống'),
  status: z.enum(['PREPARING', 'RUNNING', 'CLOSED']),
  notes: z.string().optional().or(z.literal('')),
});

export const FarmDetailPage = () => {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasAnyRole = useAuthStore((state) => state.hasAnyRole);
  const canManage = hasAnyRole(['ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER']);

  const currentFarm = useFarmStore((state) => state.currentFarm);
  const setCurrentFarm = useFarmStore((state) => state.setCurrentFarm);

  const [activeTab, setActiveTab] = useState('zones'); // 'zones' | 'assignments' | 'cycles' | 'settings'

  // Selected Zone for viewing Locations
  const [selectedZone, setSelectedZone] = useState(null);

  // Modals state
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);

  // Queries
  const { data: farm, isLoading: isFarmLoading } = useQuery({
    queryKey: ['farm-detail', farmId],
    queryFn: () => farmService.getFarmById(farmId),
  });

  const { data: zones = [], isLoading: isZonesLoading } = useQuery({
    queryKey: ['zones', farmId],
    queryFn: () => farmService.getZones(farmId),
    enabled: !!farmId,
  });

  const { data: locations = [], isLoading: isLocationsLoading } = useQuery({
    queryKey: ['zone-locations', farmId, selectedZone?.id],
    queryFn: () => farmService.getLocations(farmId, selectedZone.id),
    enabled: !!farmId && !!selectedZone?.id,
  });

  const { data: assignments = [], isLoading: isAssignmentsLoading } = useQuery({
    queryKey: ['assignments', farmId],
    queryFn: () => farmService.getAssignments(farmId),
    enabled: !!farmId && activeTab === 'assignments',
  });

  const { data: cycles = [], isLoading: isCyclesLoading } = useQuery({
    queryKey: ['cycles', farmId],
    queryFn: () => farmService.getCycles(farmId),
    enabled: !!farmId && activeTab === 'cycles',
  });

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['farm-settings', farmId],
    queryFn: () => farmService.getSettings(farmId),
    enabled: !!farmId && activeTab === 'settings',
  });

  // System Users for assignment
  const { data: usersList = [] } = useQuery({
    queryKey: ['system-users-for-assignment'],
    queryFn: async () => {
      // Dùng apiClient lấy danh sách users
      const res = await farmService.getFarms(); // fallback or user fetch
      return [];
    },
    enabled: isAssignmentModalOpen,
  });

  // Forms
  const zoneForm = useForm({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      code: '',
      name: '',
      zoneType: 'NHA_MANG',
      areaM2: 1000,
      soilType: 'Đất đỏ bazan',
      waterSource: 'Hệ thống giếng khoan lọc RO',
      status: 'ACTIVE',
      notes: '',
    },
  });

  const locationForm = useForm({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      code: '',
      name: '',
      locationType: 'O_DAT',
      areaM2: 50,
      capacity: 100,
      status: 'EMPTY',
    },
  });

  const assignmentForm = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      userId: '',
      roleInFarm: 'FARM_MANAGER',
      assignedFrom: new Date().toISOString().split('T')[0],
      assignedTo: '',
    },
  });

  const cycleForm = useForm({
    resolver: zodResolver(cycleSchema),
    defaultValues: {
      name: `Niên vụ Năm ${new Date().getFullYear()}`,
      fiscalYear: new Date().getFullYear(),
      startDate: `${new Date().getFullYear()}-01-01`,
      endDate: `${new Date().getFullYear()}-12-31`,
      status: 'RUNNING',
      notes: '',
    },
  });

  // Settings local state
  const [moistureMin, setMoistureMin] = useState(40);
  const [moistureMax, setMoistureMax] = useState(70);
  const [tempMax, setTempMax] = useState(35);
  const [morningShift, setMorningShift] = useState('06:00-10:30');
  const [afternoonShift, setAfternoonShift] = useState('14:00-17:30');

  React.useEffect(() => {
    if (settings) {
      try {
        if (settings.irrigationThresholdJson) {
          const parsed = JSON.parse(settings.irrigationThresholdJson);
          if (parsed.moisture_min) setMoistureMin(parsed.moisture_min);
          if (parsed.moisture_max) setMoistureMax(parsed.moisture_max);
          if (parsed.temp_max) setTempMax(parsed.temp_max);
        }
        if (settings.workShiftConfigJson) {
          const parsed = JSON.parse(settings.workShiftConfigJson);
          if (parsed.morning) setMorningShift(parsed.morning);
          if (parsed.afternoon) setAfternoonShift(parsed.afternoon);
        }
      } catch {}
    }
  }, [settings]);

  // Mutations
  const createZoneMutation = useMutation({
    mutationFn: (data) => farmService.createZone(farmId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones', farmId] });
      toast.success('Đã thêm phân khu mới!');
      setIsZoneModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra.'),
  });

  const updateZoneMutation = useMutation({
    mutationFn: ({ zoneId, data }) => farmService.updateZone(farmId, zoneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones', farmId] });
      toast.success('Đã cập nhật phân khu!');
      setIsZoneModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra.'),
  });

  const updateZoneStatusMutation = useMutation({
    mutationFn: ({ zoneId, status }) => farmService.updateZoneStatus(farmId, zoneId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones', farmId] });
      toast.success('Đã đổi trạng thái phân khu!');
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: (zoneId) => farmService.deleteZone(farmId, zoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones', farmId] });
      if (selectedZone) setSelectedZone(null);
      toast.success('Đã xóa phân khu.');
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: (data) => farmService.createLocation(farmId, selectedZone.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zone-locations', farmId, selectedZone.id] });
      toast.success('Đã thêm vị trí / ô mới!');
      setIsLocationModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra.'),
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (locId) => farmService.deleteLocation(farmId, selectedZone.id, locId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zone-locations', farmId, selectedZone.id] });
      toast.success('Đã xóa vị trí / ô.');
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (data) => farmService.createAssignment(farmId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', farmId] });
      toast.success('Đã phân công nhân sự vào trang trại!');
      setIsAssignmentModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra.'),
  });

  const revokeAssignmentMutation = useMutation({
    mutationFn: (assignmentId) => farmService.revokeAssignment(farmId, assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', farmId] });
      toast.success('Đã thu hồi phân công nhân sự.');
    },
  });

  const createCycleMutation = useMutation({
    mutationFn: (data) => farmService.createCycle(farmId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles', farmId] });
      toast.success('Đã tạo chu kỳ vận hành!');
      setIsCycleModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra.'),
  });

  const updateCycleStatusMutation = useMutation({
    mutationFn: ({ cycleId, status }) => farmService.updateCycleStatus(farmId, cycleId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles', farmId] });
      toast.success('Đã cập nhật trạng thái chu kỳ!');
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: () =>
      farmService.updateSettings(farmId, {
        irrigationThresholdJson: JSON.stringify({
          moisture_min: moistureMin,
          moisture_max: moistureMax,
          temp_max: tempMax,
        }),
        workShiftConfigJson: JSON.stringify({
          morning: morningShift,
          afternoon: afternoonShift,
        }),
      }),
    onSuccess: () => toast.success('Đã lưu cấu hình vận hành trang trại!'),
    onError: () => toast.error('Có lỗi xảy ra khi lưu cấu hình.'),
  });

  // Handlers for Zone Modal
  const openCreateZone = () => {
    setEditingZone(null);
    zoneForm.reset({
      code: '',
      name: '',
      zoneType: 'NHA_MANG',
      areaM2: 1000,
      soilType: 'Đất đỏ bazan',
      waterSource: 'Hệ thống giếng khoan lọc RO',
      status: 'ACTIVE',
      notes: '',
    });
    setIsZoneModalOpen(true);
  };

  const openEditZone = (zone, e) => {
    e.stopPropagation();
    setEditingZone(zone);
    zoneForm.reset({
      code: zone.code,
      name: zone.name,
      zoneType: zone.zoneType,
      areaM2: Number(zone.areaM2),
      soilType: zone.soilType || '',
      waterSource: zone.waterSource || '',
      status: zone.status,
      notes: zone.notes || '',
    });
    setIsZoneModalOpen(true);
  };

  const onSubmitZone = (data) => {
    if (editingZone) {
      updateZoneMutation.mutate({ zoneId: editingZone.id, data });
    } else {
      createZoneMutation.mutate(data);
    }
  };

  // Handlers for Location Modal
  const openCreateLocation = () => {
    setEditingLocation(null);
    locationForm.reset({
      code: '',
      name: '',
      locationType: 'O_DAT',
      areaM2: 50,
      capacity: 100,
      status: 'EMPTY',
    });
    setIsLocationModalOpen(true);
  };

  const onSubmitLocation = (data) => {
    createLocationMutation.mutate(data);
  };

  const onSubmitAssignment = (data) => {
    createAssignmentMutation.mutate(data);
  };

  const onSubmitCycle = (data) => {
    createCycleMutation.mutate(data);
  };

  const getZoneTypeBadge = (type) => {
    switch (type) {
      case 'NHA_MANG':
        return { label: 'Nhà màng / Nhà kính', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200' };
      case 'DONG_RUONG':
        return { label: 'Đồng ruộng / Bãi mở', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200' };
      case 'CHUONG_TRAI':
        return { label: 'Chuồng trại gia súc', color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200' };
      case 'KHO':
        return { label: 'Kho vật tư / Bảo quản', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200' };
      default:
        return { label: 'Hồ chứa / Thủy lợi', color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200' };
    }
  };

  const getZoneStatusBadge = (status) => {
    switch (status) {
      case 'CULTIVATING':
        return { label: 'Đang canh tác', bg: 'bg-emerald-500' };
      case 'ISOLATING':
        return { label: 'Đang cách ly xử lý đất', bg: 'bg-amber-500' };
      case 'DISINFECTING':
        return { label: 'Đang khử trùng', bg: 'bg-purple-500' };
      case 'ACTIVE':
        return { label: 'Sẵn sàng', bg: 'bg-blue-500' };
      default:
        return { label: 'Tạm dừng', bg: 'bg-slate-400' };
    }
  };

  if (isFarmLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Không tìm thấy trang trại
        </h3>
        <p className="text-xs text-slate-400 mt-1">Trang trại không tồn tại hoặc bạn không có quyền truy cập.</p>
        <Link to="/farms" className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-primary-600">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <Link to="/dashboard" className="hover:text-primary-600 transition-colors">
          Bảng điều khiển
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/farms" className="hover:text-primary-600 transition-colors">
          Trang trại
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 dark:text-slate-200 font-semibold truncate max-w-[200px]">
          {farm.name}
        </span>
      </nav>

      {/* Farm Overview Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-primary-600/20">
            <Sprout className="w-8 h-8" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400">
                {farm.code}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {farm.farmType === 'TRONG_TROT' ? 'Trồng trọt' : farm.farmType === 'CHAN_NUOI' ? 'Chăn nuôi' : 'Hỗn hợp'}
              </span>
              {currentFarm?.id === farm.id && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Trang trại đang chọn</span>
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {farm.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{farm.address}</span>
              </span>
              <span>•</span>
              <span>Tổng: <strong>{Number(farm.totalAreaM2).toLocaleString('vi-VN')} m²</strong> ({(Number(farm.totalAreaM2) / 10000).toFixed(2)} ha)</span>
              {farm.latitude && farm.longitude && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[11px]">GPS: {farm.latitude}, {farm.longitude}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {currentFarm?.id !== farm.id && (
          <button
            onClick={() => {
              setCurrentFarm(farm);
              toast.success(`Đã chọn làm việc tại: ${farm.name}`);
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950/40 text-slate-700 dark:text-slate-200 hover:text-primary-600 text-xs font-semibold transition-colors min-h-[44px] flex-shrink-0"
          >
            Chọn làm việc tại đây
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('zones')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
            activeTab === 'zones'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Phân khu & Mặt bằng ({zones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
            activeTab === 'assignments'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Nhân sự & Phân công</span>
        </button>

        <button
          onClick={() => setActiveTab('cycles')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
            activeTab === 'cycles'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Chu kỳ vận hành</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
            activeTab === 'settings'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Cấu hình vận hành</span>
        </button>
      </div>

      {/* TAB 1: PHÂN KHU & MẶT BẰNG */}
      {activeTab === 'zones' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Sơ đồ Phân khu Nhà màng / Đồng ruộng / Chuồng trại
              </h2>
              <p className="text-xs text-slate-400">
                Nhấp vào từng phân khu để xem chi tiết các ô canh tác hoặc chuồng cụ thể bên trong.
              </p>
            </div>

            {canManage && (
              <button
                onClick={openCreateZone}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Phân khu</span>
              </button>
            )}
          </div>

          {/* Zones Grid */}
          {zones.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Chưa có phân khu sản xuất nào
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                Hãy tạo các phân khu như Nhà kính A, Nhà màng B, Đồng ruộng 1 để bắt đầu quản lý mùa vụ.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {zones.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;
                const typeInfo = getZoneTypeBadge(zone.zoneType);
                const statusInfo = getZoneStatusBadge(zone.status);

                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(isSelected ? null : zone)}
                    className={`rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-primary-50/30 dark:bg-primary-950/20 border-primary-500 shadow-md ring-2 ring-primary-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-primary-600 dark:text-primary-400">
                              {zone.code}
                            </span>
                            <span className={`w-2 h-2 rounded-full ${statusInfo.bg}`} />
                            <span className="text-[10px] text-slate-400 font-medium">
                              {statusInfo.label}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                            {zone.name}
                          </h4>
                        </div>

                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${typeInfo.color}`}
                        >
                          {typeInfo.label}
                        </span>
                      </div>

                      {/* Specs */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex justify-between">
                          <span>Diện tích:</span>
                          <strong className="text-slate-800 dark:text-slate-200">
                            {Number(zone.areaM2).toLocaleString('vi-VN')} m²
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Số ô / chuồng con:</span>
                          <strong className="text-slate-800 dark:text-slate-200">
                            {zone.locationCount} vị trí
                          </strong>
                        </div>
                        {zone.soilType && (
                          <div className="flex justify-between">
                            <span>Chất đất:</span>
                            <span>{zone.soilType}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Status Changer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={zone.status}
                          onChange={(e) =>
                            updateZoneStatusMutation.mutate({ zoneId: zone.id, status: e.target.value })
                          }
                          className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                        >
                          <option value="ACTIVE">Sẵn sàng</option>
                          <option value="CULTIVATING">Đang canh tác</option>
                          <option value="ISOLATING">Cách ly đất</option>
                          <option value="DISINFECTING">Đang khử trùng</option>
                          <option value="INACTIVE">Tạm dừng</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1">
                        {canManage && (
                          <>
                            <button
                              onClick={(e) => openEditZone(zone, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Sửa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Xóa phân khu "${zone.name}"?`)) {
                                  deleteZoneMutation.mutate(zone.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <span className="text-[11px] font-semibold text-primary-600 pl-1">
                          {isSelected ? 'Đang mở ô con' : 'Xem ô con'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sub-section: Selected Zone Locations */}
          {selectedZone && (
            <div className="p-6 rounded-3xl bg-slate-50/70 dark:bg-slate-900/60 border border-primary-500/30 shadow-soft space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Grid className="w-4 h-4 text-primary-600" />
                    <span>Các ô đất / luống / chuồng nhỏ trong: {selectedZone.name}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Phân lô phụ giúp quản lý chính xác vị trí gieo hạt hoặc đánh số chuồng nuôi cá thể.
                  </p>
                </div>

                {canManage && (
                  <button
                    onClick={openCreateLocation}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-xs min-h-[44px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Vị trí / Ô</span>
                  </button>
                )}
              </div>

              {locations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Phân khu này chưa được chia thành các ô nhỏ hoặc luống cụ thể.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {locations.map((loc) => (
                    <div
                      key={loc.id}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-primary-600">
                            {loc.code}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              loc.status === 'OCCUPIED' ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                        </div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                          {loc.name}
                        </h5>
                        <p className="text-[10px] text-slate-400">
                          {loc.locationType} • {loc.areaM2 ? `${loc.areaM2} m²` : 'Chưa set'}
                        </p>
                      </div>

                      {canManage && (
                        <div className="flex items-center justify-end pt-1 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => {
                              if (window.confirm(`Xóa ô "${loc.name}"?`)) {
                                deleteLocationMutation.mutate(loc.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600"
                            title="Xóa"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NHÂN SỰ & PHÂN CÔNG */}
      {activeTab === 'assignments' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                <span>Nhân sự Phụ trách Cơ sở Trang trại</span>
              </h2>
              <p className="text-xs text-slate-400">
                Các nhân viên được chỉ định phân công quyền quản lý, kỹ thuật và vận hành tại trang trại này.
              </p>
            </div>

            {canManage && (
              <button
                onClick={() => setIsAssignmentModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Phân công nhân sự</span>
              </button>
            )}
          </div>

          {assignments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Chưa có nhân sự nào được phân công quản lý trang trại này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="py-3 px-3">Nhân viên</th>
                    <th className="py-3 px-3">Vai trò tại Farm</th>
                    <th className="py-3 px-3">Thời gian hiệu lực</th>
                    <th className="py-3 px-3">Trạng thái</th>
                    {canManage && <th className="py-3 px-3 text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assignments.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.userName || `User #${item.userId}`}
                        </div>
                        <div className="text-[10px] text-slate-400">{item.userEmail}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-medium text-primary-600">
                          {item.roleInFarm}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {item.assignedFrom} {item.assignedTo ? `đến ${item.assignedTo}` : '(Vô thời hạn)'}
                      </td>
                      <td className="py-3 px-3">
                        {item.isActive ? (
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            Đã thu hồi
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="py-3 px-3 text-right">
                          {item.isActive && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Thu hồi phân công của nhân viên này?`)) {
                                  revokeAssignmentMutation.mutate(item.id);
                                }
                              }}
                              className="text-red-500 hover:text-red-700 text-xs font-semibold"
                            >
                              Thu hồi
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CHU KỲ VẬN HÀNH */}
      {activeTab === 'cycles' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                <span>Chu kỳ Vận hành & Niên vụ Trang trại</span>
              </h2>
              <p className="text-xs text-slate-400">
                Quản lý các chu kỳ kinh doanh / năm tài chính để hoạch định kế toán chi phí và theo dõi tiến độ tổng thể.
              </p>
            </div>

            {canManage && (
              <button
                onClick={() => setIsCycleModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Mở Chu kỳ Mới</span>
              </button>
            )}
          </div>

          {cycles.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Chưa có chu kỳ vận hành nào được mở cho trang trại này.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-primary-600 font-mono">
                        Năm tài chính: {cycle.fiscalYear}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {cycle.name}
                      </h4>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        cycle.status === 'RUNNING'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : cycle.status === 'PREPARING'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {cycle.status === 'RUNNING'
                        ? 'Đang chạy'
                        : cycle.status === 'PREPARING'
                        ? 'Chuẩn bị'
                        : 'Đã đóng chu kỳ'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Thời gian: <strong>{cycle.startDate}</strong> đến <strong>{cycle.endDate}</strong></div>
                    {cycle.notes && <p className="text-[11px] text-slate-400 italic">{cycle.notes}</p>}
                  </div>

                  {canManage && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                      <select
                        value={cycle.status}
                        onChange={(e) =>
                          updateCycleStatusMutation.mutate({ cycleId: cycle.id, status: e.target.value })
                        }
                        className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none"
                      >
                        <option value="PREPARING">Chuẩn bị</option>
                        <option value="RUNNING">Đang chạy</option>
                        <option value="CLOSED">Đóng chu kỳ</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CẤU HÌNH VẬN HÀNH */}
      {activeTab === 'settings' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary-600" />
                <span>Cấu hình Tham số Vận hành Riêng</span>
              </h2>
              <p className="text-xs text-slate-400">
                Các ngưỡng tự động kích hoạt tưới tiêu và phân ca kíp làm việc ngoài hiện trường.
              </p>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() => saveSettingsMutation.mutate()}
                disabled={saveSettingsMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm min-h-[44px]"
              >
                <span>{saveSettingsMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Khối Tưới tiêu */}
            <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-600" />
                <span>Ngưỡng Tưới tiêu Tự động (IoT)</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Độ ẩm đất tối thiểu kích hoạt tưới (%)
                  </label>
                  <input
                    type="number"
                    value={moistureMin}
                    onChange={(e) => setMoistureMin(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Độ ẩm đất mục tiêu ngắt tưới (%)
                  </label>
                  <input
                    type="number"
                    value={moistureMax}
                    onChange={(e) => setMoistureMax(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nhiệt độ tối đa bật quạt làm mát (°C)
                  </label>
                  <input
                    type="number"
                    value={tempMax}
                    onChange={(e) => setTempMax(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Khối Ca Kíp */}
            <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Khung Giờ Ca Làm Việc Hiện Trường</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ca sáng ngoài đồng ruộng
                  </label>
                  <input
                    type="text"
                    value={morningShift}
                    onChange={(e) => setMorningShift(e.target.value)}
                    placeholder="06:00-10:30"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ca chiều ngoài đồng ruộng
                  </label>
                  <input
                    type="text"
                    value={afternoonShift}
                    onChange={(e) => setAfternoonShift(e.target.value)}
                    placeholder="14:00-17:30"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA PHÂN KHU */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-600" />
                <span>{editingZone ? 'Chỉnh sửa Phân khu' : 'Tạo Phân khu Mới'}</span>
              </h3>
              <button
                onClick={() => setIsZoneModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={zoneForm.handleSubmit(onSubmitZone)} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã phân khu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!!editingZone}
                    {...zoneForm.register('code')}
                    placeholder="VD: ZONE-A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-mono uppercase"
                  />
                  {zoneForm.formState.errors.code && (
                    <p className="text-red-500 mt-1">{zoneForm.formState.errors.code.message}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên phân khu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...zoneForm.register('name')}
                    placeholder="VD: Nhà màng Dưa lưới A1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  />
                  {zoneForm.formState.errors.name && (
                    <p className="text-red-500 mt-1">{zoneForm.formState.errors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Loại phân khu
                  </label>
                  <select
                    {...zoneForm.register('zoneType')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  >
                    <option value="NHA_MANG">Nhà màng / Nhà kính</option>
                    <option value="DONG_RUONG">Đồng ruộng / Bãi mở</option>
                    <option value="CHUONG_TRAI">Chuồng trại gia súc</option>
                    <option value="KHO">Kho vật tư / Bảo quản</option>
                    <option value="HO_CHUA">Hồ chứa / Trạm bơm</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Diện tích (m²) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...zoneForm.register('areaM2')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-mono"
                  />
                  {zoneForm.formState.errors.areaM2 && (
                    <p className="text-red-500 mt-1">{zoneForm.formState.errors.areaM2.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Loại đất canh tác
                  </label>
                  <input
                    type="text"
                    {...zoneForm.register('soilType')}
                    placeholder="Đất đỏ bazan, đất phù sa"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nguồn nước tưới
                  </label>
                  <input
                    type="text"
                    {...zoneForm.register('waterSource')}
                    placeholder="Giếng khoan, hồ lắng RO"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trạng thái khu vực
                </label>
                <select
                  {...zoneForm.register('status')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                >
                  <option value="ACTIVE">Sẵn sàng</option>
                  <option value="CULTIVATING">Đang canh tác</option>
                  <option value="ISOLATING">Cách ly xử lý đất</option>
                  <option value="DISINFECTING">Đang khử trùng</option>
                  <option value="INACTIVE">Tạm dừng</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsZoneModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 min-h-[44px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createZoneMutation.isPending || updateZoneMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm min-h-[44px]"
                >
                  {editingZone ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM VỊ TRÍ / Ô CON */}
      {isLocationModalOpen && selectedZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Grid className="w-4 h-4 text-primary-600" />
                <span>Thêm Ô / Vị trí nhỏ</span>
              </h3>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={locationForm.handleSubmit(onSubmitLocation)} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mã ô / vị trí <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...locationForm.register('code')}
                  placeholder="VD: O-01"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên hiển thị <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...locationForm.register('name')}
                  placeholder="VD: Ô trồng hàng A"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Loại vị trí
                </label>
                <select
                  {...locationForm.register('locationType')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                >
                  <option value="O_DAT">Ô đất nhỏ</option>
                  <option value="LUONG_RAU">Luống rau</option>
                  <option value="CHUONG_NUOI">Chuồng nuôi</option>
                  <option value="DAY_CHUONG">Dãy chuồng</option>
                  <option value="NGAN_KHO">Ngăn kệ kho</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Diện tích (m²)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...locationForm.register('areaM2')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sức chứa (con/cây)
                  </label>
                  <input
                    type="number"
                    {...locationForm.register('capacity')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs min-h-[44px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createLocationMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm min-h-[44px]"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PHÂN CÔNG NHÂN SỰ */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary-600" />
                <span>Phân công Nhân sự Phụ trách Farm</span>
              </h3>
              <button
                onClick={() => setIsAssignmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={assignmentForm.handleSubmit(onSubmitAssignment)} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ID Nhân viên / Tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...assignmentForm.register('userId')}
                  placeholder="Nhập ID người dùng (User ID)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-mono"
                />
                {assignmentForm.formState.errors.userId && (
                  <p className="text-red-500 mt-1">{assignmentForm.formState.errors.userId.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chức danh đảm nhiệm tại Farm
                </label>
                <select
                  {...assignmentForm.register('roleInFarm')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                >
                  <option value="FARM_MANAGER">Trưởng trang trại (Farm Manager)</option>
                  <option value="CHIEF_TECHNICIAN">Kỹ thuật viên trưởng (Chief Tech)</option>
                  <option value="VETERINARIAN">Bác sĩ thú y (Veterinarian)</option>
                  <option value="WAREHOUSE_SUPERVISOR">Thủ kho trang trại (Warehouse Supervisor)</option>
                  <option value="FIELD_LEAD">Tổ trưởng hiện trường (Field Lead)</option>
                  <option value="WORKER">Nhân viên nông trại (Worker)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...assignmentForm.register('assignedFrom')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    {...assignmentForm.register('assignedTo')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssignmentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs min-h-[44px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createAssignmentMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm min-h-[44px]"
                >
                  Phân công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MỞ CHU KỲ VẬN HÀNH MỚI */}
      {isCycleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-600" />
                <span>Mở Chu kỳ Vận hành Mới</span>
              </h3>
              <button
                onClick={() => setIsCycleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={cycleForm.handleSubmit(onSubmitCycle)} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên chu kỳ vận hành <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...cycleForm.register('name')}
                  placeholder="VD: Mùa Vụ Đông Xuân 2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Năm tài chính <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...cycleForm.register('fiscalYear')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...cycleForm.register('startDate')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...cycleForm.register('endDate')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú chu kỳ
                </label>
                <textarea
                  rows={2}
                  {...cycleForm.register('notes')}
                  placeholder="Mục tiêu sản lượng, định hướng quy hoạch..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCycleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs min-h-[44px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createCycleMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm min-h-[44px]"
                >
                  Mở chu kỳ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
