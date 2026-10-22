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
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Can } from '@/components/common/Can';
import { Input, Select } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { AttendanceAdjustModal } from './AttendanceAdjustModal';
import { hrService } from '@/services/modules/hrService';
import { formatNumber, formatDate, formatDateTime } from '@/utils/formatters';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

function formatTime(instantStr) {
  if (!instantStr) return '—';
  const d = new Date(instantStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function AttendanceAdjustTab({ farmId, geofenceRadiusM = 300 }) {
  const { notifyDataChanged, syncTrigger } = useActiveFarmStore();
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendances, setAttendances] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Adjust modal state
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Photo Lightbox modal state
  const [lightboxData, setLightboxData] = useState(null); // { url, title, coords, distance, time }

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
  }, [farmId, workDate, syncTrigger?.employees]);

  const filteredAttendances = attendances.filter((att) => {
    if (statusFilter && att.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      att.employeeFullName?.toLowerCase().includes(q) ||
      att.employeeCode?.toLowerCase().includes(q) ||
      att.shiftName?.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      key: 'workDate',
      header: 'Ngày',
      width: '100px',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700 font-semibold">
          {row.workDate ? formatDate(row.workDate) : '—'}
        </span>
      ),
    },
    {
      key: 'employeeFullName',
      header: 'Nhân Viên',
      width: '180px',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.employeeFullName}</div>
          <div className="text-[10px] text-slate-500 font-mono">
            {row.employeeCode} {row.isSeasonal ? '(Thời vụ)' : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'shiftName',
      header: 'Ca',
      width: '120px',
      render: (row) => (
        <span className="font-medium text-xs text-slate-800">{row.shiftName || '—'}</span>
      ),
    },
    {
      key: 'checkInTime',
      header: 'Giờ Vào',
      width: '95px',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-slate-800">
          {formatTime(row.checkInTime)}
        </span>
      ),
    },
    {
      key: 'checkOutTime',
      header: 'Giờ Ra',
      width: '95px',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-slate-800">
          {formatTime(row.checkOutTime)}
        </span>
      ),
    },
    {
      key: 'photos',
      header: 'Ảnh Check-in/Out',
      width: '130px',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          {/* Ảnh Check-in */}
          {row.checkInPhotoUrl ? (
            <button
              type="button"
              onClick={() =>
                setLightboxData({
                  url: row.checkInPhotoUrl,
                  title: `Ảnh Vào Ca: ${row.employeeFullName}`,
                  coords:
                    row.gpsLatitude && row.gpsLongitude
                      ? `${row.gpsLatitude}, ${row.gpsLongitude}`
                      : null,
                  distance: row.gpsDistanceM,
                  time: row.checkInTime,
                })
              }
              className="relative group block h-8 w-8 rounded-lg overflow-hidden border border-emerald-200 bg-slate-100 shrink-0"
              title="Click xem ảnh Vào ca & GPS"
            >
              <img src={row.checkInPhotoUrl} alt="In" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Eye className="h-3 w-3" />
              </div>
            </button>
          ) : (
            <div
              className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-[9px] font-bold"
              title="Chưa có ảnh vào ca"
            >
              Vào
            </div>
          )}

          {/* Ảnh Check-out */}
          {row.checkOutPhotoUrl ? (
            <button
              type="button"
              onClick={() =>
                setLightboxData({
                  url: row.checkOutPhotoUrl,
                  title: `Ảnh Ra Ca: ${row.employeeFullName}`,
                  coords:
                    row.checkOutLatitude && row.checkOutLongitude
                      ? `${row.checkOutLatitude}, ${row.checkOutLongitude}`
                      : null,
                  distance: row.checkOutDistanceM,
                  time: row.checkOutTime,
                })
              }
              className="relative group block h-8 w-8 rounded-lg overflow-hidden border border-blue-200 bg-slate-100 shrink-0"
              title="Click xem ảnh Ra ca & GPS"
            >
              <img src={row.checkOutPhotoUrl} alt="Out" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Eye className="h-3 w-3" />
              </div>
            </button>
          ) : (
            <div
              className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-[9px] font-bold"
              title="Chưa có ảnh ra ca"
            >
              Ra
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'gpsDistance',
      header: 'Khoảng Cách GPS',
      width: '130px',
      render: (row) => {
        const inDist = row.gpsDistanceM;
        const outDist = row.checkOutDistanceM;
        return (
          <div className="text-[10px] font-mono space-y-0.5">
            {inDist !== undefined && inDist !== null ? (
              <div
                className={
                  Number(inDist) <= geofenceRadiusM
                    ? 'text-emerald-700 font-semibold'
                    : 'text-rose-600 font-bold'
                }
              >
                Vào: {Math.round(inDist)}m
              </div>
            ) : (
              <div className="text-slate-400">Vào: —</div>
            )}
            {outDist !== undefined && outDist !== null ? (
              <div
                className={
                  Number(outDist) <= geofenceRadiusM
                    ? 'text-emerald-700 font-semibold'
                    : 'text-rose-600 font-bold'
                }
              >
                Ra: {Math.round(outDist)}m
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'workingHours',
      header: 'Giờ Công TT',
      align: 'right',
      width: '105px',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-emerald-700">
          {row.workingHours ? `${formatNumber(row.workingHours, 1)}h` : '—'}
        </span>
      ),
    },
    {
      key: 'lateMinutes',
      header: 'Đi Muộn',
      align: 'center',
      width: '85px',
      render: (row) =>
        row.lateMinutes > 0 ? (
          <span className="text-xs font-bold text-amber-700 font-mono">+{row.lateMinutes}p</span>
        ) : (
          <span className="text-xs text-slate-400 font-mono">0p</span>
        ),
    },
    {
      key: 'earlyLeaveMinutes',
      header: 'Về Sớm',
      align: 'center',
      width: '85px',
      render: (row) =>
        row.earlyLeaveMinutes > 0 ? (
          <span className="text-xs font-bold text-rose-600 font-mono">-{row.earlyLeaveMinutes}p</span>
        ) : (
          <span className="text-xs text-slate-400 font-mono">0p</span>
        ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      width: '135px',
      render: (row) => (
        <div className="flex flex-col gap-1 items-start">
          <StatusBadge status={row.status || 'VALID'} size="sm" />
          {row.isAdjusted && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-bold text-purple-800 border border-purple-300"
              title={`Điều chỉnh bởi: ${row.adjustedByName || 'Quản lý'}\nLý do: ${row.adjustmentReason || '—'}`}
            >
              ĐÃ ĐIỀU CHỈNH
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      width: '140px',
      render: (row) => (
        <Can permission="PERM_HR_EMPLOYEE_MANAGE">
          <Button
            size="xs"
            variant="outline"
            icon={<Edit2 className="h-3.5 w-3.5" />}
            onClick={() => {
              setAdjustTarget(row);
              setIsAdjustModalOpen(true);
            }}
            className="text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            title="Điều chỉnh giờ công và lưu kiểm toán"
          >
            Điều Chỉnh Giờ Công
          </Button>
        </Can>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Thanh Tìm Kiếm, Chọn Ngày & Bộ Lọc */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span>Ngày:</span>
            </label>
            <Input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="w-auto text-xs"
            />
          </div>

          <div className="relative min-w-[200px]">
            <Input
              prefixIcon={<Search className="h-4 w-4 text-slate-400" />}
              placeholder="Tìm theo tên NV, mã NV..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs"
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-auto text-xs"
          >
            <option value="">-- Tất cả trạng thái --</option>
            <option value="VALID">Hợp lệ (VALID)</option>
            <option value="LATE">Đi muộn (LATE)</option>
            <option value="EARLY_DEPARTURE">Về sớm (EARLY_DEPARTURE)</option>
            <option value="OUT_OF_RANGE">Ngoài bán kính GPS (OUT_OF_RANGE)</option>
            <option value="ABSENT">Vắng mặt (ABSENT)</option>
          </Select>
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
        data={filteredAttendances}
        isLoading={isLoading}
        emptyStateProps={{
          title: 'Chưa có bản ghi chấm công nào',
          description: `Chưa có dữ liệu chấm công cá nhân hoặc điểm danh tập thể vào ngày ${formatDate(workDate)} tại trang trại này.`,
          actionLabel: 'Tải Lại',
          onAction: fetchAttendances,
        }}
      />

      {/* Modal điều chỉnh công */}
      <AttendanceAdjustModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        onSuccess={() => {
          fetchAttendances();
          notifyDataChanged?.('employees');
        }}
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
