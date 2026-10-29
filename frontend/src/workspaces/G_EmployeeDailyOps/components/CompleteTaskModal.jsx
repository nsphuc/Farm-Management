import React, { useState } from 'react';
import { CheckCircle2, Save, AlertCircle, Camera, Image as ImageIcon, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Textarea } from '@/components/ui/FormControls';
import { hrService } from '@/services/modules/hrService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';


export function CompleteTaskModal({
  isOpen,
  onClose,
  onSuccess,
  task = null,
}) {
  const [completionNotes, setCompletionNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleAddSamplePhoto = () => {
    // Demo gắn ảnh hiện trường mẫu nếu không có camera vật lý
    const samplePhotos = [
      'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80',
    ];
    const nextPhoto = samplePhotos[photos.length % samplePhotos.length];
    setPhotos([...photos, nextPhoto]);
  };

  const handleRemovePhoto = (idx) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!completionNotes.trim()) {
      setError('Vui lòng nhập ghi chú kết quả công việc đã thực hiện');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Định dạng photosJson chuẩn mảng URL string hoặc schema
      const photosJson = JSON.stringify(photos);

      await hrService.updateTaskStatus(task.id, {
        status: 'PENDING_REVIEW',
        completionNotes: completionNotes.trim(),
        photosJson,
      });

      const store = useActiveFarmStore.getState();
      store.notifyDataChanged?.('all');
      store.notifyDataChanged?.('employees');
      store.notifyDataChanged?.('tasks');

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Complete task error:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi báo cáo hoàn thành nhiệm vụ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Báo Cáo Hoàn Thành Nhiệm Vụ"
      subtitle={`Gửi nghiệm thu cho Quản lý • Việc: ${task.taskTitle}`}
      icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Nhiệm vụ:</span>
            <span className="font-bold text-slate-900">{task.taskTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Khu vực:</span>
            <span className="font-medium text-slate-800">{task.zoneName || 'Toàn trại'}</span>
          </div>
        </div>

        <FormField label="Ghi Chú Kết Quả Công Việc" required>
          <Textarea
            rows={3}
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            placeholder="Mô tả khối lượng công việc đã hoàn thành, vật tư đã tiêu hao, phát hiện sâu bệnh nếu có..."
          />
        </FormField>

        {/* Đính kèm ảnh hiện trường nghiệm thu */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-emerald-600" />
              <span>Ảnh Chụp Hiện Trường Nghiệm Thu (photosJson)</span>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Camera className="h-3.5 w-3.5" />}
              onClick={handleAddSamplePhoto}
            >
              + Chụp / Đính Kèm Ảnh
            </Button>
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {photos.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100"
                >
                  <img src={url} alt={`Evidence ${idx}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
              Chưa có ảnh hiện trường nào được đính kèm.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={<Save className="h-4 w-4" />}
            isLoading={isSubmitting}
            loadingText="Đang gửi nghiệm thu..."
          >
            Gửi Nghiệm Thu (PENDING_REVIEW)
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CompleteTaskModal;
