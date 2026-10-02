import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  FileText,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFarmStore } from '../../stores/useFarmStore';
import { cropService } from '../../services/cropService';
import { CreateSeasonModal } from './CreateSeasonModal';
import { HarvestSeasonModal } from './HarvestSeasonModal';
import { FarmingLogModal } from './FarmingLogModal';
import { FarmingLogDrawer } from './FarmingLogDrawer';

const STATUS_TABS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'LAM_DAT', label: 'Làm đất', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200' },
  { value: 'XUONG_GIONG', label: 'Xuống giống', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' },
  { value: 'CHAM_SOC', label: 'Chăm sóc', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200' },
  { value: 'THU_HOACH', label: 'Thu hoạch', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200' },
  { value: 'DONG_VU', label: 'Đóng vụ', color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-300' },
];

const STATUS_LABELS = {
  LAM_DAT: { label: 'Làm đất', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200' },
  XUONG_GIONG: { label: 'Xuống giống', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200' },
  CHAM_SOC: { label: 'Chăm sóc', color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200' },
  THU_HOACH: { label: 'Thu hoạch', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200' },
  DONG_VU: { label: 'Đóng vụ', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300' },
};

export const CropsPage = () => {
  const currentFarm = useFarmStore((state) => state.currentFarm);

  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modals & Drawers state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [harvestModalOpen, setHarvestModalOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSeason, setActiveSeason] = useState(null);

  useEffect(() => {
    if (currentFarm?.id) {
      loadSeasons();
    }
  }, [currentFarm?.id, selectedStatus, page]);

  const loadSeasons = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: 10,
        status: selectedStatus || undefined,
      };
      const res = await cropService.getSeasons(currentFarm.id, params);
      setSeasons(res?.items || res?.content || (Array.isArray(res) ? res : []));
      setTotalPages(res?.totalPages || 0);
    } catch {
      // Handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (season, newStatus) => {
    try {
      await cropService.updateSeasonStatus(currentFarm.id, season.id, newStatus);
      toast.success(`Đã chuyển trạng thái vụ mùa sang "${STATUS_LABELS[newStatus]?.label || newStatus}"`);
      loadSeasons();
    } catch {
      // Handled
    }
  };

  if (!currentFarm) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Sprout className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="font-bold text-slate-800 dark:text-white text-base">Chưa chọn trang trại</h3>
        <p className="text-xs text-slate-500 mt-1">
          Vui lòng chọn trang trại hoạt động từ thanh điều hướng trên cùng để quản lý mùa vụ canh tác.
        </p>
      </div>
    );
  }

  // Quick stats calculation
  const totalArea = seasons.reduce((sum, s) => sum + (parseFloat(s.plantedAreaM2) || 0), 0);
  const totalEstimatedYield = seasons.reduce((sum, s) => sum + (parseFloat(s.estimatedYieldKg) || 0), 0);
  const activeCount = seasons.filter((s) => s.status !== 'DONG_VU').length;

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Quản Lý Mùa Vụ Canh Tác
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              VietGAP
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Trang trại: <strong className="text-slate-700 dark:text-slate-300">{currentFarm.name}</strong> • Nhật ký điện tử & Trừ kho tự động
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Khởi tạo vụ mùa mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500">Đang canh tác</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {activeCount} <span className="text-xs font-normal text-slate-400">vụ</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500">Tổng diện tích gieo</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {totalArea.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">m²</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500">Sản lượng dự kiến</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {totalEstimatedYield.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">kg</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500">Chuẩn canh tác</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              VietGAP Safe Agri
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const isSelected = selectedStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(0);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Seasons Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Mã Vụ & Giống cây</th>
                <th className="px-4 py-3.5">Phân khu</th>
                <th className="px-4 py-3.5">Lịch trình gieo / thu</th>
                <th className="px-4 py-3.5">Diện tích</th>
                <th className="px-4 py-3.5">Sản lượng (Dự kiến / Thực tế)</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Đang tải danh sách mùa vụ...
                  </td>
                </tr>
              ) : seasons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Chưa có mùa vụ nào trong danh sách.
                  </td>
                </tr>
              ) : (
                seasons.map((s) => {
                  const statusInfo = STATUS_LABELS[s.status] || STATUS_LABELS.LAM_DAT;
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                          {s.seasonCode}
                        </div>
                        <div className="text-slate-500 font-medium text-[11px] mt-0.5">
                          {s.cropTypeName} ({s.varietyCode})
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-700 dark:text-slate-300 font-medium">
                        {s.zoneName}
                      </td>

                      <td className="px-4 py-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        <div>{s.startDate}</div>
                        <div className="text-slate-400 text-[10px]">Đến: {s.expectedHarvestDate}</div>
                      </td>

                      <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">
                        {s.plantedAreaM2} m²
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {s.estimatedYieldKg || 0} kg (DK)
                        </div>
                        {s.actualYieldKg ? (
                          <div className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                            {s.actualYieldKg} kg ({s.yieldAchievementRate}%)
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Chưa thu hoạch</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border inline-block ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút xem Drawer Nhật ký */}
                          <button
                            onClick={() => {
                              setActiveSeason(s);
                              setDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Xem nhật ký VietGAP"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Nút Ghi nhật ký nhanh ngoài đồng */}
                          {s.status !== 'DONG_VU' && (
                            <button
                              onClick={() => {
                                setActiveSeason(s);
                                setLogModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200/80 dark:border-emerald-800 transition-colors flex items-center gap-1"
                              title="Ghi nhật ký canh tác"
                            >
                              <Plus className="w-3.5 h-3.5" /> Ghi NK
                            </button>
                          )}

                          {/* Nút Thu hoạch */}
                          {s.status !== 'DONG_VU' && (
                            <button
                              onClick={() => {
                                setActiveSeason(s);
                                setHarvestModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-semibold border border-amber-200/80 dark:border-amber-800 transition-colors"
                            >
                              Thu hoạch
                            </button>
                          )}

                          {/* Đổi nhanh trạng thái */}
                          {s.status === 'LAM_DAT' && (
                            <button
                              onClick={() => handleStatusChange(s, 'XUONG_GIONG')}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-emerald-600"
                            >
                              Gieo giống →
                            </button>
                          )}
                          {s.status === 'XUONG_GIONG' && (
                            <button
                              onClick={() => handleStatusChange(s, 'CHAM_SOC')}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-sky-600"
                            >
                              Chăm sóc →
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals & Drawers */}
      <CreateSeasonModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        farmId={currentFarm.id}
        onSuccess={loadSeasons}
      />

      <HarvestSeasonModal
        isOpen={harvestModalOpen}
        onClose={() => {
          setHarvestModalOpen(false);
          setActiveSeason(null);
        }}
        farmId={currentFarm.id}
        season={activeSeason}
        onSuccess={loadSeasons}
      />

      <FarmingLogModal
        isOpen={logModalOpen}
        onClose={() => {
          setLogModalOpen(false);
          setActiveSeason(null);
        }}
        farmId={currentFarm.id}
        season={activeSeason}
        onSuccess={loadSeasons}
      />

      <FarmingLogDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setActiveSeason(null);
        }}
        farmId={currentFarm.id}
        season={activeSeason}
        onOpenCreateLog={(season) => {
          setActiveSeason(season);
          setLogModalOpen(true);
        }}
      />
    </div>
  );
};
