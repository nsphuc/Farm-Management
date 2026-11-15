import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField, Input } from '@/components/ui/FormControls';
import { uploadService } from '@/services/modules/uploadService';
import { toast } from '@/store/useToastStore';

export function ImageUploadField({
  value = '',
  onChange,
  label = 'Ảnh Đại Diện (Hình Ảnh Giống)',
  error,
  hint = 'Hỗ trợ tải tệp ảnh từ máy tính (JPG, PNG, WEBP) hoặc dán đường dẫn URL trực tiếp.',
  disabled = false,
}) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Xử lý chọn tệp từ máy tính
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tập tin hình ảnh hợp lệ (JPG, PNG, WEBP, GIF)');
      return;
    }

    // Giới hạn kích thước 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 10MB');
      return;
    }

    setIsUploading(true);
    setImageError(false);

    try {
      // 1. Tải lên máy chủ qua API Upload
      const res = await uploadService.uploadImage(file);
      if (res?.url) {
        onChange?.(res.url);
        toast.success('Đã tải ảnh lên máy chủ thành công!');
      }
    } catch (err) {
      console.warn('Upload API failed, falling back to local Base64 data URI:', err);
      // 2. Dự phòng: Chuyển sang Base64 Data URI để người dùng không bao giờ bị gián đoạn
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const base64Url = loadEvt.target?.result;
        if (base64Url) {
          onChange?.(base64Url);
          toast.success('Đã tải và đính kèm ảnh từ máy tính!');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    onChange?.('');
    setImageError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <FormField label={label} error={error} hint={hint}>
      {/* Ẩn file input để kích hoạt bằng nút */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div className="space-y-3">
        {/* Hàng điều khiển nút tải ảnh và nhập URL */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            isLoading={isUploading}
            icon={isUploading ? <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> : <Upload className="h-4 w-4 text-emerald-600" />}
            className="shrink-0 border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-semibold shadow-2xs"
          >
            {isUploading ? 'Đang tải lên...' : 'Tải Ảnh Từ Máy'}
          </Button>

          <div className="flex-1 min-w-0">
            <Input
              value={value || ''}
              onChange={(e) => {
                setImageError(false);
                onChange?.(e.target.value);
              }}
              placeholder="Hoặc dán URL ảnh tại đây: https://..."
              disabled={disabled || isUploading}
              className="text-xs"
            />
          </div>

          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={disabled || isUploading}
              className="text-rose-600 hover:bg-rose-50 border-rose-200 shrink-0"
              title="Xóa ảnh"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Khung xem trước hình ảnh */}
        {value ? (
          <div className="relative flex items-center gap-3.5 p-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/60 to-slate-50 shadow-2xs animate-in fade-in duration-200">
            <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-emerald-300 bg-white shadow-xs">
              {!imageError ? (
                <img
                  src={value}
                  alt="Ảnh giống"
                  onError={() => setImageError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center bg-rose-50 text-rose-500 text-[10px] p-1 text-center font-bold">
                  <AlertCircle className="h-4 w-4 mb-0.5" />
                  Lỗi link
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Ảnh đại diện giống đã sẵn sàng</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-mono">
                {value.startsWith('data:') ? 'Ảnh tệp Base64 từ máy tính' : value}
              </p>
              <span className="text-[10px] text-slate-400 block">
                Ảnh này sẽ tự động gắn vào Lô thu hoạch & Tem QR truy xuất nguồn gốc.
              </span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl bg-slate-50/60 hover:bg-emerald-50/30 cursor-pointer transition-colors group"
          >
            <div className="h-9 w-9 rounded-full bg-white shadow-2xs border border-slate-200 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <ImageIcon className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-800">
              Bấm để chọn tệp ảnh từ máy tính
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              PNG, JPG, WEBP tối đa 10MB
            </span>
          </div>
        )}
      </div>
    </FormField>
  );
}

export default ImageUploadField;

