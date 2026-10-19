import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { geographyService } from '@/services/modules/geographyService';
import { employeeService } from '@/services/modules/employeeService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
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
  const { activeFarmId, setActiveFarmId, activeZoneId, setActiveZoneId } = useActiveFarmStore();

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
      const currentFarm =
        fullFarms.find((f) => f.id === activeFarmId) || fullFarms[0] || null;

      if (currentFarm) {
        setSelectedFarm(currentFarm);
        if (!selectedNode || selectedNode.type === 'FARM') {
          setSelectedNode({ type: 'FARM', item: currentFarm });
        }
        if (!activeFarmId) {
          setActiveFarmId(currentFarm.id, fullFarms);
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
  }, []);

  useEffect(() => {
    if (selectedFarm?.id) {
      fetchAssignments(selectedFarm.id);
    }
  }, [selectedFarm?.id]);

  useEffect(() => {
    if (selectedFarm?.id && selectedZone?.id) {
      fetchLocations(selectedFarm.id, selectedZone.id);
    }
  }, [selectedFarm?.id, selectedZone?.id]);

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

  // Delete farm
  const handleDeleteFarm = async (farmId) => {
    if (!window.confirm('CẢNH BÁO: Xóa trang trại sẽ làm mất toàn bộ mặt bằng liên quan. Tiếp tục?')) {
      return;
    }
    try {
      await geographyService.deleteFarm?.(farmId);
      fetchHierarchy();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      alert(errInfo.message || 'Không thể xóa trang trại đã phát sinh giao dịch!');
    }
  };

  // Delete zone
  const handleDeleteZone = async (farmId, zoneId) => {
    if (!window.confirm('Bạn có chắc muốn xóa phân khu này?')) return;
    try {
      await geographyService.deleteZone(farmId, zoneId);
      fetchHierarchy();
      setSelectedZone(null);
      setSelectedNode({ type: 'FARM', item: selectedFarm });
    } catch (err) {
      const errInfo = extractApiErrors(err);
      alert(errInfo.message || 'Không thể xóa phân khu đã phát sinh dữ liệu!');
    }
  };

  // Delete location
  const handleDeleteLocation = async (locId) => {
    if (!window.confirm('Bạn có chắc muốn xóa vị trí / luống này?')) return;
    try {
      await geographyService.deleteLocation(selectedFarm.id, selectedZone.id, locId);
      fetchLocations(selectedFarm.id, selectedZone.id);
      fetchHierarchy();
    } catch (err) {
      const errInfo = extractApiErrors(err);
      alert(errInfo.message || 'Không thể xóa vị trí đã phát sinh lịch sử nhật ký!');
    }
  };

  // Delete assignment
  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Bạn có chắc muốn hủy phân công cán bộ này?')) return;
    try {
      await geographyService.deleteAssignment(selectedFarm.id, assignmentId);
      fetchAssignments(selectedFarm.id);
    } catch (err) {
      const errInfo = extractApiErrors(err);
      alert(errInfo.message || 'Không thể hủy phân công!');
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

          <Can permission="PERM_FARM_CREATE">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditingFarm(null);
                setFarmModalOpen(true);
              }}
            >
              + Thêm Trang Trại
            </Button>
          </Can>
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
                        + Thêm Phân Khu
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
                        Sửa Trang Trại
                      </Button>
                    </Can>
                  </div>
                </div>

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
                          <StatusBadge status={zone.status} size="xs" />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-mono text-[11px] text-slate-400">{zone.code}</span>
                          <span className="font-bold text-slate-700 font-mono">{formatArea(zone.areaM2)}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          Loại: <strong className="text-slate-700">{zone.zoneType}</strong> • {zone.locations?.length || 0} vị trí
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Panel Phân Công Nhân Sự Trang Trại */}
              <StaffAssignmentPane
                assignments={assignments}
                selectedZoneId={null}
                onOpenAssignModal={() => setAssignModalOpen(true)}
                onDeleteAssignment={handleDeleteAssignment}
              />
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

              {/* Phân Công Nhân Sự Tại Phân Khu */}
              <StaffAssignmentPane
                assignments={assignments}
                selectedZoneId={selectedZone.id}
                onOpenAssignModal={() => setAssignModalOpen(true)}
                onDeleteAssignment={handleDeleteAssignment}
              />
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
        onSuccess={() => fetchHierarchy()}
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
          onSuccess={() => fetchHierarchy()}
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
          onSuccess={() => fetchLocations(selectedFarm.id, selectedZone.id)}
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
          onSuccess={() => fetchAssignments(selectedFarm.id)}
        />
      )}
    </div>
  );
}

export default GeographyWorkspace;
