import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Camera,
  Flag,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CheckSquare,
  Square,
  AlertCircle,
  Building2,
  Filter,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/FormControls';
import { SelfieCameraModal } from '@/components/common/SelfieCameraModal';
import { hrService } from '@/services/modules/hrService';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { formatTime } from '@/utils/formatters';
import { toast } from '@/store/useToastStore';

/**
 * Khối 2: Bảng Điểm Danh & Chấm Công Tổ Hộ Nhân Viên Không Có Tài Khoản (Batch Roll-Call)
 * Dành riêng cho Role 2 (Farm Manager), Role 3 (Trưởng Kỹ Thuật), Role 4 (Thủ Kho)
 */
export function TeamRollCallPanel({
  activeFarm,
  shifts = [],
  employees = [],
  todayAttendances = [],
  onRefresh,
}) {
  const { isFarmManager, isTechnicalLead, isWarehouseKeeper, isZoneManager } = useAuthStore();
  const { syncTrigger } = useActiveFarmStore();
  const farmManager = isFarmManager();
  const technicalLead = isTechnicalLead();
  const warehouseKeeper = isWarehouseKeeper();
  const zoneManager = isZoneManager ? isZoneManager(activeFarm?.id) : false;

  // Tự động re-fetch khi có tín hiệu đồng bộ nhân sự / chấm công liên Workspace
  useEffect(() => {
    if (syncTrigger?.all || syncTrigger?.employees || syncTrigger?.attendance || syncTrigger?.zones) {
      onRefresh?.();
    }
  }, [syncTrigger?.all, syncTrigger?.employees, syncTrigger?.attendance, syncTrigger?.zones]);

  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState('CHECK_IN'); // 'CHECK_IN' | 'CHECK_OUT'
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Mặc định chọn ca đầu tiên nếu chưa chọn
  const currentShiftId = selectedShiftId || (shifts[0]?.id ? String(shifts[0].id) : '');

  // Lọc danh sách nhân viên theo vai trò và ưu tiên lao động thời vụ / không tài khoản
  const filteredEmployees = useMemo(() => {
    // 1. Chỉ lấy nhân viên thuộc farm hiện tại
    const inFarm = employees.filter(
      (e) => !activeFarm?.id || e.farmId === activeFarm.id || !e.farmId
    );

    // 2. Lọc theo chuyên môn:
    // - Role 4 (Thủ kho): Lọc nhân sự kho vận + lao động không tài khoản
    // - Role 3 / Trưởng phân khu (Zone Manager / Trưởng kỹ thuật): Lọc nhân sự kỹ thuật / đồng ruộng / phân khu + lao động không tài khoản
    // - Role 2 (Farm Manager): Xem toàn bộ nhân sự trang trại
    let scoped = inFarm;
    if (warehouseKeeper && !farmManager) {
      scoped = inFarm.filter((e) => {
        const pos = (e.position || '').toUpperCase();
        const dept = (e.department || '').toLowerCase();
        return (
          e.userId === null ||
          pos === 'SEASONAL_NO_ACCOUNT' ||
          pos.includes('WAREHOUSE') ||
          dept.includes('kho')
        );
      });
    } else if ((technicalLead || zoneManager) && !farmManager) {
      scoped = inFarm.filter((e) => {
        const pos = (e.position || '').toUpperCase();
        const dept = (e.department || '').toLowerCase();
        return (
          e.userId === null ||
          pos === 'SEASONAL_NO_ACCOUNT' ||
          pos.includes('TECH') ||
          pos.includes('ZONE') ||
          pos.includes('FIELD') ||
          pos.includes('AGRONOMIST') ||
          pos.includes('VET') ||
          dept.includes('kỹ thuật') ||
          dept.includes('sản xuất') ||
          dept.includes('hiện trường')
        );
      });
    }

    // 3. Sắp xếp: Ưu tiên người KHÔNG CÓ TÀI KHOẢN (userId == null) lên đầu bảng
    return [...scoped].sort((a, b) => {
      const aNoAcc = a.userId == null || a.position === 'SEASONAL_NO_ACCOUNT' ? 0 : 1;
      const bNoAcc = b.userId == null || b.position === 'SEASONAL_NO_ACCOUNT' ? 0 : 1;
      return aNoAcc - bNoAcc;
    });
  }, [employees, activeFarm, warehouseKeeper, technicalLead, zoneManager, farmManager]);

  // Trạng thái điểm danh hôm nay của từng nhân viên
  const getEmployeeAttendanceStatus = (empId) => {
    const att = todayAttendances.find((a) => a.employeeId === empId);
    if (!att || !att.checkInTime) {
      return {
        code: 'NOT_CHECKED_IN',
        label: 'Chưa điểm danh',
        color: 'bg-slate-100 text-slate-600 border-slate-200',
      };
    }
    if (att.checkInTime && !att.checkOutTime) {
      return {
        code: 'IN_PROGRESS',
        label: `Đã vào ca (${formatTime(att.checkInTime)})`,
        color: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
      };
    }
    return {
      code: 'COMPLETED',
      label: `Đã ra ca (${att.workingHours || 0}h)`,
      color: 'bg-blue-50 text-blue-800 border-blue-300 font-bold',
    };
  };

  const handleToggleAll = () => {
    if (selectedIds.length === filteredEmployees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map((e) => e.id));
    }
  };

  const handleToggleOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStartRollCall = (action) => {
    if (selectedIds.length === 0) {
      toast.error('Vui lòng tích chọn ít nhất 1 công nhân có mặt trong danh sách!');
      return;
    }
    if (!currentShiftId) {
      toast.error('Vui lòng chọn Ca làm việc để tiến hành điểm danh!');
      return;
    }
    setPendingAction(action);
    setIsCameraOpen(true);
  };

  const handleCaptureConfirm = async (captureResult) => {
    if (!activeFarm?.id) {
      toast.error('Không tìm thấy thông tin trang trại tác nghiệp!');
      return;
    }

    const photoUrl = captureResult?.dataUrl || captureResult?.photoDataUrl || '';
    const latitude = captureResult?.location?.latitude ?? captureResult?.latitude ?? 0;
    const longitude = captureResult?.location?.longitude ?? captureResult?.longitude ?? 0;

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const payload = {
        farmId: activeFarm.id,
        shiftId: Number(currentShiftId),
        workDate: new Date().toISOString().split('T')[0],
        actionType: pendingAction,
        employeeIds: selectedIds,
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6)),
        photoUrl: photoUrl || `https://images.nongtrai.vn/rollcall/batch_${Date.now()}.jpg`,
        notes: notes.trim() || null,
      };

      const res = await hrService.batchRollCall(payload);

      setFeedback({
        type: 'success',
        message: `Đã điểm danh ${
          pendingAction === 'CHECK_IN' ? 'VÀO CA' : 'TAN CA'
        } thành công cho ${res?.successCount || selectedIds.length} nhân sự!`,
      });

      // Tải lại dữ liệu chấm công & kích hoạt bus đồng bộ liên Workspace
      onRefresh?.();
      const store = useActiveFarmStore.getState();
      store.notifyDataChanged?.('all');
      store.notifyDataChanged?.('employees');
      store.notifyDataChanged?.('attendance');
      setIsCameraOpen(false);
    } catch (err) {
      console.error('Batch roll-call error:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Lỗi thực hiện điểm danh tập thể',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      {/* Tiêu Đề Khối 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Khối 2: Bảng Điểm Danh & Chấm Công Tổ Hộ Lao Động Không Có Tài Khoản
              </h2>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-300">
                {zoneManager ? 'Trưởng Phân Khu / Tổ Trưởng' : technicalLead ? 'Trưởng Kỹ Thuật' : warehouseKeeper ? 'Thủ Kho' : 'Quản Lý Trại'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Chụp ảnh nhóm công nhân tại đồng ruộng / kho hàng và gửi chấm công GPS tập thể cho người làm cỏ, bốc xếp, quét dọn
            </p>
          </div>
        </div>

        {/* Chọn Ca Làm Việc */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Ca Làm Việc:</span>
          <Select
            value={currentShiftId}
            onChange={(e) => setSelectedShiftId(e.target.value)}
            className="w-auto min-w-[190px] text-xs font-semibold"
          >
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.shiftName} ({s.startTime} - {s.endTime})
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Thông Báo Phản Hồi */}
      {feedback && (
        <div
          className={`flex items-center gap-2.5 rounded-xl p-3 text-xs animate-in fade-in ${
            feedback.type === 'success'
              ? 'border border-emerald-300 bg-emerald-50 text-emerald-900 font-bold'
              : 'border border-rose-200 bg-rose-50 text-rose-700 font-medium'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Toolbar Thao Tác Chọn Nhanh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleAll}
            className="flex items-center gap-1.5 font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
          >
            {selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0 ? (
              <CheckSquare className="h-4 w-4 text-emerald-600" />
            ) : (
              <Square className="h-4 w-4 text-slate-400" />
            )}
            <span>
              {selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0
                ? 'Bỏ chọn tất cả'
                : 'Chọn tất cả người có mặt'}
            </span>
          </button>

          <span className="text-slate-400">|</span>

          <span className="text-slate-600">
            Đã chọn:{' '}
            <strong className="text-emerald-700 font-bold">
              {selectedIds.length} / {filteredEmployees.length}
            </strong>{' '}
            nhân sự
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ghi chú vị trí luống / kho (tùy chọn)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white w-64 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Danh Sách Nhân Viên Thuộc Tổ */}
      <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
        {filteredEmployees.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Chưa có nhân viên nào phù hợp trong bộ phận của bạn tại trang trại này
          </div>
        ) : (
          filteredEmployees.map((emp) => {
            const isSelected = selectedIds.includes(emp.id);
            const statusInfo = getEmployeeAttendanceStatus(emp.id);
            const isNoAccount = emp.userId == null || emp.position === 'SEASONAL_NO_ACCOUNT';

            return (
              <div
                key={emp.id}
                onClick={() => handleToggleOne(emp.id)}
                className={`flex items-center justify-between p-3 transition-colors cursor-pointer ${
                  isSelected ? 'bg-emerald-50/70' : 'bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <CheckSquare className="h-4 w-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs truncate">
                        {emp.fullName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {emp.employeeCode}
                      </span>
                      {isNoAccount ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Không tài khoản Web
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500">
                          {emp.position || 'Nhân viên'}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {emp.department || 'Tổ sản xuất hiện trường'} • SĐT: {emp.phone || '—'}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${statusInfo.color}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2 Nút Hành Động Lớn */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
        <button
          type="button"
          onClick={() => handleStartRollCall('CHECK_IN')}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
        >
          <Camera className="h-5 w-5 shrink-0" />
          <span>📸 Chụp Ảnh Tổ & Điểm Danh VÀO CA ({selectedIds.length} người)</span>
        </button>

        <button
          type="button"
          onClick={() => handleStartRollCall('CHECK_OUT')}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-amber-600/25 transition-all cursor-pointer disabled:opacity-50"
        >
          <Flag className="h-5 w-5 shrink-0" />
          <span>🏁 Chụp Ảnh Tổ & Điểm Danh TAN CA ({selectedIds.length} người)</span>
        </button>
      </div>

      {/* Modal Chụp Ảnh Chấm Công Tổ Watermark GPS */}
      <SelfieCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        title={
          pendingAction === 'CHECK_IN'
            ? `Chụp Ảnh Tổ Công Nhân — Điểm Danh VÀO CA (${selectedIds.length} người)`
            : `Chụp Ảnh Tổ Công Nhân — Điểm Danh TAN CA (${selectedIds.length} người)`
        }
        targetFarmCoords={
          activeFarm?.latitude && activeFarm?.longitude
            ? {
                latitude: Number(activeFarm.latitude),
                longitude: Number(activeFarm.longitude),
                radiusM: activeFarm.geofenceRadiusM || 300,
              }
            : null
        }
        onCaptureConfirm={handleCaptureConfirm}
      />
    </div>
  );
}

export default TeamRollCallPanel;
