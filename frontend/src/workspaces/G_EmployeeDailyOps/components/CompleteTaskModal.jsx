import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  Save,
  AlertCircle,
  Camera,
  Upload,
  X,
  Maximize2,
  RefreshCw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Textarea } from '@/components/ui/FormControls';
import { hrService } from '@/services/modules/hrService';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { formatDateTime } from '@/utils/formatters';

export function CompleteTaskModal({
  isOpen,
  onClose,
  onSuccess,
  task = null,
}) {
  const [completionNotes, setCompletionNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [actualQuantity, setActualQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && task) {
      setActualQuantity(task.standardQuantity ? String(task.standardQuantity) : '');
    }
  }, [isOpen, task]);

  // Chế độ mở Camera trực tiếp
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [previewZoomImage, setPreviewZoomImage] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCompletionNotes('');
      setPhotos([]);
      setError(null);
      setCameraError(null);
      setPreviewZoomImage(null);
    }
  }, [isOpen]);

  // Dọn dẹp stream camera khi đóng modal hoặc unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError('Trình duyệt không hỗ trợ truy cập camera trực tiếp. Vui lòng tải ảnh từ thiết bị.');
        return;
      }
      // Ưu tiên camera sau (môi trường / hiện trường) cho thiết bị di động
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (e1) {
        // Fallback camera mặc định
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Lỗi mở camera:', err);
      setCameraError('Không thể mở camera (chưa cấp quyền hoặc thiết bị không có camera). Bạn có thể bấm "Tải ảnh từ máy" bên dưới.');
      setIsCameraActive(false);
    }
  };

  // Chụp ảnh từ Camera trực tiếp & đóng dấu Watermark thời gian
  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Đóng dấu Watermark thời gian thực
    const nowStr = formatDateTime(new Date());
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(10, canvas.height - 35, canvas.width - 20, 25);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`📍 Nghiệm thu hiện trường • ${nowStr} • Task #${task?.id || ''}`, 20, canvas.height - 18);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhotos((prev) => [...prev, dataUrl]);
    stopCamera();
  };

  // Tải ảnh từ thư viện thiết bị / chụp ngoài
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const resultUrl = uploadEvent.target?.result;
        if (resultUrl) {
          setPhotos((prev) => [...prev, resultUrl]);
        }
      };
      reader.readAsDataURL(file);
    });
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Ảnh thực tế nông trường mẫu (hỗ trợ test nhanh tiện dụng trên PC khi không gắn camera)
  const handleAddSamplePhoto = () => {
    const samplePhotos = [
      'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
    ];
    const nextPhoto = samplePhotos[photos.length % samplePhotos.length];
    setPhotos((prev) => [...prev, nextPhoto]);
  };

  const handleRemovePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // RÀNG BUỘC CHẶT CHẼ THEO YÊU CẦU:
    // 1. Nội dung báo cáo không được để trống (tối thiểu 5 ký tự)
    if (!completionNotes || completionNotes.trim().length < 5) {
      setError('Bắt buộc: Vui lòng nhập nội dung báo cáo kết quả công việc (tối thiểu 5 ký tự)!');
      return;
    }

    // 2. Ảnh chụp hiện trường không được bỏ trống (ít nhất 1 ảnh minh chứng)
    if (!photos || photos.length === 0) {
      setError('Bắt buộc: Phải đính kèm ít nhất 1 ảnh chụp hiện trường minh chứng công việc đã làm xong!');
      return;
    }

    try {
      setIsSubmitting(true);

      const photosJson = JSON.stringify(photos);

      await hrService.updateTaskStatus(task.id, {
        status: 'PENDING_REVIEW',
        completionNotes: completionNotes.trim(),
        photosJson,
        actualQuantity: actualQuantity ? Number(actualQuantity) : null,
      });

      const store = useActiveFarmStore.getState();
      store.notifyDataChanged?.('all');
      store.notifyDataChanged?.('employees');
      store.notifyDataChanged?.('tasks');

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Complete task error:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi gửi báo cáo hoàn thành nhiệm vụ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        title="Báo Cáo Hoàn Thành Nhiệm Vụ"
        subtitle={`Chụp ảnh minh chứng hiện trường & gửi Quản lý nghiệm thu • Việc: ${task.taskTitle}`}
        icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 font-semibold shadow-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Tóm tắt nhiệm vụ */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Nhiệm vụ:</span>
              <span className="font-extrabold text-slate-900">{task.taskTitle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Phân khu thực hiện:</span>
              <span className="font-bold text-slate-800">{task.zoneName || 'Toàn trại'}{task.locationName ? ` • ${task.locationName}` : ''}</span>
            </div>
          </div>

          {/* Xác nhận vật tư tiêu hao thực tế nếu có */}
          {(task.materialId || task.materialName) && (
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>Vật Tư Xuất Kho & Tiêu Hao Thực Tế:</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-700">
                <div>
                  <span className="font-semibold text-slate-900">{task.materialName}</span>
                  {task.warehouseName && <span className="text-slate-500"> (Tại: {task.warehouseName})</span>}
                  {task.standardQuantity && (
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Định mức cấu hình: <strong>{task.standardQuantity} {task.materialUnit || ''}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-semibold text-slate-800">Thực dùng:</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={actualQuantity}
                    onChange={(e) => setActualQuantity(e.target.value)}
                    placeholder="Số lượng"
                    className="w-24 h-8 px-2 border border-amber-300 rounded-lg text-xs font-bold text-amber-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-600">{task.materialUnit || 'Đơn vị'}</span>
                </div>
              </div>
              <p className="text-[10px] text-amber-800 italic">
                * Khi quản lý nghiệm thu đạt, hệ thống sẽ tự động tạo phiếu xuất kho và hạch toán chi phí theo số lượng thực dùng này.
              </p>
            </div>
          )}

          {/* Ghi chú kết quả - Bắt buộc */}
          <FormField
            label="Nội Dung Báo Cáo Kết Quả Thực Hiện"
            required
            hint="Mô tả cụ thể khối lượng công việc hoàn thành, tình trạng cây trồng/vật nuôi sau khi thao tác."
          >
            <Textarea
              rows={3}
              value={completionNotes}
              onChange={(e) => {
                setCompletionNotes(e.target.value);
                if (error) setError(null);
              }}
              placeholder="VD: Đã bón phân NPK đều cho các luống dưa lưới nhà A1, kiểm tra hệ thống tưới hoạt động tốt, cây xanh khỏe không dập nát..."
              required
            />
          </FormField>

          {/* KHỐI CHỤP ẢNH & ĐÍNH KÈM MINH CHỨNG HIỆN TRƯỜNG */}
          <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-emerald-600" />
                <span>Ảnh Chụp Hiện Trường Nghiệm Thu <span className="text-rose-500 font-bold">*</span></span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.2 font-bold">
                  {photos.length} ảnh
                </span>
              </label>

              {/* Nút hành động chụp ảnh */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  icon={<Camera className="h-3.5 w-3.5" />}
                  onClick={startCamera}
                >
                  Mở Camera Chụp
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold"
                  icon={<Upload className="h-3.5 w-3.5" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Tải Ảnh Máy
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-[11px] text-slate-500 hover:text-emerald-700 font-medium"
                  icon={<Sparkles className="h-3 w-3 text-amber-500" />}
                  onClick={handleAddSamplePhoto}
                  title="Thêm ảnh mẫu nông trường để test nhanh khi không có webcam"
                >
                  Ảnh Mẫu
                </Button>
              </div>
            </div>

            {/* Input file ẩn */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Khung Camera trực tiếp khi bật */}
            {isCameraActive && (
              <div className="rounded-xl border-2 border-emerald-500 bg-black p-2 space-y-2 text-center animate-fade-in">
                <div className="relative aspect-video max-h-[260px] mx-auto overflow-hidden rounded-lg bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    onLoadedMetadata={() => videoRef.current?.play()}
                  />
                  <div className="absolute top-2 left-2 rounded-md bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                    Camera Hiện Trường Đang Mở
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 font-black text-xs px-5 py-2 shadow-md"
                    icon={<Camera className="h-4 w-4" />}
                    onClick={handleCaptureSnapshot}
                  >
                    📸 BẤM CHỤP ẢNH
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-white border-white/40 hover:bg-white/20 text-xs"
                    onClick={stopCamera}
                  >
                    Hủy Camera
                  </Button>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>{cameraError}</span>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            {/* Danh sách ảnh chụp đã đính kèm */}
            {photos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                {photos.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-slate-300 aspect-video bg-slate-900 shadow-2xs"
                  >
                    <img src={url} alt={`Evidence ${idx + 1}`} className="h-full w-full object-cover" />
                    
                    {/* Nút xem to */}
                    <button
                      type="button"
                      onClick={() => setPreviewZoomImage(url)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>

                    {/* Nút xóa ảnh */}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs hover:bg-rose-700 transition-colors z-10"
                      title="Xóa ảnh này"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-rose-300 bg-rose-50/40 p-4 text-center text-xs text-rose-700 space-y-1">
                <Camera className="h-6 w-6 mx-auto text-rose-400" />
                <p className="font-bold">Chưa có ảnh hiện trường nào được đính kèm!</p>
                <p className="text-[11px] text-slate-500">
                  Bấm <strong>"Mở Camera Chụp"</strong> hoặc <strong>"Tải Ảnh Máy"</strong> để bổ sung ảnh nghiệm thu (bắt buộc).
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
              Đóng
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Save className="h-4 w-4" />}
              isLoading={isSubmitting}
              loadingText="Đang gửi nghiệm thu..."
              className="bg-emerald-600 hover:bg-emerald-700 font-black shadow-md text-white"
            >
              Gửi Báo Cáo Nghiệm Thu
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lightbox Phóng To Ảnh */}
      {previewZoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-black border border-white/20 p-2 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewZoomImage(null)}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/70 text-white hover:bg-black flex items-center justify-center z-10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewZoomImage}
              alt="Phóng to ảnh nghiệm thu"
              className="max-h-[85vh] w-auto max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default CompleteTaskModal;
