import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Camera, Check, Clock, MapPin, Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Textarea } from '@/components/ui/FormControls';
import { Can } from '@/components/common/Can';
import { hrService } from '@/services/modules/hrService';

export function ReviewTaskModal({
  isOpen,
  onClose,
  onSuccess,
  task = null,
}) {
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

  // Duyệt nghiệm thu đạt -> DONE
  const handleApprove = async () => {
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
      setError('Vui lòng nhập lý do yêu cầu làm lại để nhân viên khắc phục');
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
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Thông tin tóm tắt nhiệm vụ */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">{task.taskTitle}</span>
            <span className="rounded bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5">
              CHỜ NGHIỆM THU
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>Khu vực: <strong>{task.zoneName || 'Toàn trại'}</strong></span>
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
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 leading-relaxed min-h-[60px]">
            {task.completionNotes ? (
              task.completionNotes
            ) : (
              <span className="italic text-slate-400">Không có ghi chú chi tiết kèm theo.</span>
            )}
          </div>
        </div>

        {/* Ảnh chụp hiện trường nghiệm thu */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Camera className="h-4 w-4 text-emerald-600" />
            <span>Ảnh Chụp Báo Cáo Hiện Trường ({photoUrls.length} ảnh):</span>
          </label>

          {photoUrls.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photoUrls.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs hover:shadow-md transition-shadow"
                >
                  <img src={url} alt={`Evidence ${idx + 1}`} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                    Xem ảnh lớn ↗
                  </div>
                </a>
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
            className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
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
                className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                icon={<CheckCircle2 className="h-4 w-4" />}
                onClick={handleApprove}
                isLoading={isSubmitting}
                loadingText="Đang duyệt..."
              >
                ✅ Duyệt Nghiệm Thu (DONE)
              </Button>
            </Can>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ReviewTaskModal;
