import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { calculateHaversineDistance, formatDateTime } from '@/utils/formatters';

/**
 * SelfieCameraModal Component (Mục 2.2 File 09 & Workspace G File 08)
 * - Mở Camera trước (Selfie) hoặc camera mặc định
 * - Fallback tải ảnh từ thiết bị khi PC/Laptop không có camera hoặc bị chặn quyền
 * - Lấy tọa độ GPS trình duyệt
 * - Tính khoảng cách Haversine so với tâm trang trại và kiểm tra hàng rào Geofence
 * - Đóng dấu Watermark thời gian + tọa độ lên ảnh Canvas và nén WebP trước khi xuất file
 */
export function SelfieCameraModal({
  isOpen,
  onClose,
  onCaptureConfirm,
  title = 'Chụp Ảnh Chấm Công Hiện Trường (Selfie)',
}) {
  const { activeFarm } = useActiveFarmStore();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null); // Data URL
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [locationState, setLocationState] = useState({
    isLoading: true,
    latitude: null,
    longitude: null,
    accuracy: null,
    distanceM: null,
    isWithinGeofence: true,
    error: null,
  });
  const [cameraError, setCameraError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Khởi động Camera và GPS khi mở modal
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCapturedBlob(null);
      return;
    }

    startCamera();
    fetchLocation();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    let mediaStream = null;

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Trình duyệt không hỗ trợ truy cập Camera trực tiếp. Vui lòng sử dụng tính năng tải ảnh từ máy bên dưới.');
      return;
    }

    // Lần 1: Ưu tiên camera trước (Selfie)
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err1) {
      console.warn('Không thể mở camera facingMode user, đang thử camera mặc định...', err1);
      // Lần 2: Thử mở camera bất kỳ (webcam PC/laptop thường không có facingMode 'user')
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err2) {
        console.warn('Không thể mở camera mặc định:', err2);
      }
    }

    if (mediaStream) {
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } else {
      setCameraError('Chưa kết nối được tới camera (thiết bị không có webcam hoặc chưa cấp quyền trong trình duyệt). Bạn có thể bấm nút "Tải ảnh từ máy / Chụp ngoài" bên dưới để hoàn tất chấm công.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const fetchLocation = () => {
    setLocationState((prev) => ({ ...prev, isLoading: true, error: null }));

    if (!navigator.geolocation) {
      setLocationState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Trình duyệt không hỗ trợ định vị GPS.',
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        let dist = null;
        let within = true;

        if (activeFarm?.latitude && activeFarm?.longitude) {
          dist = calculateHaversineDistance(
            latitude,
            longitude,
            Number(activeFarm.latitude),
            Number(activeFarm.longitude)
          );
          const maxRadius = Number(activeFarm.geofenceRadiusM || 300);
          within = dist !== null && dist <= maxRadius;
        }

        setLocationState({
          isLoading: false,
          latitude,
          longitude,
          accuracy,
          distanceM: dist,
          isWithinGeofence: within,
          error: null,
        });
      },
      (err) => {
        setLocationState((prev) => ({
          ...prev,
          isLoading: false,
          error: `Không thể lấy tọa độ GPS: ${err.message}`,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  /**
   * Đóng dấu Watermark thời gian & toạ độ GPS lên Canvas rồi nén WebP
   */
  const drawWatermarkAndFinalize = (sourceCanvasOrImage, isMirror = false) => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const width = sourceCanvasOrImage.videoWidth || sourceCanvasOrImage.naturalWidth || sourceCanvasOrImage.width || 1280;
    const height = sourceCanvasOrImage.videoHeight || sourceCanvasOrImage.naturalHeight || sourceCanvasOrImage.height || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (isMirror) {
      // Lật gương để đúng chiều tự nhiên của selfie khi chụp qua webcam
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(sourceCanvasOrImage, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.drawImage(sourceCanvasOrImage, 0, 0, canvas.width, canvas.height);
    }

    // Đóng dấu Watermark thời gian & tọa độ GPS ở góc dưới
    const now = new Date();
    const timeStr = formatDateTime(now);
    const farmName = activeFarm?.farmName || activeFarm?.name || 'Trang Trại';
    const latStr = locationState.latitude ? locationState.latitude.toFixed(6) : 'N/A';
    const lonStr = locationState.longitude ? locationState.longitude.toFixed(6) : 'N/A';
    const distStr = locationState.distanceM !== null ? `${locationState.distanceM}m` : 'N/A';

    // Vẽ thanh nền mờ đen bảo đảm độ tương phản cao cho chữ
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(0, canvas.height - 90, canvas.width, 90);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.fillText(`📍 ${farmName} | ${timeStr}`, 24, canvas.height - 52);

    ctx.font = '16px monospace';
    ctx.fillStyle = locationState.isWithinGeofence ? '#34d399' : '#f87171';
    ctx.fillText(
      `Tọa độ: ${latStr}, ${lonStr} | Khoảng cách tâm trại: ${distStr} (${
        locationState.isWithinGeofence ? 'Trong ranh giới' : 'NGOÀI HÀNG RÀO'
      })`,
      24,
      canvas.height - 22
    );

    // Xuất định dạng WebP nén chất lượng cao
    canvas.toBlob(
      (blob) => {
        const dataUrl = canvas.toDataURL('image/webp', 0.85);
        setCapturedBlob(blob);
        setCapturedImage(dataUrl);
        setIsProcessing(false);
        stopCamera();
      },
      'image/webp',
      0.85
    );
  };

  /**
   * Chụp ảnh trực tiếp từ webcam
   */
  const handleCapture = () => {
    if (!videoRef.current) return;
    setIsProcessing(true);
    drawWatermarkAndFinalize(videoRef.current, true);
  };

  /**
   * Tải ảnh từ máy / Chụp ngoài hệ thống (Fallback hoàn hảo)
   */
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        drawWatermarkAndFinalize(img, false);
      };
      img.onerror = () => {
        setIsProcessing(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera();
    fetchLocation();
  };

  const handleConfirm = () => {
    if (!capturedBlob && !capturedImage) return;

    if (onCaptureConfirm) {
      onCaptureConfirm({
        blob: capturedBlob,
        dataUrl: capturedImage,
        location: {
          latitude: locationState.latitude,
          longitude: locationState.longitude,
          distanceM: locationState.distanceM,
          isWithinGeofence: locationState.isWithinGeofence,
        },
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="Hình ảnh tự động gắn thẻ thời gian thực và tọa độ GPS chống gian lận"
      size="lg"
    >
      <div className="flex flex-col gap-4">
        {/* GPS Geofence Status Banner */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-slate-700">Trạng thái định vị GPS:</span>
              {locationState.isLoading ? (
                <span className="flex items-center gap-1 text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang lấy tọa độ...
                </span>
              ) : locationState.error ? (
                <span className="text-rose-600">{locationState.error}</span>
              ) : (
                <span className="font-mono text-slate-800">
                  {locationState.latitude?.toFixed(5)}, {locationState.longitude?.toFixed(5)}
                </span>
              )}
            </div>

            <Button size="sm" variant="ghost" onClick={fetchLocation} className="h-7 px-2">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {!locationState.isLoading && locationState.distanceM !== null && (
            <div className="mt-2 flex items-center gap-2 border-t border-slate-200 pt-2 text-xs">
              {locationState.isWithinGeofence ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>
                    Hợp lệ: Cách tâm trại {locationState.distanceM}m (Giới hạn:{' '}
                    {activeFarm?.geofenceRadiusM || 300}m)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-700 font-medium">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span>
                    CẢNH BÁO: Bạn đang ở ngoài ranh giới ({locationState.distanceM}m &gt;{' '}
                    {activeFarm?.geofenceRadiusM || 300}m)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden File Input for Image Upload Fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Camera Viewport or Captured Result Preview */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-950 flex items-center justify-center shadow-inner border border-slate-800">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Selfie Check-in"
              className="h-full w-full object-cover"
            />
          ) : cameraError ? (
            <div className="p-6 text-center max-w-md">
              <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-amber-400" />
              <p className="text-xs text-amber-200/90 mb-4 leading-relaxed font-medium">
                {cameraError}
              </p>
              <Button
                variant="primary"
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
                className="bg-emerald-600 hover:bg-emerald-500 shadow-md"
              >
                Tải ảnh từ máy / Chụp bằng camera ngoài
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover scale-x-[-1]"
              />
              {/* Selfie Frame Guide */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-56 w-44 rounded-full border-2 border-dashed border-emerald-400/60 shadow-xs" />
              </div>
            </>
          )}

          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs text-white">
              <Loader2 className="h-9 w-9 animate-spin text-emerald-400 mb-2" />
              <span className="text-xs font-medium tracking-wide">Đang xử lý ảnh & đóng watermark GPS...</span>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>

          <div className="flex items-center gap-2">
            {capturedImage ? (
              <>
                <Button variant="outline" icon={RefreshCw} onClick={handleRetake}>
                  Chụp / Chọn lại
                </Button>
                <Button
                  variant="primary"
                  icon={CheckCircle2}
                  onClick={handleConfirm}
                >
                  Xác nhận ảnh này
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  icon={Upload}
                  onClick={() => fileInputRef.current?.click()}
                  title="Chọn file ảnh có sẵn trên thiết bị"
                >
                  Tải ảnh từ máy
                </Button>
                <Button
                  variant="primary"
                  icon={Camera}
                  size="lg"
                  disabled={Boolean(cameraError || isProcessing)}
                  onClick={handleCapture}
                >
                  Chụp ảnh Selfie
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default SelfieCameraModal;
