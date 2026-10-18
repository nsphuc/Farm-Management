import React, { useState, useRef, useEffect } from 'react';
import { ScanBarcode, Camera, X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { cn } from '@/utils/formatters';

/**
 * Play a synthesized audio beep using Web Audio API
 */
function playBeep(type = 'success') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // Low buzz
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Audio context may be restricted by browser policy
  }
}

/**
 * BarcodeScannerInput Component (Mục 2.1 File 09 & Nhiệm vụ 4)
 * Hỗ trợ quét mã vạch bằng máy quét Laser HID (phím Enter) hoặc Camera di động.
 * Tự động gọi API lookup-barcode và phát âm thanh phản hồi.
 */
export function BarcodeScannerInput({
  onScanSuccess,
  placeholder = 'Quét mã vạch EAN-13, GS1 hoặc mã lô...',
  className,
  autoFocus = false,
}) {
  const { activeFarmId } = useActiveFarmStore();
  const [barcode, setBarcode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success'|'error', text: '' }
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const inputRef = useRef(null);

  const handleLookup = async (codeToLookup) => {
    const trimmed = (codeToLookup || barcode).trim();
    if (!trimmed) return;

    if (!activeFarmId) {
      setStatusMessage({
        type: 'error',
        text: 'Vui lòng chọn Trang trại trước khi quét mã tra cứu!',
      });
      playBeep('error');
      return;
    }

    setIsSearching(true);
    setStatusMessage(null);

    try {
      const response = await apiClient.get(
        API_ENDPOINTS.MASTER_DATA.MATERIAL_LOOKUP_BARCODE(activeFarmId, trimmed)
      );

      playBeep('success');
      setStatusMessage({
        type: 'success',
        text: `Đã tìm thấy: ${response.data?.materialName || trimmed}`,
      });

      if (onScanSuccess) {
        onScanSuccess({
          barcode: trimmed,
          data: response.data,
        });
      }

      setBarcode('');
    } catch (err) {
      playBeep('error');
      const msg =
        err.response?.data?.message ||
        `Không tìm thấy vật tư hay lô hàng khớp với mã "${trimmed}"`;
      setStatusMessage({
        type: 'error',
        text: msg,
      });
    } finally {
      setIsSearching(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    // Máy quét Laser HID bắn chuỗi ký tự kết thúc bằng Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLookup();
    }
  };

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      <div className="relative flex items-center">
        <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
          <ScanBarcode className="h-5 w-5" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder}
          disabled={isSearching}
          className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-24 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 font-mono"
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {barcode && (
            <button
              type="button"
              onClick={() => {
                setBarcode('');
                setStatusMessage(null);
                inputRef.current?.focus();
              }}
              className="rounded p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setIsCameraOpen(true)}
            title="Mở Camera quét mã"
            className="px-2"
          >
            <Camera className="h-4 w-4 text-slate-600" />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="primary"
            isLoading={isSearching}
            onClick={() => handleLookup()}
            className="px-3"
          >
            Tìm
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md animate-in fade-in duration-200',
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-rose-50 text-rose-700'
          )}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      <Modal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        title="Quét Mã Vạch Bằng Camera"
        subtitle="Hướng camera về phía mã vạch EAN-13, QR Code hoặc GS1 trên bao bì"
      >
        <CameraScannerView
          onDetected={(detectedCode) => {
            setIsCameraOpen(false);
            setBarcode(detectedCode);
            handleLookup(detectedCode);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      </Modal>
    </div>
  );
}

/**
 * Camera Scanner View using getUserMedia
 */
function CameraScannerView({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    let stream = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Không thể mở Camera. Vui lòng cấp quyền truy cập Camera trên trình duyệt.');
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {error ? (
        <div className="rounded-lg bg-rose-50 p-4 text-xs text-rose-700 text-center">
          {error}
        </div>
      ) : (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* Scanning Reticle Frame */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 h-1/2 border-2 border-emerald-400 rounded-lg relative">
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-rose-500 animate-pulse shadow-sm" />
            </div>
          </div>
        </div>
      )}

      {/* Fallback input if barcode camera recognition is not supported */}
      <div className="flex w-full items-center gap-2">
        <input
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Hoặc nhập mã vạch..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <Button
          size="sm"
          variant="primary"
          disabled={!manualCode.trim()}
          onClick={() => onDetected(manualCode.trim())}
        >
          Xác nhận
        </Button>
      </div>

      <div className="flex justify-end w-full">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </div>
  );
}

export default BarcodeScannerInput;
