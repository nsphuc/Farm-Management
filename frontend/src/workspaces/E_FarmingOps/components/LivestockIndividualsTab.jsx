import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Activity,
  HeartPulse,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Can } from '@/components/common/Can';
import { farmingService } from '@/services/modules/farmingService';
import { geographyService } from '@/services/modules/geographyService';
import { formatDate, formatWeight } from '@/utils/formatters';
import { toast } from '@/store/useToastStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { LivestockIndividualModal } from './LivestockIndividualModal';

const HEALTH_STATUS_MAP = {
  HEALTHY: { label: 'Khỏe mạnh', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  SICK: { label: 'Bị ốm', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  INJURED: { label: 'Bị thương', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  QUARANTINED: { label: 'Đang cách ly', color: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
  DECEASED: { label: 'Chết / Tiêu hủy', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  SOLD: { label: 'Đã xuất bán', color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const GENDER_MAP = {
  MALE: { label: 'Đực ♂', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  FEMALE: { label: 'Cái ♀', color: 'text-pink-600 bg-pink-50 border-pink-200' },
  CASTRATED: { label: 'Đã thiến ⚲', color: 'text-slate-600 bg-slate-100 border-slate-200' },
};

export function LivestockIndividualsTab({ item, farmId, onDataChanged }) {
  const syncTrigger = useActiveFarmStore((state) => state.syncTrigger);
  const [individuals, setIndividuals] = useState([]);
  const [zones, setZones] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [healthFilter, setHealthFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndividual, setEditingIndividual] = useState(null);

  // Nạp danh sách cá thể
  const loadData = async () => {
    if (!farmId) return;
    try {
      setIsLoading(true);
      const params = { size: 100 };
      if (item?.id) {
        params.groupId = item.id;
      }
      if (healthFilter !== 'ALL') {
        params.healthStatus = healthFilter;
      }

      const [indivRes, zoneRes, groupRes] = await Promise.all([
        farmingService.getLivestockIndividuals(farmId, params).catch(() => ({ content: [] })),
        geographyService.getZones({ farmId }).catch(() => ({ content: [] })),
        farmingService.getLivestockGroups(farmId, { size: 100 }).catch(() => ({ content: [] })),
      ]);

      const list = indivRes?.content || (Array.isArray(indivRes) ? indivRes : []);
      setIndividuals(list);

      const zList = zoneRes?.content || (Array.isArray(zoneRes) ? zoneRes : []);
      setZones(zList);

      const gList = groupRes?.content || (Array.isArray(groupRes) ? groupRes : []);
      setGroups(gList);
    } catch (err) {
      console.error('Lỗi khi nạp danh sách cá thể RFID:', err);
      setIndividuals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [farmId, item?.id, healthFilter, syncTrigger?.groups, syncTrigger?.farming, syncTrigger?.all]);

  const handleDeleteIndividual = async (indiv) => {
    const confirmed = window.confirm(
      `Xác nhận xóa hồ sơ cá thể thẻ tai: ${indiv.rfidTagCode}?\n\nLưu ý: Chỉ xóa khi nhập nhầm mã thẻ.`
    );
    if (!confirmed) return;

    try {
      await farmingService.deleteLivestockIndividual(farmId, indiv.id);
      toast.success(`Đã xóa cá thể ${indiv.rfidTagCode}!`);
      loadData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Lỗi xóa cá thể:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi xóa cá thể');
    }
  };

  // Lọc tìm kiếm client-side
  const filteredIndividuals = individuals.filter((row) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      row.rfidTagCode?.toLowerCase().includes(q) ||
      row.motherTagCode?.toLowerCase().includes(q) ||
      row.fatherTagCode?.toLowerCase().includes(q) ||
      row.zoneName?.toLowerCase().includes(q) ||
      row.healthStatus?.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      key: 'rfidTagCode',
      header: 'Mã Thẻ Tai RFID',
      width: '150px',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            {row.rfidTagCode}
          </span>
        </div>
      ),
    },
    {
      key: 'gender',
      header: 'Giới Tính',
      width: '110px',
      render: (row) => {
        const info = GENDER_MAP[row.gender] || { label: row.gender, color: 'text-slate-600 bg-slate-50 border-slate-200' };
        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${info.color}`}>
            {info.label}
          </span>
        );
      },
    },
    {
      key: 'pedigree',
      header: 'Ngày Sinh & Phả Hệ',
      width: '180px',
      render: (row) => (
        <div className="space-y-0.5 text-[11px]">
          <div className="flex items-center gap-1 text-slate-700 font-medium">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>{row.birthDate ? formatDate(row.birthDate) : '—'}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            <span>Mẹ: {row.motherTagCode || '—'}</span>
            <span className="mx-1">•</span>
            <span>Cha: {row.fatherTagCode || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'currentWeightKg',
      header: 'Trọng Lượng Hiện Tại',
      width: '140px',
      align: 'right',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-xs text-slate-900">
            {row.currentWeightKg != null ? `${row.currentWeightKg} kg` : '—'}
          </span>
          {row.latestAdgKgPerDay != null && (
            <span className="block text-[10px] text-emerald-600 font-bold">
              +{row.latestAdgKgPerDay} kg/ngày
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'healthStatus',
      header: 'Tình Trạng Sức Khỏe',
      width: '150px',
      render: (row) => {
        const info = HEALTH_STATUS_MAP[row.healthStatus] || {
          label: row.healthStatus || 'HEALTHY',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${info.color}`}>
            {row.healthStatus === 'HEALTHY' && <ShieldCheck className="h-3 w-3" />}
            {row.healthStatus === 'SICK' && <HeartPulse className="h-3 w-3" />}
            {row.healthStatus === 'QUARANTINED' && <ShieldAlert className="h-3 w-3" />}
            <span>{info.label}</span>
          </span>
        );
      },
    },
    {
      key: 'zoneName',
      header: 'Chuồng Nuôi',
      width: '130px',
      render: (row) => (
        <span className="text-xs text-slate-700 truncate block">
          {row.zoneName || (row.zoneId ? `Chuồng #${row.zoneId}` : '—')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      width: '160px',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          <Can anyPermissions={['PERM_LIVESTOCK_MANAGE', 'PERM_LIVESTOCK_VET']} role={['ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF']}>
            <Button
              size="xs"
              variant="outline"
              icon={<Edit className="h-3 w-3" />}
              onClick={() => {
                setEditingIndividual(row);
                setIsModalOpen(true);
              }}
              title="Cập nhật thông tin / Đổi trạng thái sức khỏe"
            >
              Cập Nhật
            </Button>
          </Can>

          <Can anyPermissions={['PERM_LIVESTOCK_MANAGE']} role={['ROLE_FARM_MANAGER']}>
            <button
              type="button"
              onClick={() => handleDeleteIndividual(row)}
              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
              title="Xóa cá thể này"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 text-xs">
      {/* Header thanh công cụ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
        <div>
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Tag className="h-4 w-4 text-purple-600" />
            <span>Quản Lý Cá Thể Đeo Thẻ Tai RFID ({filteredIndividuals.length} con)</span>
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {item?.groupCode
              ? `Các cá thể thuộc đàn ${item.groupCode} (${item.breedName || 'Vật nuôi'})`
              : 'Theo dõi chỉ số cá thể đeo thẻ tai RFID toàn trang trại'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút Gắn thẻ tai mới */}
          <Can anyPermissions={['PERM_LIVESTOCK_MANAGE', 'PERM_LIVESTOCK_VET']} role={['ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF']}>
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => {
                setEditingIndividual(null);
                setIsModalOpen(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              + Gắn Thẻ Tai RFID Mới
            </Button>
          </Can>
        </div>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã thẻ RFID, phả hệ cha/mẹ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-emerald-500 shadow-2xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <Filter className="h-3 w-3" /> Sức khỏe:
          </span>
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 focus:outline-emerald-500 shadow-2xs"
          >
            <option value="ALL">Tất cả tình trạng</option>
            <option value="HEALTHY">Khỏe mạnh</option>
            <option value="SICK">Bị ốm</option>
            <option value="INJURED">Bị thương</option>
            <option value="QUARANTINED">Đang cách ly</option>
            <option value="DECEASED">Chết / Tiêu hủy</option>
            <option value="SOLD">Đã bán</option>
          </select>
        </div>
      </div>

      {/* Bảng Cá Thể RFID */}
      <DataTable
        columns={columns}
        data={filteredIndividuals}
        isLoading={isLoading}
        emptyMessage="Chưa có cá thể nào được gắn thẻ tai RFID trong phân nhóm này."
      />

      {/* Modal Thêm / Sửa Cá Thể RFID */}
      <LivestockIndividualModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadData();
          if (onDataChanged) onDataChanged();
        }}
        farmId={farmId}
        defaultGroupId={item?.id}
        defaultZoneId={item?.zoneId}
        zones={zones}
        groups={groups}
        individual={editingIndividual}
      />
    </div>
  );
}

export default LivestockIndividualsTab;
