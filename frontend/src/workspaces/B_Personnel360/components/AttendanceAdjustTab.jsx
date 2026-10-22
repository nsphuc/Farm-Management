import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Image as ImageIcon,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  RefreshCw,
  Eye,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Can } from '@/components/common/Can';
import { Input } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { AttendanceAdjustModal } from './AttendanceAdjustModal';
import { hrService } from '@/services/modules/hrService';
import { formatNumber, formatDateTime } from '@/utils/formatters';

function formatTime(instantStr) {
  if (!instantStr) return '—';
  const d = new Date(instantStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function AttendanceAdjustTab({ farmId, geofenceRadiusM = 300 }) {
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendances, setAttendances] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Adjust modal state
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Photo Lightbox modal state
  const [lightboxData, setLightboxData] = useState(null); // { url, title, coords, distance }

  const fetchAttendances = async () => {
    if (!farmId) return;
    try {
      setIsLoading(true);
      const data = await hrService.getAttendances({ farmId, workDate });
      setAttendances(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch attendances error:', err);
      setAttendances([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [farmId, workDate]);

  const columns = [
    {
      key: 'employeeFullName',
      header: 'Nhân Viên',
      width: '180px',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.employeeFullName}</div>
          <div className="text-[10px] text-slate-500 font-mono">{row.employeeCode}</div>
        </div>
      ),
    },
    {
      key: 'shiftName',
      header: 'Ca Làm Việc',
      width: '130px',
      render: (row) => <span className="font-medium text-slate-700">{row.shiftName || '—'}</span>,
    },
    {
      key: 'checkInTime',
      header: 'Giờ Vào Ca',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.checkInPhotoUrl ? (
            <button
              type="button"
              onClick={() =>
                setLightboxData({
                  url: row.checkInPhotoUrl,
                  title: `Ảnh Selfie Vào Ca: ${row.employeeFullName}`,
                  coords: row.gpsLatitude && row.gpsLongitude ? `${row.gpsLatitude}, ${row.gpsLongitude}` : null,
                  distance: row.gpsDistanceM,
                  time: row.checkInTime,
                })
              }
              className="relative group block h-8 w-8 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0"
              title="Click xem ảnh to và GPS"
            >
              <img src={row.checkInPhotoUrl} alt="CheckIn" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Eye className="h-3.5 w-3.5" />
              </div>
            </button>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
              <ImageIcon className="h-4 w-4" />
            </div>
          )}
          <div>
            <span className="font-mono font-bold text-slate-800 block">{formatTime(row.checkInTime)}</span>
            {row.gpsDistanceM !== undefined && row.gpsDistanceM !== null && (
              <span
                className={`text-[10px] font-mono font-medium ${
                  Number(row.gpsDistanceM) <= geofenceRadiusM ? 'text-emerald-600' : 'text-rose-600 font-bold'
                }`}
              >
                {Math.round(row.gpsDistanceM)}m
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'checkOutTime',
      header: 'Giờ Ra Ca',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.checkOutPhotoUrl ? (
            <button
              type="button"
              onClick={() =>
                setLightboxData({
                  url: row.checkOutPhotoUrl,
                  title: `Ảnh Selfie Ra Ca: ${row.employeeFullName}`,
                  coords:
                    row.checkOutLatitude && row.checkOutLongitude
                      ? `${row.checkOutLatitude}, ${row.checkOutLongitude}`
                      : null,
                  distance: row.checkOutDistanceM,
                  time: row.checkOutTime,
                })
              }
              className="relative group block h-8 w-8 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0"
              title="Click xem ảnh to và GPS"
            >
              <img src={row.checkOutPhotoUrl} alt="CheckOut" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Eye className="h-3.5 w-3.5" />
              </div>
            </button>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
              <ImageIcon className="h-4 w-4" />
            </div>
          )}
          <div>
            <span className="font-mono font-bold text-slate-800 block">{formatTime(row.checkOutTime)}</span>
            {row.checkOutDistanceM !== undefined && row.checkOutDistanceM !== null && (
              <span
                className={`text-[10px] font-mono font-medium ${
                  Number(row.checkOutDistanceM) <= geofenceRadiusM ? 'text-emerald-600' : 'text-rose-600 font-bold'
                }`}
              >
                {Math.round(row.checkOutDistanceM)}m
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'workingHours',
      header: 'Giờ Làm',
      align: 'right',
      render: (row) => (
        <span className="font-mono font-bold text-emerald-700">
          {row.workingHours ? `${formatNumber(row.workingHours, 1)}h` : '—'}
        </span>
      ),
    },
    {
      key: 'lateMinutes',
      header: 'Đi Muộn / Về Sớm',
      align: 'center',
      render: (row) => (
        <div className="text-xs">
          {row.lateMinutes > 0 && (
            <span className="text-amber-700 font-bold block">+{row.lateMinutes}m trễ</span>
          )}
          {row.earlyLeaveMinutes > 0 && (
            <span className="text-rose-600 font-bold block">-{row.earlyLeaveMinutes}m sớm</span>
          )}
          {!row.lateMinutes && !row.earlyLeaveMinutes && <span className="text-slate-400 font-mono">—</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      render: (row) => (
        <div className="flex flex-col gap-1 items-start">
          <StatusBadge status={row.status || 'VALID'} size="sm" />
          {row.isAdjusted && (
            <div
              className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[9px] font-bold text-purple-700 border border-purple-200"
              title={`Điều chỉnh bởi: ${row.adjustedByName || 'Quản lý'}\nLý do: ${row.adjustmentReason || '—'}`}
            >
              <span>ĐÃ ĐIỀU CHỈNH</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      render: (row) => (
        <Can permission="PERM_HR_EMPLOYEE_MANAGE">
          <Button
            size="sm"
            variant="outline"
            icon={<Edit2 className="h-3.5 w-3.5" />}
            onClick={() => {
              setAdjustTarget(row);
              setIsAdjustModalOpen(true);
            }}
          >
            Điều Chỉnh
          </Button>
        </Can>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Bộ lọc theo ngày & Làm mới */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span>Ngày làm việc:</span>
          </label>
          <Input
            type="date"
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
            className="w-auto"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={fetchAttendances}
          isLoading={isLoading}
        >
          Làm Mới
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={attendances}
        isLoading={isLoading}
        emptyStateProps={{
          title: 'Chưa có bản ghi chấm công nào',
          description: `Chưa có nhân viên nào chấm công vào ngày ${workDate} tại trang trại này.`,
          actionLabel: 'Tải Lại',
          onAction: fetchAttendances,
        }}
      />

      {/* Modal điều chỉnh công */}
      <AttendanceAdjustModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        onSuccess={fetchAttendances}
        attendance={adjustTarget}
      />

      {/* Modal phóng to ảnh Selfie & GPS Lightbox */}
      {lightboxData && (
        <Modal
          isOpen={Boolean(lightboxData)}
          onClose={() => setLightboxData(null)}
          size="md"
          title={lightboxData.title}
          subtitle={formatDateTime(lightboxData.time)}
          icon={<ImageIcon className="h-5 w-5 text-emerald-600" />}
        >
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black flex items-center justify-center max-h-[420px]">
              <img
                src={lightboxData.url}
                alt="Selfie Zoom"
                className="max-h-[420px] w-full object-contain"
              />
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Tọa độ GPS xác thực:
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {lightboxData.coords || 'Chưa định vị được'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Khoảng cách tới tâm trang trại:</span>
                <span
                  className={`font-mono font-bold ${
                    lightboxData.distance !== undefined && Number(lightboxData.distance) <= geofenceRadiusM
                      ? 'text-emerald-700'
                      : 'text-rose-600'
                  }`}
                >
                  {lightboxData.distance !== undefined
                    ? `${Math.round(lightboxData.distance)} mét (Bán kính cho phép: ${geofenceRadiusM}m)`
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AttendanceAdjustTab;
