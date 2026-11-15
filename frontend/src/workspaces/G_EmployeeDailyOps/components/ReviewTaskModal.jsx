import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Camera,
  MapPin,
  Users,
  Maximize2,
  X,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Textarea } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { hrService } from '@/services/modules/hrService';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

export function ReviewTaskModal({
  isOpen,
  onClose,
  onSuccess,
  task = null,
}) {
  const { userInfo, isOwner, isFarmManager } = useAuthStore();
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [previewZoomImage, setPreviewZoomImage] = useState(null);

  if (!task) return null;

  // Giải mã photosJson
  let photoUrls = [];
  try {
    if (task.photosJson) {
      photoUrls = typeof task.photosJson === 'string' ? JSON.parse(task.photosJson) : task.photosJson;
      if (!Array.isArray(photoUrls)) {
        photoUrls = [task.photosJson];
      }
    }
  } catch (e) {
    photoUrls = [];
  }

  // KIỂM TRA LUẬT MAKER-CHECKER (Người thực hiện không được tự duyệt)
  const currentUserId = userInfo?.id ? Number(userInfo.id) : null;
  const currentEmpId = userInfo?.employeeId ? Number(userInfo.employeeId) : null;

  // 1. Nhận diện Cấp Quản Lý Phê Duyệt Cao Nhất (Farm Manager / Farm Owner / Super Admin)
  const isManagerOrOwner = Boolean(
    (isOwner && isOwner()) ||
    (isFarmManager && isFarmManager(task.farmId)) ||
    userInfo?.role === 'ROLE_FARM_MANAGER' ||
    userInfo?.role === 'ROLE_FARM_OWNER' ||
    userInfo?.role === 'ROLE_SUPER_ADMIN' ||
    userInfo?.operationalRole === 'FARM_MANAGER' ||
    userInfo?.operationalRole === 'OWNER' ||
    userInfo?.position === 'FARM_MANAGER' ||
    userInfo?.assignedRole === 'FARM_MANAGER' ||
    userInfo?.roles?.some?.((r) => {
      const code = typeof r === 'string' ? r : (r?.code || r?.name);
      return (
        code === 'ROLE_FARM_MANAGER' ||
        code === 'ROLE_FARM_OWNER' ||
        code === 'ROLE_SUPER_ADMIN' ||
        code === 'FARM_MANAGER'
      );
    })
  );

  // 2. Người thực hiện chính (Leader / Trưởng nhóm được giao nhiệm vụ)
  const isMainExecutor = Boolean(
    (currentUserId && task.assignedToUserId && Number(task.assignedToUserId) === currentUserId) ||
    (currentEmpId && task.assignedToEmployeeId && Number(task.assignedToEmployeeId) === currentEmpId)
  );

  // 3. Nằm trong tổ thực hiện
  const isInAssigneesList = Boolean(
    task.assignees &&
    Array.isArray(task.assignees) &&
    task.assignees.some((a) => {
      const matchUser = currentUserId && a.userId && Number(a.userId) === currentUserId;
      const matchEmp = currentEmpId && a.employeeId && Number(a.employeeId) === currentEmpId;
      return matchUser || matchEmp;
    })
  );

  // 4. ĐÁNH GIÁ LUẬT MAKER-CHECKER:
  // - Nếu là Farm Manager / Farm Owner:
  //   + Có đầy đủ thẩm quyền kiểm tra ảnh và duyệt nghiệm thu (DONE) cho mọi công việc do cấp dưới (Kỹ sư / Tổ trưởng / Công nhân) thực hiện.
  //   + Chỉ bị coi là vi phạm nếu chính Farm Manager tự làm công việc cá nhân một mình (không có bất kỳ cấp dưới nào làm).
  // - Nếu là Kỹ sư (Tech Lead / Zone Manager) hoặc Công nhân:
  //   + Nếu là người thực hiện chính (isMainExecutor) hoặc nằm trong tổ làm (isInAssigneesList):
  //     -> BỊ CẤM TỰ DUYỆT! Bắt buộc phải để Farm Manager duyệt.
  let isMakerViolation = false;

  if (isManagerOrOwner) {
    const hasOtherExecutors = Boolean(
      (task.assignedToEmployeeId && Number(task.assignedToEmployeeId) !== currentEmpId) ||
      (task.assignedToUserId && Number(task.assignedToUserId) !== currentUserId) ||
      (task.assignees && task.assignees.some((a) => {
        const otherEmp = currentEmpId && a.employeeId && Number(a.employeeId) !== currentEmpId;
        const otherUser = currentUserId && a.userId && Number(a.userId) !== currentUserId;
        return otherEmp || otherUser;
      }))
    );
    // Nếu có nhân sự cấp dưới (Tech / Worker) thực hiện -> Farm Manager là Checker độc lập, KHÔNG vi phạm
    isMakerViolation = isMainExecutor && !hasOtherExecutors;
  } else {
    // Kỹ sư / Công nhân trực tiếp làm -> Bị cấm tự duyệt nghiệm thu chính mình
    isMakerViolation = isMainExecutor || isInAssigneesList;
  }

  // Duyệt nghiệm thu đạt -> DONE
  const handleApprove = async () => {
    if (isMakerViolation) {
      setError('Vi phạm quy tắc Maker-Checker: Bạn không thể tự phê duyệt nhiệm vụ do chính mình thực hiện!');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const finalNote = reviewNote.trim()
        ? `Đã nghiệm thu: ${reviewNote.trim()}`
        : 'Đã nghiệm thu đạt chuẩn chất lượng thực địa';

      await hrService.updateTaskStatus(task.id, {
        status: 'DONE',
        completionNotes: task.completionNotes
          ? `${task.completionNotes} [Ghi chú duyệt: ${finalNote}]`
          : finalNote,
        photosJson: task.photosJson,
      });

      const store = useActiveFarmStore.getState();
      store.notifyDataChanged?.('all');
      store.notifyDataChanged?.('tasks');
      store.notifyDataChanged?.('employees');

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Approve task error:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi duyệt nghiệm thu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Yêu cầu làm lại -> IN_PROGRESS
  const handleReject = async () => {
    if (!reviewNote.trim()) {
      setError('Vui lòng nhập lý do yêu cầu làm lại để nhân sự khắc phục');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await hrService.updateTaskStatus(task.id, {
        status: 'IN_PROGRESS',
        completionNotes: `${task.completionNotes || ''} [Yêu cầu làm lại: ${reviewNote.trim()}]`,
        photosJson: task.photosJson,
      });

      const store = useActiveFarmStore.getState();
      store.notifyDataChanged?.('all');
      store.notifyDataChanged?.('tasks');

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Reject task error:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi trả lại nhiệm vụ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        title="Nghiệm Thu Nhiệm Vụ Hiện Trường"
        subtitle={`Kiểm tra báo cáo thực địa & ảnh chụp trước khi xác nhận hoàn thành`}
        icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
      >
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 font-semibold shadow-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* CẢNH BÁO MAKER-CHECKER KHI TECH / NGƯỜI ĐƯỢC GIAO CỐ DUYỆT */}
          {isMakerViolation && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2.5 shadow-xs">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-amber-950 uppercase tracking-wide text-[11px] block">
                  Luật Kiểm Soát Maker-Checker (Chống Tự Phê Duyệt)
                </span>
                <p className="text-amber-800 leading-relaxed">
                  Bạn là người trực tiếp được giao (hoặc nằm trong tổ thực hiện) nhiệm vụ này.
                  Hệ thống <strong>không cho phép bạn tự duyệt nghiệm thu công việc của chính mình</strong>.
                </p>
                <p className="text-[11px] font-semibold text-amber-900">
                  👉 Vui lòng để Giám đốc trại (Farm Manager) hoặc người giám sát độc lập kiểm tra ảnh và duyệt hoàn thành.
                </p>
              </div>
            </div>
          )}

          {/* Thông tin tóm tắt nhiệm vụ */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900 text-sm">{task.taskTitle}</span>
              <span className="rounded bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5">
                CHỜ NGHIỆM THU
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>Khu vực: <strong>{task.zoneName || 'Toàn trại'}{task.locationName ? ` • ${task.locationName}` : ''}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <span>Người thực hiện: <strong>{task.assignedToEmployeeName || 'Nhân sự trại'}</strong></span>
              </div>
            </div>
          </div>

          {/* Ghi chú kết quả của nhân viên */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Báo Cáo Kết Quả Từ Hiện Trường:</label>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 leading-relaxed min-h-[60px] whitespace-pre-line">
              {task.completionNotes ? (
                task.completionNotes
              ) : (
                <span className="italic text-slate-400">Không có ghi chú chi tiết kèm theo.</span>
              )}
            </div>
          </div>

          {/* Ảnh chụp hiện trường nghiệm thu - Bấm vào mở to Lightbox */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-emerald-600" />
                <span>Ảnh Chụp Báo Cáo Hiện Trường ({photoUrls.length} ảnh):</span>
              </label>
              <span className="text-[11px] text-slate-400 italic">Bấm vào ảnh để phóng to</span>
            </div>

            {photoUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photoUrls.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPreviewZoomImage(url)}
                    className="group relative block aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-2xs hover:shadow-md transition-all text-left"
                  >
                    <img src={url} alt={`Evidence ${idx + 1}`} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity gap-1">
                      <Maximize2 className="h-4 w-4" />
                      <span>Xem phóng to</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                Nhân viên không đính kèm ảnh hiện trường.
              </div>
            )}
          </div>

          {/* Nhận xét nghiệm thu của Quản lý / Kỹ thuật / Thủ kho */}
          <FormField label="Ý Kiến Nghiệm Thu Của Quản Lý / Thủ Kho">
            <Textarea
              rows={2}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Ghi nhận khối lượng thực tế, đánh giá chất lượng hoàn thành hoặc lý do yêu cầu làm lại..."
            />
          </FormField>

          {/* Nút hành động */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 font-semibold"
              icon={<XCircle className="h-4 w-4" />}
              onClick={handleReject}
              disabled={isSubmitting}
            >
              Yêu Cầu Làm Lại
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
                Đóng
              </Button>
              <Can permission="PERM_TASK_ASSIGN" role={['ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF']} farmRole={['FARM_MANAGER', 'ZONE_MANAGER', 'TECHNICAL_LEAD', 'WAREHOUSE_KEEPER']}>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className={`${
                    isMakerViolation
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed border-slate-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md'
                  }`}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  onClick={handleApprove}
                  disabled={isSubmitting || isMakerViolation}
                  isLoading={isSubmitting}
                  loadingText="Đang duyệt..."
                  title={isMakerViolation ? 'Bạn không thể tự duyệt nhiệm vụ của chính mình (Maker-Checker)' : 'Duyệt nghiệm thu đạt'}
                >
                  ✅ Duyệt Nghiệm Thu (DONE)
                </Button>
              </Can>
            </div>
          </div>
        </div>
      </Modal>

      {/* Lightbox Phóng To Ảnh Toàn Màn Hình */}
      {previewZoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-black border border-white/20 p-2 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewZoomImage(null)}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/70 text-white hover:bg-black flex items-center justify-center z-10 transition-colors shadow-lg"
              title="Đóng xem to"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewZoomImage}
              alt="Phóng to ảnh nghiệm thu thực địa"
              className="max-h-[85vh] w-auto max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default ReviewTaskModal;
