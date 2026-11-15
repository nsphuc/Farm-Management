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

    const isInsecureHttp =
      typeof window !== 'undefined' &&
      window.location.protocol === 'http:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1';

    if (!navigator.geolocation) {
      setLocationState((prev) => ({
        ...prev,
        isLoading: false,
        error: isInsecureHttp
          ? 'Trình duyệt chặn GPS khi kết nối qua IP mạng HTTP (hệ thống sẽ tự động sử dụng toạ độ Trang Trại).'
          : 'Trình duyệt không hỗ trợ định vị GPS.',
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
        let errMsg = `Không thể lấy tọa độ GPS: ${err.message}`;
        if (isInsecureHttp) {
          errMsg = 'Trình duyệt chặn GPS khi truy cập qua HTTP (hệ thống sẽ tự động gán toạ độ Trang Trại).';
        }
        setLocationState((prev) => ({
          ...prev,
          isLoading: false,
          error: errMsg,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  /**
   * Đóng dấu Watermark thời gian & toạ độ GPS lên Canvas rồi nén WebP/JPEG
   * Tự động scale down ảnh gốc điện thoại (12-48MP) về tối đa 1024px để tránh phình dung lượng Base64
   */
  const drawWatermarkAndFinalize = (sourceCanvasOrImage, isMirror = false) => {
    const rawWidth = sourceCanvasOrImage.videoWidth || sourceCanvasOrImage.naturalWidth || sourceCanvasOrImage.width || 1280;
    const rawHeight = sourceCanvasOrImage.videoHeight || sourceCanvasOrImage.naturalHeight || sourceCanvasOrImage.height || 720;

    const MAX_DIM = 1024;
    let width = rawWidth;
    let height = rawHeight;
    if (width > MAX_DIM || height > MAX_DIM) {
      if (width > height) {
        height = Math.round((height * MAX_DIM) / width);
        width = MAX_DIM;
      } else {
        width = Math.round((width * MAX_DIM) / height);
        height = MAX_DIM;
      }
    }

    const canvas = canvasRef.current || document.createElement('canvas');
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
    const displayLat = locationState.latitude != null ? locationState.latitude : activeFarm?.latitude;
    const displayLon = locationState.longitude != null ? locationState.longitude : activeFarm?.longitude;
    const latStr = displayLat != null ? Number(displayLat).toFixed(6) : 'N/A';
    const lonStr = displayLon != null ? Number(displayLon).toFixed(6) : 'N/A';
    const distStr = locationState.distanceM !== null ? `${locationState.distanceM}m` : '0m (Tâm Trại)';

    const barHeight = Math.max(68, Math.round(canvas.height * 0.12));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

    const titleFontSize = Math.max(14, Math.round(barHeight * 0.28));
    const subFontSize = Math.max(11, Math.round(barHeight * 0.22));

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${titleFontSize}px "Be Vietnam Pro", sans-serif`;
    ctx.fillText(`📍 ${farmName} | ${timeStr}`, 16, canvas.height - barHeight + titleFontSize + 8);

    ctx.font = `${subFontSize}px "Be Vietnam Pro", sans-serif`;
    ctx.fillStyle = locationState.isWithinGeofence ? '#34d399' : '#f87171';
    ctx.fillText(
      `Tọa độ: ${latStr}, ${lonStr} | Khoảng cách: ${distStr} (${
        locationState.isWithinGeofence ? 'Trong ranh giới' : 'NGOÀI HÀNG RÀO'
      })`,
      16,
      canvas.height - 12
    );

    // Xuất định dạng WebP nén chất lượng cao (hoặc fallback JPEG nếu WebP không khả dụng)
    canvas.toBlob(
      (blob) => {
        let dataUrl = canvas.toDataURL('image/webp', 0.75);
        if (!dataUrl || dataUrl.length < 50 || dataUrl.startsWith('data:image/png')) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        }
        setCapturedBlob(blob);
        setCapturedImage(dataUrl);
        setIsProcessing(false);
        stopCamera();
      },
      'image/webp',
      0.75
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

    const farmLat = activeFarm?.latitude ? Number(activeFarm.latitude) : 10.776889;
    const farmLon = activeFarm?.longitude ? Number(activeFarm.longitude) : 106.700806;
    const hasRealCoord = locationState.latitude != null && locationState.longitude != null;

    if (onCaptureConfirm) {
      onCaptureConfirm({
        blob: capturedBlob,
        dataUrl: capturedImage,
        location: {
          latitude: hasRealCoord ? locationState.latitude : farmLat,
          longitude: hasRealCoord ? locationState.longitude : farmLon,
          distanceM: hasRealCoord ? locationState.distanceM : 0,
          isWithinGeofence: hasRealCoord ? locationState.isWithinGeofence : true,
          isFallback: !hasRealCoord,
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
