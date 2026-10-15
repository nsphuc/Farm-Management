import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Layers,
  Grid3X3,
  MapPin,
  Compass,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Maximize2,
  Wheat,
  Beef,
  Sprout,
  Fish,
  AlertTriangle,
  CheckCircle2,
  Info,
  Droplet,
  Mountain,
  QrCode,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Can } from '../../../permissions/Can';
import { farmApi } from '../../../services/farmApi';
import { FarmFormModal } from './FarmFormModal';
import { ZoneFormModal } from '../zones/ZoneFormModal';
import { LocationFormModal } from '../zones/LocationFormModal';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { toast } from '../../../store/ui/useToastStore';

/**
 * Trang Chi tiết Trang trại (Chức năng 1.2.3 trong Sơ đồ phân cấp).
 * Tích hợp điều hướng tab:
 * - Tab 1: 1.2. Thông tin chung & GPS
 * - Tab 2: 1.3. Khu vực & Địa điểm sản xuất (ProductionZone 1.3.1 & ZoneLocation 1.3.2/1.3.3)
 * - Tab 3: 1.3.4. Bản đồ & Sơ đồ phân bổ
 */
export const FarmDetailPage = () => {
  const { id: farmId } = useParams();
  const navigate = useNavigate();

  // State dữ liệu trang trại
  const [farm, setFarm] = useState(null);
  const [zones, setZones] = useState([]);
  const [locationsMap, setLocationsMap] = useState({}); // { [zoneId]: locations[] }
  const [activeZoneId, setActiveZoneId] = useState(null);

  // State tải & lỗi
  const [isLoading, setIsLoading] = useState(true);
  const [isZonesLoading, setIsZonesLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tab hiện tại: 'info' | 'zones' | 'map'
  const [activeTab, setActiveTab] = useState('zones');

  // Modals
  const [isEditFarmOpen, setIsEditFarmOpen] = useState(false);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Confirm delete dialogs
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: null, // 'farm' | 'zone' | 'location'
    targetId: null,
    parentId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Tải chi tiết trang trại
  const fetchFarmDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await farmApi.getFarmById(farmId);
      setFarm(res.data);
    } catch (err) {
      console.error('Lỗi khi tải thông tin trang trại:', err);
      setError(
        err.response?.data?.message ||
          'Không tìm thấy thông tin trang trại hoặc bạn không có quyền truy cập.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [farmId]);

  // 2. Tải danh sách phân khu thuộc trang trại
  const fetchZones = useCallback(async () => {
    if (!farmId) return;
    setIsZonesLoading(true);
    try {
      const res = await farmApi.getZonesByFarm(farmId);
      const zonesData = res.data || [];
      setZones(zonesData);
      if (zonesData.length > 0 && !activeZoneId) {
        setActiveZoneId(zonesData[0].id);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách phân khu:', err);
      toast.error('Không thể tải danh sách phân khu sản xuất');
    } finally {
      setIsZonesLoading(false);
    }
  }, [farmId, activeZoneId]);

  // 3. Tải danh sách vị trí con của phân khu đang chọn
  const fetchLocationsForZone = useCallback(
    async (zoneId) => {
      if (!farmId || !zoneId) return;
      try {
        const res = await farmApi.getLocationsByZone(farmId, zoneId);
        setLocationsMap((prev) => ({ ...prev, [zoneId]: res.data || [] }));
      } catch (err) {
        console.error('Lỗi tải vị trí phân khu:', err);
      }
    },
    [farmId]
  );

  useEffect(() => {
    fetchFarmDetails();
  }, [fetchFarmDetails]);

  useEffect(() => {
    if (farm) {
      fetchZones();
    }
  }, [farm, fetchZones]);

  useEffect(() => {
    if (activeZoneId) {
      fetchLocationsForZone(activeZoneId);
    }
  }, [activeZoneId, fetchLocationsForZone]);

  // Tính tổng diện tích đã phân bổ cho các phân khu
  const allocatedArea = useMemo(() => {
    return zones.reduce((sum, z) => sum + (Number(z.areaM2) || 0), 0);
  }, [zones]);

  const remainingArea = useMemo(() => {
    if (!farm) return 0;
    return Math.max(0, Number(farm.totalAreaM2 || 0) - allocatedArea);
  }, [farm, allocatedArea]);

  // Xử lý Xóa / Bảo trì
  const handleConfirmAction = async () => {
    setIsDeleting(true);
    try {
      if (confirmDialog.type === 'zone') {
        await farmApi.deleteZone(farmId, confirmDialog.targetId);
        toast.success('Đã chuyển phân khu sang trạng thái bảo trì');
        fetchZones();
      } else if (confirmDialog.type === 'location') {
        await farmApi.deleteLocation(
          farmId,
          confirmDialog.parentId,
          confirmDialog.targetId
        );
        toast.success('Đã chuyển vị trí sang trạng thái bảo trì');
        fetchLocationsForZone(confirmDialog.parentId);
      } else if (confirmDialog.type === 'farm') {
        await farmApi.deleteFarm(farmId);
        toast.success('Đã ngừng hoạt động trang trại');
        navigate('/farms');
      }
      setConfirmDialog({ isOpen: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderZoneTypeBadge = (type) => {
    const map = {
      GREENHOUSE: { label: 'Nhà màng / Nhà kính', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      OPEN_FIELD: { label: 'Đồng ruộng mở', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      BARN: { label: 'Chuồng trại chăn nuôi', color: 'bg-orange-50 text-orange-700 border-orange-200' },
      POND: { label: 'Ao hồ thủy sản', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
      STORAGE: { label: 'Khu sơ chế / Kho', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      ISOLATION: { label: 'Khu cách ly dịch bệnh', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    };
    const item = map[type] || { label: type, color: 'bg-slate-100 text-slate-700' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.color}`}>
        {item.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
        <p className="text-sm text-slate-600 font-medium">Đang tải thông tin chi tiết trang trại...</p>
      </div>
    );
  }

  if (error || !farm) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center text-rose-800">
        <AlertTriangle className="w-12 h-12 mx-auto text-rose-500 mb-3" />
        <h3 className="text-lg font-bold">Không thể truy cập trang trại</h3>
        <p className="text-sm text-rose-600 mt-1 max-w-md mx-auto">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/farms')}
          className="mt-5 border-rose-300 text-rose-700 hover:bg-rose-100"
        >
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const activeZone = zones.find((z) => z.id === activeZoneId);
  const activeLocations = activeZoneId ? locationsMap[activeZoneId] || [] : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Breadcrumb */}
      <div className="flex flex-col gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Link to="/farms" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> 1.2. Danh mục trang trại
          </Link>
          <span>/</span>
          <span className="text-emerald-700">{farm.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                  {farm.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {farm.code}
                </span>
                <Badge variant={farm.status === 'ACTIVE' ? 'success' : 'default'}>
                  {farm.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{farm.address || 'Chưa cập nhật địa chỉ hành chính'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Can permission="PERM_FARM_UPDATE">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditFarmOpen(true)}
                className="gap-1.5 bg-white shadow-sm"
              >
                <Edit className="w-4 h-4 text-slate-500" />
                <span>1.2.4. Sửa</span>
              </Button>
            </Can>

            <Can permission="PERM_FARM_UPDATE">
              {farm.status !== 'INACTIVE' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setConfirmDialog({
                      isOpen: true,
                      title: '1.2.5. Xác nhận ngừng hoạt động',
                      message: `Hệ thống sẽ cập nhật trạng thái trang trại "${farm.name}" sang INACTIVE và giữ nguyên toàn bộ lịch sử mùa vụ/kho.`,
                      type: 'farm',
                      targetId: farm.id,
                    })
                  }
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </Can>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'zones'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1.3. Phân khu & Vị trí sản xuất</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'zones' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-700'
            }`}>
              {zones.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'info'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>1.2. Thông tin chung & Tọa độ GPS</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'map'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>1.3.4. Bản đồ & Sơ đồ mặt bằng</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: PHÂN KHU & ĐỊA ĐIỂM SẢN XUẤT (1.3)
      ========================================================================= */}
      {activeTab === 'zones' && (
        <div className="space-y-6">
          {/* Header phân khu & nút Thêm Zone */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                1.3.1. Danh Sách Phân Khu Sản Xuất
              </h2>
              <p className="text-xs text-slate-500">
                Nhà màng, nhà kính, đồng ruộng mở hoặc chuồng trại chăn nuôi trực thuộc trang trại
              </p>
            </div>

            {/* Dùng component Can để ẩn nút Thêm Zone nếu không có quyền PERM_ZONE_MANAGE */}
            <Can permission="PERM_ZONE_MANAGE">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedZone(null);
                  setIsZoneModalOpen(true);
                }}
                className="gap-2 bg-sky-600 hover:bg-sky-700 focus:ring-sky-500 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm phân khu mới</span>
              </Button>
            </Can>
          </div>

          {/* Danh sách phân khu */}
          {isZonesLoading ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Đang tải danh sách phân khu...</p>
            </div>
          ) : zones.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">Trang trại chưa có phân khu sản xuất nào</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Bấm vào nút "Thêm phân khu mới" phía trên để thiết lập nhà màng, nhà kính hoặc chuồng trại.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cột trái (1 phần): Danh sách thẻ phân khu */}
              <div className="lg:col-span-1 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
                  Chọn phân khu để xem vị trí canh tác ({zones.length})
                </p>
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {zones.map((zone) => {
                    const isSelected = zone.id === activeZoneId;
                    return (
                      <div
                        key={zone.id}
                        onClick={() => setActiveZoneId(zone.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {zone.code}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
                              {zone.name}
                            </h3>
                          </div>
                          <Badge variant={zone.status === 'ACTIVE' ? 'success' : 'warning'}>
                            {zone.status}
                          </Badge>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                          <div>{renderZoneTypeBadge(zone.zoneType)}</div>
                          <span className="font-semibold text-slate-800">
                            {Number(zone.areaM2).toLocaleString('vi-VN')} m²
                          </span>
                        </div>

                        {/* Thao tác Zone */}
                        <div
                          className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Can permission="PERM_ZONE_MANAGE">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedZone(zone);
                                setIsZoneModalOpen(true);
                              }}
                              className="h-7 px-2 text-xs text-slate-600 hover:text-amber-600"
                            >
                              <Edit className="w-3.5 h-3.5 mr-1" /> Sửa
                            </Button>
                          </Can>

                          <Can permission="PERM_ZONE_MANAGE">
                            {zone.status !== 'MAINTENANCE' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: 'Đưa phân khu vào bảo trì',
                                    message: `Hệ thống sẽ chuyển phân khu "${zone.name}" sang trạng thái MAINTENANCE (không xóa vật lý).`,
                                    type: 'zone',
                                    targetId: zone.id,
                                  })
                                }
                                className="h-7 px-2 text-xs text-slate-500 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Bảo trì
                              </Button>
                            )}
                          </Can>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cột phải (2 phần): Chi tiết phân khu được chọn & Danh sách Vị trí con (1.3.2/1.3.3) */}
              <div className="lg:col-span-2 space-y-5">
                {activeZone ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                    {/* Header thông tin phân khu đang chọn */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                            {activeZone.code}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900">{activeZone.name}</h3>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                            {Number(activeZone.areaM2).toLocaleString('vi-VN')} m²
                          </span>
                          {activeZone.soilType && (
                            <span className="flex items-center gap-1">
                              <Mountain className="w-3.5 h-3.5 text-slate-400" /> {activeZone.soilType}
                            </span>
                          )}
                          {activeZone.waterSource && (
                            <span className="flex items-center gap-1">
                              <Droplet className="w-3.5 h-3.5 text-slate-400" /> {activeZone.waterSource}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Nút Thêm Vị Trí Mới (1.3.2 / 1.3.3) */}
                      <Can permission="PERM_ZONE_MANAGE">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedLocation(null);
                            setIsLocationModalOpen(true);
                          }}
                          className="gap-1.5 bg-violet-600 hover:bg-violet-700 focus:ring-violet-500"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Thêm vị trí (Luống/Ô/Chuồng)</span>
                        </Button>
                      </Can>
                    </div>

                    {/* Danh sách các vị trí chi tiết */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                          <Grid3X3 className="w-4 h-4 text-violet-600" />
                          <span>1.3.2 / 1.3.3. Các vị trí canh tác chi tiết ({activeLocations.length})</span>
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Định vị phục vụ in tem QR Code & Ghi nhật ký
                        </span>
                      </div>

                      {activeLocations.length === 0 ? (
                        <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                          <Grid3X3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-slate-700">Chưa có vị trí chi tiết nào</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Khai báo các luống rau, giàn thủy canh hoặc dãy chuồng để quản lý sản xuất.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activeLocations.map((loc) => (
                            <div
                              key={loc.id}
                              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-violet-300 shadow-sm flex flex-col justify-between"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-[11px] font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                                    {loc.code}
                                  </span>
                                  <h5 className="text-sm font-bold text-slate-900 mt-1.5">{loc.name}</h5>
                                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                    {loc.description || 'Không có mô tả'}
                                  </p>
                                </div>
                                <Badge variant={loc.status === 'ACTIVE' ? 'success' : 'warning'}>
                                  {loc.status}
                                </Badge>
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <QrCode className="w-3.5 h-3.5 text-slate-400" /> Sẵn sàng gán QR
                                </span>
                                <div className="flex items-center gap-1">
                                  <Can permission="PERM_ZONE_MANAGE">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedLocation(loc);
                                        setIsLocationModalOpen(true);
                                      }}
                                      className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600"
                                      title="Cập nhật vị trí"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                  </Can>
                                  <Can permission="PERM_ZONE_MANAGE">
                                    {loc.status !== 'MAINTENANCE' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          setConfirmDialog({
                                            isOpen: true,
                                            title: 'Đưa vị trí vào bảo trì',
                                            message: `Hệ thống sẽ chuyển vị trí "${loc.name}" sang trạng thái MAINTENANCE (không xóa vật lý).`,
                                            type: 'location',
                                            targetId: loc.id,
                                            parentId: activeZone.id,
                                          })
                                        }
                                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                                        title="Bảo trì vị trí"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                  </Can>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
                    Chọn một phân khu bên trái để xem danh sách vị trí chi tiết.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: THÔNG TIN CHUNG & TỌA ĐỘ GPS (1.2.6, 1.2.7, 1.2.8)
      ========================================================================= */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Thông tin cơ sở */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Hồ sơ cơ sở trang trại</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Mã định danh trang trại:</span>
                <span className="font-mono font-bold text-slate-900">{farm.code}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Tên cơ sở sản xuất:</span>
                <span className="font-semibold text-slate-900">{farm.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">1.2.8. Loại hình sản xuất:</span>
                <span className="font-semibold text-slate-900">{farm.farmType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Trạng thái vận hành:</span>
                <span>{farm.status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Thời gian khởi tạo:</span>
                <span className="text-slate-700">
                  {farm.createdAt ? new Date(farm.createdAt).toLocaleDateString('vi-VN') : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Card Địa lý & Diện tích */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Compass className="w-5 h-5 text-sky-600" />
              <span>1.2.6 & 1.2.7. Địa giới & Diện tích</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Tổng diện tích mặt bằng:</span>
                <span className="font-bold text-slate-900">
                  {Number(farm.totalAreaM2).toLocaleString('vi-VN')} m²
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Diện tích phân khu đã chia:</span>
                <span className="font-semibold text-sky-700">
                  {Number(allocatedArea).toLocaleString('vi-VN')} m²
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Diện tích còn trống:</span>
                <span className="font-semibold text-emerald-700">
                  {Number(remainingArea).toLocaleString('vi-VN')} m²
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Tọa độ GPS (Vĩ độ, Kinh độ):</span>
                <span className="font-mono text-slate-700">
                  {farm.latitude && farm.longitude
                    ? `${Number(farm.latitude).toFixed(6)}, ${Number(farm.longitude).toFixed(6)}`
                    : 'Chưa cập nhật'}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 block mb-1">Địa chỉ chi tiết:</span>
                <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {farm.address || 'Chưa cập nhật địa chỉ'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: BẢN ĐỒ & SƠ ĐỒ MẶT BẰNG (1.3.4)
      ========================================================================= */}
      {activeTab === 'map' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                1.3.4. Sơ Đồ Phân Bổ Diện Tích & Tọa Độ Vị Trí
              </h3>
              <p className="text-xs text-slate-500">
                Tỷ lệ diện tích phân khu trên tổng diện tích {Number(farm.totalAreaM2).toLocaleString('vi-VN')} m²
              </p>
            </div>
          </div>

          {/* Thanh phân bổ diện tích trực quan */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>Đã phân bổ: {((allocatedArea / (Number(farm.totalAreaM2) || 1)) * 100).toFixed(1)}%</span>
              <span>Còn lại: {((remainingArea / (Number(farm.totalAreaM2) || 1)) * 100).toFixed(1)}%</span>
            </div>
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              {zones.map((zone, idx) => {
                const pct = (Number(zone.areaM2) / (Number(farm.totalAreaM2) || 1)) * 100;
                const colors = ['bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-violet-500', 'bg-cyan-500', 'bg-rose-500'];
                return (
                  <div
                    key={zone.id}
                    style={{ width: `${pct}%` }}
                    className={`${colors[idx % colors.length]} transition-all`}
                    title={`${zone.name}: ${Number(zone.areaM2).toLocaleString('vi-VN')} m² (${pct.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
          </div>

          {/* Danh sách phân bổ chi tiết */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {zones.map((zone, idx) => {
              const pct = (Number(zone.areaM2) / (Number(farm.totalAreaM2) || 1)) * 100;
              const dots = ['bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-violet-500', 'bg-cyan-500', 'bg-rose-500'];
              return (
                <div key={zone.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${dots[idx % dots.length]}`} />
                    <span className="text-xs font-semibold text-slate-800 truncate">{zone.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 shrink-0 ml-2">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Box định vị GPS */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Compass className="w-4 h-4" />
                <span>Tọa độ vệ tinh định danh trang trại</span>
              </div>
              <p className="text-xl font-mono font-bold">
                {farm.latitude && farm.longitude
                  ? `${Number(farm.latitude).toFixed(6)}° N, ${Number(farm.longitude).toFixed(6)}° E`
                  : 'Chưa cấu hình tọa độ GPS'}
              </p>
              <p className="text-xs text-slate-400">
                Phục vụ định vị bản đồ GIS, thiết lập bán kính geofencing cho chấm công hiện trường
              </p>
            </div>
            {farm.latitude && farm.longitude && (
              <a
                href={`https://www.google.com/maps?q=${farm.latitude},${farm.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shrink-0 transition-all shadow-md"
              >
                <span>Mở Google Maps</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Modal Cập nhật Trang trại */}
      <FarmFormModal
        isOpen={isEditFarmOpen}
        farm={farm}
        onClose={() => setIsEditFarmOpen(false)}
        onSuccess={() => fetchFarmDetails()}
      />

      {/* Modal Thêm/Sửa Phân khu */}
      <ZoneFormModal
        isOpen={isZoneModalOpen}
        farmId={farm.id}
        zone={selectedZone}
        onClose={() => setIsZoneModalOpen(false)}
        onSuccess={() => fetchZones()}
      />

      {/* Modal Thêm/Sửa Vị trí */}
      <LocationFormModal
        isOpen={isLocationModalOpen}
        farmId={farm.id}
        zoneId={activeZoneId}
        location={selectedLocation}
        onClose={() => setIsLocationModalOpen(false)}
        onSuccess={() => fetchLocationsForZone(activeZoneId)}
      />

      {/* Confirm Dialog Xóa/Bảo trì */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Xác nhận"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmDialog({ isOpen: false })}
      />
    </div>
  );
};

export default FarmDetailPage;
