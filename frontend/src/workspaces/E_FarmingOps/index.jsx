import React, { useState } from 'react';
import { Sprout, Plus, AlertTriangle, ShieldAlert, Sparkles, BookOpen, Apple } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { Can } from '@/components/common/Can';
import { formatDate, formatArea, formatWeight } from '@/utils/formatters';

/**
 * Workspace E: Bàn Làm Việc Canh Tác & Chăn Nuôi Hiện Trường Liền Mạch (Điều 2.5 File 08)
 */
export function FarmingOpsWorkspace() {
  const [sector, setSector] = useState('CROP'); // 'CROP' | 'LIVESTOCK'
  const [seasons, setSeasons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const columns = [
    { key: 'seasonCode', header: 'Mã vụ mùa', width: '130px', sortable: true },
    { key: 'seasonName', header: 'Tên vụ mùa', sortable: true },
    { key: 'cropTypeName', header: 'Giống cây trồng' },
    { key: 'plantedAreaM2', header: 'Diện tích (m²)', align: 'right', render: (row) => formatArea(row.plantedAreaM2) },
    { key: 'startDate', header: 'Ngày gieo', render: (row) => formatDate(row.startDate) },
    { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'center',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedSeason(row);
            setIsDrawerOpen(true);
          }}
        >
          Nhật ký & Thu hoạch
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Sector Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Bàn Làm Việc Canh Tác & Chăn Nuôi Hiện Trường
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Ghi nhật ký tiêu hao Auto-Backflushing, kiểm soát thời gian cách ly PHI và ghi nhận thu hoạch
            </p>
          </div>
        </div>

        {/* Sector Switcher */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setSector('CROP')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              sector === 'CROP'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌾 TRỒNG TRỌT
          </button>
          <button
            type="button"
            onClick={() => setSector('LIVESTOCK')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              sector === 'LIVESTOCK'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🐄 CHĂN NUÔI
          </button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={seasons}
        isLoading={isLoading}
        emptyStateProps={{
          title: sector === 'CROP' ? 'Chưa có vụ mùa nào đang mở' : 'Chưa có đàn vật nuôi nào',
          description:
            sector === 'CROP'
              ? 'Khởi tạo vụ mùa mới gắn liền với chu kỳ vận hành và phân khu nhà màng.'
              : 'Khai báo đàn nuôi hoặc cá thể gắn thẻ tai RFID.',
          actionLabel: sector === 'CROP' ? 'Khởi Tạo Vụ Mùa' : 'Nhập Đàn Mới',
          permission: 'PERM_CROP_PLAN',
          onAction: () => {},
        }}
      />

      {/* Drawer */}
      <SlideOverDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedSeason ? selectedSeason.seasonName : 'Chi Tiết Vụ Mùa'}
        subtitle="Quản lý nhật ký canh tác, tự động trừ kho và ghi nhận thu hoạch"
        tabs={[
          { id: 'timeline', label: 'Tiến Độ & PHI', icon: AlertTriangle },
          { id: 'logs', label: 'Nhật Ký Hiện Trường', icon: BookOpen },
          { id: 'harvest', label: 'Ghi Nhận Thu Hoạch', icon: Apple },
        ]}
      >
        <div className="p-4 text-xs text-slate-600">
          Nội dung nhật ký canh tác, trừ kho Auto-Backflush và cảnh báo an toàn sinh học PHI.
        </div>
      </SlideOverDrawer>
    </div>
  );
}

export default FarmingOpsWorkspace;
