import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Building,
  Layers,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  Plus,
  Edit2,
} from 'lucide-react';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Can } from '@/components/common/Can';

const FARM_TYPES = [
  { value: '', label: 'Tất cả loại trang trại' },
  { value: 'CROP', label: 'Trồng trọt (CROP)' },
  { value: 'LIVESTOCK', label: 'Chăn nuôi (LIVESTOCK)' },
  { value: 'MIXED', label: 'Hỗn hợp (MIXED)' },
];

const ZONE_TYPES = [
  { value: '', label: 'Tất cả loại phân khu' },
  { value: 'GREENHOUSE', label: 'Nhà màng / Nhà kính (GREENHOUSE)' },
  { value: 'OPEN_FIELD', label: 'Cánh đồng mở / Bãi chăn thả (OPEN_FIELD)' },
  { value: 'BARN', label: 'Chuồng trại (BARN)' },
  { value: 'STORAGE', label: 'Kho bãi & Sân phơi (STORAGE)' },
  { value: 'ISOLATION', label: 'Khu cách ly & Kiểm dịch (ISOLATION)' },
];

export function MasterGeographicTree({
  farms = [],
  selectedNode = null,
  onSelectNode,
  onAddZone,
  onEditFarm,
  onAddLocation,
  onEditZone,
  onEditLocation,
  expandedNodeKeys,
}) {
  const { setActiveFarmId, setActiveZoneId } = useActiveFarmStore();

  const [expandedNodes, setExpandedNodes] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [farmTypeFilter, setFarmTypeFilter] = useState('');
  const [zoneTypeFilter, setZoneTypeFilter] = useState('');

  useEffect(() => {
    if (expandedNodeKeys && typeof expandedNodeKeys === 'object') {
      setExpandedNodes((prev) => ({ ...prev, ...expandedNodeKeys }));
    }
  }, [expandedNodeKeys]);

  const toggleExpand = (nodeKey, e) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  };

  const handleSelect = (type, item, parentFarm = null, parentZone = null) => {
    if (type === 'FARM') {
      setActiveFarmId(item.id, farms);
    } else if (type === 'ZONE') {
      if (parentFarm) setActiveFarmId(parentFarm.id, farms);
      setActiveZoneId(item.id);
    }

    onSelectNode?.({
      type,
      item,
      farm: parentFarm || (type === 'FARM' ? item : null),
      zone: parentZone || (type === 'ZONE' ? item : null),
    });
  };

  // Filter farms and nested zones
  const filteredFarms = farms
    .filter((farm) => {
      if (farmTypeFilter && farm.farmType !== farmTypeFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      const matchFarm =
        farm.name?.toLowerCase().includes(q) || farm.code?.toLowerCase().includes(q);
      const matchZone = (farm.zones || []).some(
        (z) => z.name?.toLowerCase().includes(q) || z.code?.toLowerCase().includes(q)
      );
      return matchFarm || matchZone;
    })
    .map((farm) => {
      const filteredZones = (farm.zones || []).filter((zone) => {
        if (zoneTypeFilter && zone.zoneType !== zoneTypeFilter) return false;
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        const matchZone =
          zone.name?.toLowerCase().includes(q) || zone.code?.toLowerCase().includes(q);
        const matchLocation = (zone.locations || []).some(
          (loc) => loc.name?.toLowerCase().includes(q) || loc.code?.toLowerCase().includes(q)
        );
        return matchZone || matchLocation;
      });
      return { ...farm, zones: filteredZones };
    });

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Header & Search */}
      <div className="p-3.5 border-b border-slate-100 bg-slate-50/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-emerald-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Cây Phân Cấp Mặt Bằng
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-semibold">
            {farms.length} Trang trại
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm trại, phân khu, ô luống..."
            className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <select
            value={farmTypeFilter}
            onChange={(e) => setFarmTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 focus:outline-none"
          >
            {FARM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={zoneTypeFilter}
            onChange={(e) => setZoneTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 focus:outline-none"
          >
            {ZONE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tree Node Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredFarms.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">
            Không tìm thấy địa điểm phù hợp bộ lọc
          </div>
        ) : (
          filteredFarms.map((farm) => {
            const farmKey = `farm-${farm.id}`;
            const isFarmExpanded = expandedNodes[farmKey] ?? true;
            const isFarmSelected =
              selectedNode?.type === 'FARM' && selectedNode?.item?.id === farm.id;

            const pendingZonesCount = (farm.zones || []).filter((z) => z.status === 'MAINTENANCE').length;

            return (
              <div key={farm.id} className="space-y-0.5">
                {/* Node Tầng 1: Farm */}
                <div
                  onClick={() => handleSelect('FARM', farm)}
                  className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold cursor-pointer transition-all ${
                    isFarmSelected
                      ? 'bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600/30 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1">
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(farmKey, e)}
                      className="p-0.5 text-slate-400 hover:text-slate-700 rounded"
                    >
                      {isFarmExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <Building className={`h-4 w-4 shrink-0 ${isFarmSelected ? 'text-emerald-700' : 'text-slate-500'}`} />
                    <span className="truncate">{farm.name}</span>
                    {pendingZonesCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800 border border-amber-300 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        <span>{pendingZonesCount} duyệt</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:hidden">
                      {farm.code}
                    </span>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <Can permission="PERM_ZONE_MANAGE" role={["ROLE_FARM_OWNER", "ROLE_FARM_MANAGER"]}>
                        <button
                          type="button"
                          title="Thêm phân khu vào trang trại này"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddZone?.(farm);
                          }}
                          className="p-1 rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 ring-1 ring-emerald-600/20 transition-all flex items-center gap-0.5 text-[10px] font-bold"
                        >
                          <Plus className="h-3 w-3" />
                          <span className="hidden sm:inline">Khu</span>
                        </button>
                      </Can>
                      <Can permission="PERM_FARM_UPDATE" role="ROLE_FARM_OWNER">
                        <button
                          type="button"
                          title="Sửa thông số trang trại"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditFarm?.(farm);
                          }}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </Can>
                    </div>
                  </div>
                </div>

                {/* Node Tầng 2: Zones */}
                {isFarmExpanded && farm.zones && farm.zones.length > 0 && (
                  <div className="pl-6 space-y-0.5 border-l border-slate-100 ml-4">
                    {farm.zones.map((zone) => {
                      const zoneKey = `zone-${zone.id}`;
                      const isZoneExpanded = expandedNodes[zoneKey] ?? false;
                      const isZoneSelected =
                        selectedNode?.type === 'ZONE' && selectedNode?.item?.id === zone.id;
                      const isMaintenance = zone.status === 'MAINTENANCE';

                      const locationActionLabel =
                        zone.zoneType === 'BARN'
                          ? 'Thêm ô / dãy chuồng vào phân khu này'
                          : zone.zoneType === 'STORAGE'
                          ? 'Thêm kệ / vị trí kho vào phân khu này'
                          : 'Thêm luống / ô đất vào phân khu này';

                      return (
                        <div key={zone.id} className="space-y-0.5">
                          <div
                            onClick={() => handleSelect('ZONE', zone, farm)}
                            className={`group flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer transition-all ${
                              isZoneSelected
                                ? 'bg-blue-50 text-blue-950 font-bold ring-1 ring-blue-500/30 shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate flex-1">
                              <button
                                type="button"
                                onClick={(e) => toggleExpand(zoneKey, e)}
                                className="p-0.5 text-slate-400 hover:text-slate-700 rounded"
                              >
                                {isZoneExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </button>
                              <Layers className={`h-3.5 w-3.5 shrink-0 ${isZoneSelected ? 'text-blue-700' : isMaintenance ? 'text-amber-600' : 'text-slate-400'}`} />
                              <span className="truncate">{zone.name}</span>
                              {isMaintenance && (
                                <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800 border border-amber-300 shrink-0">
                                  Chờ duyệt
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono group-hover:hidden">
                                {zone.areaM2 ? `${zone.areaM2}m²` : ''}
                              </span>
                              <div className="hidden group-hover:flex items-center gap-0.5">
                                <Can permission="PERM_ZONE_MANAGE" role={["ROLE_FARM_OWNER", "ROLE_FARM_MANAGER"]}>
                                  {zone.status === 'ACTIVE' && (
                                    <button
                                      type="button"
                                      title={locationActionLabel}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAddLocation?.(farm, zone);
                                      }}
                                      className="p-1 rounded text-blue-700 bg-blue-50 hover:bg-blue-100 ring-1 ring-blue-500/20 transition-all flex items-center gap-0.5 text-[10px] font-bold"
                                    >
                                      <Plus className="h-2.5 w-2.5" />
                                      <span className="hidden sm:inline">Vị trí</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    title="Sửa thông số phân khu"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditZone?.(farm, zone);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                </Can>
                              </div>
                            </div>
                          </div>

                          {/* Node Tầng 3: Locations */}
                          {isZoneExpanded && zone.locations && zone.locations.length > 0 && (
                            <div className="pl-5 space-y-0.5 border-l border-blue-100 ml-3">
                              {zone.locations.map((loc) => {
                                const isLocSelected =
                                  selectedNode?.type === 'LOCATION' &&
                                  selectedNode?.item?.id === loc.id;
                                return (
                                  <div
                                    key={loc.id}
                                    onClick={() => handleSelect('LOCATION', loc, farm, zone)}
                                    className={`group flex items-center justify-between rounded-md px-2 py-1 text-[11px] cursor-pointer transition-colors ${
                                      isLocSelected
                                        ? 'bg-purple-50 text-purple-900 font-bold'
                                        : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                      <span className="truncate">{loc.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <StatusBadge status={loc.status} size="xs" />
                                      <Can permission="PERM_ZONE_MANAGE" role={["ROLE_FARM_OWNER", "ROLE_FARM_MANAGER"]}>
                                        <button
                                          type="button"
                                          title="Sửa thông tin vị trí"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onEditLocation?.(farm, zone, loc);
                                          }}
                                          className="hidden group-hover:inline-flex p-0.5 text-slate-400 hover:text-purple-700 hover:bg-purple-100 rounded transition-all"
                                        >
                                          <Edit2 className="h-2.5 w-2.5" />
                                        </button>
                                      </Can>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
export default MasterGeographicTree;
