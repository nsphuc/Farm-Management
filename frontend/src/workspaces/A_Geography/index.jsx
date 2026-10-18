import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Building, Layers, Eye, Users, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { Can } from '@/components/common/Can';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import { formatArea, formatNumber } from '@/utils/formatters';

/**
 * Workspace A: Quản Trị Mặt Bằng & Phân Công Hiện Trường (Điều 2.1 File 08)
 * Master-Detail: Farm -> Zone -> Locations & Staff Assignments
 */
export function GeographyWorkspace() {
  const { activeFarmId, activeFarm } = useActiveFarmStore();
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('locations');

  useEffect(() => {
    if (!activeFarmId) return;
    fetchZones();
  }, [activeFarmId]);

  const fetchZones = async () => {
    if (!activeFarmId) return;
    setIsLoading(true);
    try {
      const response = await apiClient.get(API_ENDPOINTS.GEOGRAPHY.ZONES(activeFarmId));
      setZones(response.data || []);
    } catch {
      // Mock data if backend zone empty
      setZones([]);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: 'code', header: 'Mã phân khu', width: '130px', sortable: true },
    { key: 'name', header: 'Tên phân khu', sortable: true },
    { key: 'zoneType', header: 'Loại phân khu', render: (row) => <StatusBadge status={row.zoneType} /> },
    { key: 'areaM2', header: 'Diện tích', align: 'right', render: (row) => formatArea(row.areaM2) },
    { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'center',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          icon={Eye}
          onClick={() => {
            setSelectedZone(row);
            setIsDrawerOpen(true);
          }}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Context Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {activeFarm?.farmName || activeFarm?.name || 'Mặt Bằng Nông Trại'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Mã trại: <strong className="font-mono text-slate-700">{activeFarm?.farmCode || activeFarm?.code || '—'}</strong> •
              Loại: <strong className="text-slate-700">{activeFarm?.farmType || 'MIXED'}</strong> •
              Bán kính Geofence: <strong className="text-emerald-700">{activeFarm?.geofenceRadiusM || 300}m</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchZones}>
            Làm mới
          </Button>
          <Can permission="PERM_ZONE_MANAGE">
            <Button variant="primary" size="sm" icon={Plus}>
              Thêm Phân Khu
            </Button>
          </Can>
        </div>
      </div>

      {/* Main Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Danh Sách Phân Khu Sản Xuất (Production Zones)
          </h2>
          <span className="text-xs text-slate-500 font-medium">Tổng: {zones.length} phân khu</span>
        </div>

        <DataTable
          columns={columns}
          data={zones}
          isLoading={isLoading}
          emptyStateProps={{
            title: 'Chưa có phân khu nào trong trang trại',
            description: 'Hãy phân định mặt bằng trang trại thành các nhà màng, ruộng mở, hoặc chuồng nuôi.',
            actionLabel: 'Thêm Phân Khu Mới',
            permission: 'PERM_ZONE_MANAGE',
            onAction: () => {},
          }}
        />
      </div>

      {/* Slide-over Detail Pane */}
      <SlideOverDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedZone ? `Phân Khu: ${selectedZone.name}` : 'Chi Tiết Phân Khu'}
        subtitle={`Mã: ${selectedZone?.code} • Loại: ${selectedZone?.zoneType}`}
        tabs={[
          { id: 'locations', label: 'Vị Trí / Luống', icon: Layers },
          { id: 'staff', label: 'Cán Bộ Phụ Trách', icon: Users },
        ]}
        activeTab={drawerTab}
        onTabChange={setDrawerTab}
      >
        {selectedZone && (
          <div className="space-y-6 text-xs text-slate-700">
            {drawerTab === 'locations' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Vị trí con (Zone Locations)</span>
                  <Can permission="PERM_ZONE_MANAGE">
                    <Button size="sm" variant="outline" icon={Plus}>Thêm Vị Trí</Button>
                  </Can>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border rounded-xl bg-slate-50">
                    <span className="font-bold">Lô 01 / Luống 1</span>
                    <p className="text-[11px] text-slate-500 mt-1">Trạng thái: OCCUPIED</p>
                  </div>
                  <div className="p-3 border rounded-xl bg-slate-50">
                    <span className="font-bold">Lô 02 / Luống 2</span>
                    <p className="text-[11px] text-slate-500 mt-1">Trạng thái: EMPTY</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Nhân sự hiện trường (Farm Assignments)</span>
                  <Can permission="PERM_ZONE_MANAGE">
                    <Button size="sm" variant="outline" icon={Plus}>Phân Công</Button>
                  </Can>
                </div>
                <div className="p-3 border rounded-xl bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">Kỹ sư Trưởng Trại</span>
                    <p className="text-[11px] text-slate-500">Vai trò: ZONE_MANAGER</p>
                  </div>
                  <StatusBadge status="ACTIVE" size="sm" />
                </div>
              </div>
            )}
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
}

export default GeographyWorkspace;
