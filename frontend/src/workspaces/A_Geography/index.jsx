import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Plus,
  Building,
  Layers,
  Edit2,
  Trash2,
  Users,
  Compass,
  Maximize2,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  AlertOctagon,
  Phone,
  UserCheck,
  RefreshCw,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { geographyService } from '@/services/modules/geographyService';
import { employeeService } from '@/services/modules/employeeService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SmartEmptyState } from '@/components/common/SmartEmptyState';
import { Can } from '@/components/common/Can';
import { MasterGeographicTree } from './components/MasterGeographicTree';
import { FarmFormModal } from './components/FarmFormModal';
import { ZoneFormModal } from './components/ZoneFormModal';
import { LocationFormModal } from './components/LocationFormModal';
import { AssignmentModal } from './components/AssignmentModal';
import { StaffAssignmentPane } from './components/StaffAssignmentPane';
import { GeoJsonPolygonEditor } from './components/GeoJsonPolygonEditor';
import { formatArea } from '@/utils/formatters';
import { extractApiErrors } from '@/utils/apiHelpers';

export function GeographyWorkspace() {
  const navigate = useNavigate();
  const { activeFarmId, setActiveFarmId, activeZoneId, setActiveZoneId, syncTrigger, notifyDataChanged } = useActiveFarmStore();
  const { userInfo, isOwner, isFarmManager, isTechnicalLead, isWarehouseKeeper } = useAuthStore();
  const owner = isOwner();
  const farmManager = isFarmManager();
  const techLead = isTechnicalLead();
  const whKeeper = isWarehouseKeeper();

  const [farms, setFarms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Selected node on Tree
  const [selectedNode, setSelectedNode] = useState(null);

  // Current selections
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneLocations, setZoneLocations] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // Modals state
  const [farmModalOpen, setFarmModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);

  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // 1. Fetch entire geographic hierarchy: Farms -> Zones -> Locations
  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const farmsRes = await geographyService.getFarms();
      const farmList = Array.isArray(farmsRes) ? farmsRes : farmsRes?.content || [];

      // For each farm, fetch its zones and locations to populate the 3-tier tree
      const fullFarms = await Promise.all(
        farmList.map(async (f) => {
          try {
            const zonesRes = await geographyService.getZones(f.id);
            const zList = Array.isArray(zonesRes) ? zonesRes : zonesRes?.content || [];

            const zonesWithLocations = await Promise.all(
              zList.map(async (z) => {
                try {
                  const locsRes = await geographyService.getLocations(f.id, z.id);
                  const locList = Array.isArray(locsRes) ? locsRes : locsRes?.content || [];
                  return { ...z, locations: locList };
                } catch {
                  return { ...z, locations: [] };
                }
              })
            );

            return { ...f, zones: zonesWithLocations };
          } catch {
            return { ...f, zones: [] };
          }
        })
      );

      setFarms(fullFarms);

      // Default selection: if activeFarmId exists, find it, else take first farm
      const currentFarm = (activeFarmId && activeFarmId !== 'ALL')
        ? fullFarms.find((f) => Number(f.id) === Number(activeFarmId)) || fullFarms[0] || null
        : fullFarms[0] || null;

      if (currentFarm) {
        setSelectedFarm(currentFarm);
        if (!selectedNode || selectedNode.type === 'FARM') {
          setSelectedNode({ type: 'FARM', item: currentFarm });
        }
      }
    } catch (err) {
      console.error('Failed to load geographic hierarchy', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch active employees for manager dropdown and assignments
  const fetchEmployees = async () => {
    try {
      const res = await employeeService.getEmployees({ size: 100 });
      setEmployees(res?.content || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  };

  // 3. Fetch assignments for active farm
  const fetchAssignments = async (farmId) => {
    if (!farmId) return;
    try {
      const res = await geographyService.getAssignments(farmId);
      setAssignments(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load assignments', err);
    }
  };

  // 4. Fetch locations for selected zone
  const fetchLocations = async (farmId, zoneId) => {
    if (!farmId || !zoneId) return;
    try {
      const res = await geographyService.getLocations(farmId, zoneId);
      setZoneLocations(Array.isArray(res) ? res : res?.content || []);
    } catch (err) {
      console.error('Failed to load zone locations', err);
    }
  };

  useEffect(() => {
    fetchHierarchy();
    fetchEmployees();
  }, [syncTrigger?.farms, syncTrigger?.zones]);

  // Tự động đồng bộ chọn farm trên giao diện khi activeFarmId thay đổi từ TopBar
  useEffect(() => {
    if (activeFarmId && activeFarmId !== 'ALL' && farms.length > 0) {
      const match = farms.find((f) => Number(f.id) === Number(activeFarmId));
      if (match && selectedFarm?.id !== match.id) {
        setSelectedFarm(match);
        setSelectedZone(null);
        setSelectedNode({ type: 'FARM', item: match });
      }
    }
  }, [activeFarmId, farms]);

  useEffect(() => {
    if (selectedFarm?.id) {
      fetchAssignments(selectedFarm.id);
    }
  }, [selectedFarm?.id, syncTrigger?.employees]);

  useEffect(() => {
    if (selectedFarm?.id && selectedZone?.id) {
      fetchLocations(selectedFarm.id, selectedZone.id);
    }
  }, [selectedFarm?.id, selectedZone?.id, syncTrigger?.zones]);

  // Handle tree node selection
  const handleSelectNode = ({ type, item, farm, zone }) => {
    setSelectedNode({ type, item });
    if (type === 'FARM') {
      setSelectedFarm(item);
      setSelectedZone(null);
    } else if (type === 'ZONE') {
      setSelectedFarm(farm);
      setSelectedZone(item);
    } else if (type === 'LOCATION') {
      setSelectedFarm(farm);
      setSelectedZone(zone);
    }
  };

  // Mở modal thêm trang trại mới (kèm kiểm tra hạn mức gói thuê bao)
  const handleOpenCreateFarm = () => {
    const maxFarms = userInfo?.maxFarms || userInfo?.subscription?.maxFarms;
    if (maxFarms && farms.length >= maxFarms) {
      toast.error(`Số lượng trang trại đã đạt hạn mức tối đa của gói dịch vụ (${farms.length}/${maxFarms}). Vui lòng nâng cấp gói thuê bao!`);
      return;
    }
    setEditingFarm(null);
    setFarmModalOpen(true);
  };

  // Tạm ngưng hoặc kích hoạt trang trại (thay cho xóa cứng)
  const handleToggleFarmStatus = async (farm, newStatus) => {
    const isActivating = newStatus === 'ACTIVE';
    const actionLabel = isActivating ? 'Kích hoạt' : 'Tạm ngưng hoạt động';
    if (!window.confirm(`Xác nhận ${actionLabel.toLowerCase()} trang trại "${farm.name}"?`)) {
      return;
    }
    try {
      await geographyService.updateFarm(farm.id, {
        code: farm.code,
        name: farm.name,
        farmType: farm.farmType,
        totalAreaM2: farm.totalAreaM2,
        latitude: farm.latitude,
        longitude: farm.longitude,
        geofenceRadiusM: farm.geofenceRadiusM,
        address: farm.address,
        managerUserId: farm.managerUserId,
        status: newStatus,
      });
      toast.success(`Đã ${actionLabel.toLowerCase()} trang trại "${farm.name}" thành công!`);
      notifyDataChanged?.('farms');
      await fetchHierarchy();
      setSelectedFarm((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (err) {
      const errInfo = extractApiErrors(err);
      toast.error(errInfo.message || `Không thể ${actionLabel.toLowerCase()} trang trại!`);
    }
  };

  // Delete farm (chỉ dùng khi dự phòng)
  const handleDeleteFarm = async (farmId) => {
    if (!window.confirm('CẢNH BÁO: Xóa trang trại sẽ làm mất toàn bộ mặt bằng liên quan. Tiếp tục?')) {
      return;
    }
    try {
      await geographyService.deleteFarm?.(farmId);
      notifyDataChanged?.('farms');
      fetchHierarchy();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      toast.error(errInfo.message || 'Không thể xóa trang trại đã phát sinh giao dịch!');
    }
  };

  // Delete zone
  const handleDeleteZone = async (farmId, zoneId) => {
    if (!window.confirm('Bạn có chắc muốn xóa phân khu này?')) return;
    try {
      await geographyService.deleteZone(farmId, zoneId);
      notifyDataChanged?.('zones');
      fetchHierarchy();
      setSelectedZone(null);
      setSelectedNode({ type: 'FARM', item: selectedFarm });
    } catch (err) {
      const errInfo = extractApiErrors(err);
      toast.error(errInfo.message || 'Không thể xóa phân khu đã phát sinh dữ liệu!');
    }
  };

  // Delete location
  const handleDeleteLocation = async (locId) => {
    if (!window.confirm('Bạn có chắc muốn xóa vị trí / luống này?')) return;
    try {
      await geographyService.deleteLocation(selectedFarm.id, selectedZone.id, locId);
      notifyDataChanged?.('zones');
      fetchLocations(selectedFarm.id, selectedZone.id);
      fetchHierarchy();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      toast.error(errInfo.message || 'Không thể xóa vị trí đã phát sinh lịch sử nhật ký!');
    }
  };

  // Delete assignment
  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Bạn có chắc muốn hủy phân công cán bộ này?')) return;
    try {
      await geographyService.deleteAssignment(selectedFarm.id, assignmentId);
      notifyDataChanged?.('employees');
      fetchAssignments(selectedFarm.id);
    } catch (err) {
      const errInfo = extractApiErrors(err);
      toast.error(errInfo.message || 'Không thể hủy phân công!');
    }
  };

  // Owner phê duyệt phân khu đề xuất (MAINTENANCE -> ACTIVE)
  const handleApproveZone = async (farmId, zone, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Xác nhận phê duyệt phân khu "${zone.name}" chuyển từ MAINTENANCE sang ACTIVE để đưa vào canh tác?`)) {
      return;
    }
    try {
      await geographyService.updateZone(farmId, zone.id, {
        name: zone.name,
        zoneType: zone.zoneType,
        areaM2: zone.areaM2,
        soilType: zone.soilType,
        waterSource: zone.waterSource,
        mapLayoutJson: zone.mapLayoutJson,
        status: 'ACTIVE',
      });
      toast.success(`Đã phê duyệt và kích hoạt phân khu "${zone.name}" thành công!`);
      notifyDataChanged?.('zones');
      await fetchHierarchy();
      if (selectedZone?.id === zone.id) {
        setSelectedZone((prev) => ({ ...prev, status: 'ACTIVE' }));
      }
    } catch (err) {
      const errInfo = extractApiErrors(err);
      toast.error(errInfo.message || 'Không thể phê duyệt phân khu!');
    }
  };

  // Owner từ chối đề xuất phân khu (chuyển sang FALLOW hoặc hủy)
  const handleRejectZone = async (farmId, zone, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Xác nhận từ chối đề xuất phân khu "${zone.name}"? Phân khu sẽ chuyển về trạng thái FALLOW (đất nghỉ).`)) {
      return;
    }
    try {
      await geographyService.updateZone(farmId, zone.id, {
        name: zone.name,
        zoneType: zone.zoneType,
        areaM2: zone.areaM2,
        soilType: zone.soilType,
        waterSource: zone.waterSource,
        mapLayoutJson: zone.mapLayoutJson,
        status: 'FALLOW',
      });
      toast.info(`Đã từ chối đề xuất phân khu "${zone.name}". Trạng thái chuyển thành FALLOW.`);
      notifyDataChanged?.('zones');
      await fetchHierarchy();
      if (selectedZone?.id === zone.id) {
        setSelectedZone((prev) => ({ ...prev, status: 'FALLOW' }));
      }
    } catch (err) {
      const errInfo = extractApiErrors(err);
      toast.error(errInfo.message || 'Không thể từ chối phân khu!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Workspace A: Quản Trị Mặt Bằng & Phân Công Hiện Trường
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kiến trúc Master-Detail Split-View: Trang trại (Farms) &rarr; Phân khu (Zones) &rarr; Vị trí (Locations) & Cán bộ phụ trách
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchHierarchy}>
            Làm mới
          </Button>

          {owner && (
            <Can permission="PERM_FARM_CREATE">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={handleOpenCreateFarm}
              >
                + Thêm Trang Trại Mới
              </Button>
            </Can>
          )}
        </div>
      </div>

      {/* MASTER-DETAIL SPLIT-VIEW (2 CỘT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (col-span-4): Master Geographic Tree (3 tầng) */}
        <div className="lg:col-span-4 h-[780px] sticky top-20">
          <MasterGeographicTree
            farms={farms}
            selectedNode={selectedNode}
            onSelectNode={handleSelectNode}
          />
        </div>

        {/* CỘT PHẢI (col-span-8): Detail, GeoJSON Polygon Map & Staff Assignment Pane */}
        <div className="lg:col-span-8 space-y-6">
          {/* TRƯỜNG HỢP 1: ĐANG CHỌN NODE TRANG TRẠI (farms #11) */}
          {selectedNode?.type === 'FARM' && selectedFarm && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Thẻ Thông Số Trang Trại */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">{selectedFarm.name}</h2>
                        <StatusBadge status={selectedFarm.status || 'ACTIVE'} size="sm" />
                      </div>
                      <span className="font-mono text-xs text-slate-500">Mã trại: {selectedFarm.code}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Can permission="PERM_ZONE_MANAGE">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingZone(null);
                          setZoneModalOpen(true);
                        }}
                        icon={<Plus className="h-4 w-4" />}
                      >
                        {farmManager && !owner ? '+ Đề Xuất Thêm Phân Khu Mới' : '+ Thêm Phân Khu Mới'}
                      </Button>
                    </Can>

                    <Can permission="PERM_FARM_UPDATE">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setEditingFarm(selectedFarm);
                          setFarmModalOpen(true);
                        }}
                        icon={<Edit2 className="h-4 w-4" />}
                      >
                        [✏️ Chỉnh Sửa Trang Trại]
                      </Button>
                    </Can>

                    {owner && (
                      <Can permission="PERM_FARM_UPDATE">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleFarmStatus(selectedFarm, selectedFarm.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE')}
                          className={selectedFarm.status === 'ACTIVE' ? 'text-amber-700 border-amber-300 hover:bg-amber-50 font-bold' : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold'}
                          icon={selectedFarm.status === 'ACTIVE' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        >
                          {selectedFarm.status === 'ACTIVE' ? '[🔒 Tạm Ngưng Trang Trại]' : '[🔓 Kích Hoạt Trang Trại]'}
                        </Button>
                      </Can>
                    )}
                  </div>
                </div>

                {/* Banner Thông Tin Giám Đốc Trang Trại (FARM_MANAGER) - Liên kết WS-B */}
                {(() => {
                  const farmManagerEmp = employees.find(
                    (e) => Number(e.userId || e.id) === Number(selectedFarm.managerUserId)
                  );
                  const managerName = farmManagerEmp?.fullName || selectedFarm.managerFullName;
                  const managerCode = farmManagerEmp?.employeeCode || selectedFarm.managerEmployeeCode;
                  const managerPhone = farmManagerEmp?.phone || selectedFarm.managerPhone;

                  return (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-purple-200 bg-purple-50/80 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 shrink-0">
                          <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-purple-900 uppercase tracking-wider">
                            Giám Đốc Điều Hành Trại (FARM_MANAGER)
                          </div>
                          {selectedFarm.managerUserId ? (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-700">
                              <span className="font-bold text-slate-900 text-sm">
                                {managerName || `Cán bộ ID #${selectedFarm.managerUserId}`}
                              </span>
                              <span className="font-mono text-purple-800 bg-purple-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                                Mã NV: {managerCode || 'Đã cấp quyền'}
                              </span>
                              {managerPhone && (
                                <span className="text-slate-600 flex items-center gap-1 font-mono text-[11px]">
                                  <Phone className="h-3 w-3 text-slate-400" />
                                  {managerPhone}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 italic mt-0.5">
                              Chưa có Giám đốc trại phụ trách cơ sở này
                            </div>
                          )}
                        </div>
                      </div>

                      {owner && (
                        <div className="shrink-0">
                          {selectedFarm.managerUserId ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              className="border-purple-300 text-purple-800 hover:bg-purple-100 font-semibold"
                              onClick={() => navigate(`/app/hr?action=appoint&farmId=${selectedFarm.id}`)}
                              icon={<UserCheck className="h-3.5 w-3.5" />}
                            >
                              Thay Đổi / Bổ Nhiệm Lại
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="primary"
                              size="xs"
                              className="bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-xs"
                              onClick={() => navigate(`/app/hr?action=appoint&farmId=${selectedFarm.id}`)}
                              icon={<UserCheck className="h-3.5 w-3.5" />}
                            >
                              [👉 Bổ Nhiệm Giám Đốc Trại Ngay]
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Loại Hình</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedFarm.farmType}</div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Tổng Diện Tích</div>
                    <div className="text-sm font-bold text-emerald-700 mt-0.5 font-mono">
                      {formatArea(selectedFarm.totalAreaM2)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Hàng Rào Geofence</div>
                    <div className="text-sm font-bold text-blue-700 mt-0.5 font-mono">
                      {selectedFarm.geofenceRadiusM || 300} mét
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Số Phân Khu</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                      {selectedFarm.zones?.length || 0} khu
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-700">Tọa độ tâm GPS:</span>{' '}
                    <span className="font-mono text-slate-900">
                      {selectedFarm.latitude || '10.772500'}, {selectedFarm.longitude || '106.681200'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Địa chỉ:</span>{' '}
                    <span>{selectedFarm.address || 'Chưa thiết lập địa chỉ chi tiết'}</span>
                  </div>
                </div>
              </div>

              {/* KHUNG NỔI BẬT DÀNH CHO OWNER: Yêu cầu mở Phân khu mới từ Giám đốc trại */}
              {owner && selectedFarm.zones?.some((z) => z.status === 'MAINTENANCE') && (
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/95 p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 ring-1 ring-amber-300">
                      <AlertOctagon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-950">
                        Yêu Cầu Mở Phân Khu Mới Từ Giám Đốc Trại ({selectedFarm.zones.filter((z) => z.status === 'MAINTENANCE').length} đề xuất đang chờ Owner duyệt)
                      </h3>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Giám đốc điều hành trại đề xuất tạo phân khu mới. Chủ đầu tư (Owner) kiểm tra thông số và quyết định phê duyệt hoặc từ chối:
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {selectedFarm.zones
                      .filter((z) => z.status === 'MAINTENANCE')
                      .map((zone) => (
                        <div
                          key={zone.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white p-4 shadow-2xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{zone.name}</span>
                              <span className="font-mono text-xs text-slate-400">({zone.code})</span>
                              <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                Chờ Owner duyệt
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 flex flex-wrap gap-x-3 gap-y-1">
                              <span>Loại hình: <strong className="text-slate-800">{zone.zoneType}</strong></span>
                              <span>Diện tích: <strong className="text-emerald-700 font-mono">{formatArea(zone.areaM2)}</strong></span>
                              {zone.soilType && <span>Chất đất: <strong className="text-slate-700">{zone.soilType}</strong></span>}
                              {zone.waterSource && <span>Nước cấp: <strong className="text-slate-700">{zone.waterSource}</strong></span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-rose-700 border-rose-300 hover:bg-rose-50 font-bold"
                              icon={<XCircle className="h-4 w-4" />}
                              onClick={(e) => handleRejectZone(selectedFarm.id, zone, e)}
                            >
                              [❌ Từ Chối Đề Xuất]
                            </Button>
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              icon={<CheckCircle className="h-4 w-4" />}
                              onClick={(e) => handleApproveZone(selectedFarm.id, zone, e)}
                            >
                              [✅ Phê Duyệt Mở Phân Khu]
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Danh sách phân khu nhanh của Trang trại */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Danh Sách Phân Khu Trực Thuộc ({selectedFarm.zones?.length || 0})
                    </h3>
                  </div>
                  <Can permission="PERM_ZONE_MANAGE">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingZone(null);
                        setZoneModalOpen(true);
                      }}
                      icon={<Plus className="h-3.5 w-3.5" />}
                    >
                      + Phân Khu Mới
                    </Button>
                  </Can>
                </div>

                {(!selectedFarm.zones || selectedFarm.zones.length === 0) ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Trang trại này chưa có phân khu canh tác nào. Nhấn "+ Thêm Phân Khu" để khởi tạo.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedFarm.zones.map((zone) => (
                      <div
                        key={zone.id}
                        onClick={() => handleSelectNode({ type: 'ZONE', item: zone, farm: selectedFarm })}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:border-emerald-500 hover:bg-white cursor-pointer transition-all space-y-2 group shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {zone.name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {zone.status === 'MAINTENANCE' && (
                              <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                Chờ Owner duyệt
                              </span>
                            )}
                            <StatusBadge status={zone.status} size="xs" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-mono text-[11px] text-slate-400">{zone.code}</span>
                          <span className="font-bold text-slate-700 font-mono">{formatArea(zone.areaM2)}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          Loại: <strong className="text-slate-700">{zone.zoneType}</strong> • {zone.locations?.length || 0} vị trí
                        </div>

                        {/* Nút phê duyệt nhanh cho Owner */}
                        {owner && zone.status === 'MAINTENANCE' && (
                          <div className="pt-2 border-t border-slate-200/80 flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => handleApproveZone(selectedFarm.id, zone, e)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-2xs transition-colors"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              [ Phê Duyệt Mở Phân Khu ]
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Panel Phân Công Nhân Sự Trang Trại (Ẩn đối với Owner để giao diện sạch gọn) */}
              {!owner && (
                <StaffAssignmentPane
                  assignments={assignments}
                  selectedZoneId={null}
                  onOpenAssignModal={() => setAssignModalOpen(true)}
                  onDeleteAssignment={handleDeleteAssignment}
                />
              )}
            </div>
          )}

          {/* TRƯỜNG HỢP 2: ĐANG CHỌN NODE PHÂN KHU (production_zones #13) */}
          {selectedNode?.type === 'ZONE' && selectedZone && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Thẻ Chi Tiết Phân Khu */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">{selectedZone.name}</h2>
                        <StatusBadge status={selectedZone.status} size="sm" />
                      </div>
                      <span className="font-mono text-xs text-slate-500">
                        {selectedFarm?.name} &bull; Mã khu: {selectedZone.code}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {owner && selectedZone.status === 'MAINTENANCE' && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleRejectZone(selectedFarm.id, selectedZone, e)}
                          className="text-rose-700 border-rose-300 hover:bg-rose-50 font-bold"
                          icon={<XCircle className="h-4 w-4" />}
                        >
                          [❌ Từ Chối Đề Xuất]
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={(e) => handleApproveZone(selectedFarm.id, selectedZone, e)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          icon={<CheckCircle className="h-4 w-4" />}
                        >
                          [✅ Phê Duyệt Mở Phân Khu]
                        </Button>
                      </div>
                    )}

                    <Can permission="PERM_ZONE_MANAGE">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingLocation(null);
                          setLocationModalOpen(true);
                        }}
                        icon={<Plus className="h-4 w-4" />}
                      >
                        + Thêm Vị Trí / Luống
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingZone(selectedZone);
                          setZoneModalOpen(true);
                        }}
                        icon={<Edit2 className="h-4 w-4" />}
                      >
                        Sửa Phân Khu
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleDeleteZone(selectedFarm.id, selectedZone.id)}
                        className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Xóa phân khu"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Can>
                  </div>
                </div>

                {/* Banner trạng thái phê duyệt phân khu */}
                {selectedZone.status === 'MAINTENANCE' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-xs">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="h-5 w-5 text-amber-700 shrink-0" />
                      <div>
                        <strong className="font-bold text-amber-950">Phân khu đang ở trạng thái MAINTENANCE (Chờ Chủ đầu tư phê duyệt):</strong>
                        <p className="text-amber-800 mt-0.5">
                          {owner
                            ? 'Phân khu do Farm Manager đề xuất nâng cấp/mở rộng. Nhấn nút [ Phê Duyệt Mở Phân Khu ] để kích hoạt sang ACTIVE hoặc [ Từ Chối ] để chuyển sang FALLOW.'
                            : 'Đề xuất nâng cấp phân khu đã được gửi đến Chủ đầu tư (Owner). Đang chờ phê duyệt để đưa vào canh tác.'}
                        </p>
                      </div>
                    </div>
                    {owner && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={(e) => handleRejectZone(selectedFarm.id, selectedZone, e)}
                          className="text-rose-700 border-rose-300 hover:bg-rose-50 font-bold"
                          icon={<XCircle className="h-3.5 w-3.5" />}
                        >
                          [❌ Từ Chối]
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="xs"
                          onClick={(e) => handleApproveZone(selectedFarm.id, selectedZone, e)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 font-bold"
                          icon={<CheckCircle className="h-3.5 w-3.5" />}
                        >
                          [✅ Phê Duyệt]
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Phân Loại</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedZone.zoneType}</div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Diện Tích</div>
                    <div className="text-sm font-bold text-blue-700 mt-0.5 font-mono">
                      {formatArea(selectedZone.areaM2)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Chất Đất</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {selectedZone.soilType || '—'}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Nguồn Nước Cấp</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {selectedZone.waterSource || '—'}
                    </div>
                  </div>
                </div>

                {/* Sơ đồ đa giác GeoJSON Polygon Preview */}
                <GeoJsonPolygonEditor
                  value={selectedZone.mapLayoutJson}
                  farmCenter={selectedFarm}
                />
              </div>

              {/* LƯỚI VỊ TRÍ CHI TIẾT TRONG PHÂN KHU (zone_locations #14) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Vị Trí / Luống / Chuồng Trong Phân Khu ({zoneLocations.length})
                    </h3>
                  </div>

                  <Can permission="PERM_ZONE_MANAGE">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setEditingLocation(null);
                        setLocationModalOpen(true);
                      }}
                      icon={<Plus className="h-3.5 w-3.5" />}
                    >
                      + Thêm Vị Trí
                    </Button>
                  </Can>
                </div>

                {zoneLocations.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Chưa có vị trí ô luống nào. Nhấn "+ Thêm Vị Trí" để chia nhỏ phân khu theo luống hoặc chuồng nuôi.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {zoneLocations.map((loc) => (
                      <div
                        key={loc.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2 hover:bg-white hover:border-purple-300 transition-all shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{loc.name}</span>
                          <StatusBadge status={loc.status} size="xs" />
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">{loc.code}</div>
                        {loc.description && (
                          <div className="text-[11px] text-slate-500 truncate">{loc.description}</div>
                        )}
                        <div className="flex justify-end gap-1 pt-1 border-t border-slate-100">
                          <Can permission="PERM_ZONE_MANAGE">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLocation(loc);
                                setLocationModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-800 rounded"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLocation(loc.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </Can>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Phân Công Nhân Sự Tại Phân Khu (Ẩn đối với Owner để giao diện sạch gọn) */}
              {!owner && (
                <StaffAssignmentPane
                  assignments={assignments}
                  selectedZoneId={selectedZone.id}
                  onOpenAssignModal={() => setAssignModalOpen(true)}
                  onDeleteAssignment={handleDeleteAssignment}
                />
              )}
            </div>
          )}

          {/* TRƯỜNG HỢP 3: CHƯA CÓ TRANG TRẠI NÀO */}
          {farms.length === 0 && !loading && (
            <SmartEmptyState
              title="Chưa Có Trang Trại Nào Trong Hệ Thống"
              description="Hãy bắt đầu khởi tạo Trang trại đầu tiên của bạn để thiết lập mặt bằng, phân khu và phân công hiện trường."
              actionLabel="+ Tạo Trang Trại Mới"
              onAction={() => {
                setEditingFarm(null);
                setFarmModalOpen(true);
              }}
            />
          )}
        </div>
      </div>

      {/* Modal Farm */}
      <FarmFormModal
        isOpen={farmModalOpen}
        onClose={() => setFarmModalOpen(false)}
        editingItem={editingFarm}
        employees={employees}
        onSuccess={() => {
          fetchHierarchy();
          notifyDataChanged?.('farms');
        }}
      />

      {/* Modal Zone */}
      {selectedFarm && (
        <ZoneFormModal
          isOpen={zoneModalOpen}
          onClose={() => setZoneModalOpen(false)}
          farmId={selectedFarm.id}
          farmTotalAreaM2={selectedFarm.totalAreaM2}
          farmCenter={selectedFarm}
          editingItem={editingZone}
          onSuccess={() => {
            fetchHierarchy();
            notifyDataChanged?.('zones');
          }}
        />
      )}

      {/* Modal Location */}
      {selectedFarm && selectedZone && (
        <LocationFormModal
          isOpen={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
          farmId={selectedFarm.id}
          zoneId={selectedZone.id}
          editingItem={editingLocation}
          onSuccess={() => {
            fetchLocations(selectedFarm.id, selectedZone.id);
            notifyDataChanged?.('zones');
          }}
        />
      )}

      {/* Modal Assignment */}
      {selectedFarm && (
        <AssignmentModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          farmId={selectedFarm.id}
          zoneId={selectedZone?.id || null}
          farmName={selectedFarm.name}
          zoneName={selectedZone?.name || ''}
          employees={employees}
          onSuccess={() => {
            fetchAssignments(selectedFarm.id);
            notifyDataChanged?.('employees');
          }}
        />
      )}
    </div>
  );
}

export default GeographyWorkspace;
