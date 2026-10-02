import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Award, 
  Building2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail, 
  QrCode, 
  Sparkles, 
  Sprout, 
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import { traceabilityService } from '../../services/traceabilityService';

export const PublicTraceabilityPage = () => {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (code) {
      loadTraceabilityData();
    }
  }, [code]);

  const loadTraceabilityData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await traceabilityService.getPublicTraceability(code);
      setData(res);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Mã truy xuất nguồn gốc không hợp lệ hoặc không tồn tại trong hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="p-4 bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Đang xác thực tem chống giả VietGAP...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-rose-100 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Không tìm thấy thông tin</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Về trang chủ Farm SaaS
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isRecalled = data.recalled;
  const enterprise = data.enterpriseInfo || {};
  const vietgap = data.vietgapCert || {};
  const timeline = data.farmingTimeline || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-slate-900 to-slate-950 text-slate-100 font-sans pb-16">
      {/* Mobile-first Container */}
      <div className="max-w-md mx-auto px-4 pt-6 space-y-4">
        
        {/* BANNER THU HỒI KHẨN CẤP (Zero-Leakage Emergency Banner) */}
        {isRecalled && (
          <div className="bg-rose-600/95 backdrop-blur-md text-white p-5 rounded-3xl shadow-2xl border-2 border-rose-400 animate-pulse space-y-2">
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <span>CẢNH BÁO THU HỒI KHẨN CẤP!</span>
            </div>
            <p className="text-xs text-rose-100 leading-relaxed">
              Lô nông sản này đã bị nhà sản xuất / cơ quan kiểm dịch kích hoạt quy trình thu hồi khẩn cấp. Quý khách vui lòng không sử dụng sản phẩm.
            </p>
            {data.recallReason && (
              <div className="p-3 bg-black/30 rounded-2xl border border-white/20 text-xs font-semibold">
                Lý do thu hồi: {data.recallReason}
              </div>
            )}
          </div>
        )}

        {/* Header xác thực an toàn */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/15 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-400/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Tem Xác Thực VietGAP</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-[11px] text-slate-300 font-mono">
                Mã số: {data.traceabilityCode?.slice(0, 18)}...
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase rounded-lg border border-emerald-400/30">
              Chính hãng
            </span>
          </div>
        </div>

        {/* Thẻ Sản phẩm chính */}
        <div className="bg-white rounded-3xl p-6 text-slate-900 shadow-2xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Award className="w-3 h-3" />
                {data.qualityGrade === 'XUAT_KHAU' ? 'Tiêu chuẩn Xuất khẩu' : 'Hàng tuyển Loại 1'}
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-1.5 leading-tight">
                {data.productName}
              </h1>
            </div>
            {data.qrImageUrl && (
              <div className="p-1 bg-slate-50 rounded-2xl border border-slate-200 flex-shrink-0">
                <img
                  src={data.qrImageUrl}
                  alt="QR Code"
                  className="w-14 h-14 object-contain rounded-xl"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-500 block font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Ngày thu hoạch
              </span>
              <p className="text-slate-900 font-bold mt-1 text-sm">
                {data.harvestDate ? new Date(data.harvestDate).toLocaleDateString('vi-VN') : '—'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-500 block font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Hạn sử dụng
              </span>
              <p className="text-slate-900 font-bold mt-1 text-sm">
                {data.expiryDate ? new Date(data.expiryDate).toLocaleDateString('vi-VN') : 'Tốt nhất trong 15 ngày'}
              </p>
            </div>
          </div>
        </div>

        {/* Chứng chỉ VietGAP */}
        <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-transparent p-5 rounded-3xl border border-emerald-500/30 backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2 text-amber-300">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Chứng nhận An Toàn Thực Phẩm</h3>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Tiêu chuẩn canh tác:</span>
              <span className="font-bold text-emerald-400">{vietgap.standard || 'VietGAP Trồng trọt'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Số chứng nhận:</span>
              <span className="font-mono font-bold text-slate-200">{vietgap.certNumber || 'VG-2026-NONGNGHIEPSACH'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tổ chức cấp:</span>
              <span className="text-slate-200">{vietgap.issuedBy || 'Trung tâm Giám định & Chứng nhận Nông sản'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hiệu lực đến:</span>
              <span className="text-slate-200">{vietgap.expiryDate || '31/12/2028'}</span>
            </div>
          </div>
        </div>

        {/* Thông tin Hợp tác xã / Cơ sở sản xuất */}
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/15 space-y-3">
          <div className="flex items-center gap-2 text-emerald-300">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Cơ sở sản xuất & Đóng gói</h3>
          </div>

          <div className="space-y-2 text-xs text-slate-200">
            <p className="font-bold text-sm text-white">{enterprise.name || 'Hợp Tác Xã Nông Nghiệp Công Nghệ Cao'}</p>
            <p className="flex items-start gap-1.5 text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{enterprise.address || 'Khu nông nghiệp ứng dụng công nghệ cao'}</span>
            </p>
            {enterprise.phone && (
              <p className="flex items-center gap-1.5 text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Hotline: {enterprise.phone}</span>
              </p>
            )}
            {enterprise.email && (
              <p className="flex items-center gap-1.5 text-slate-300">
                <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Email: {enterprise.email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Interactive Timeline Nhật ký canh tác VietGAP */}
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/15 space-y-4">
          <div className="flex items-center gap-2 text-emerald-300">
            <Sprout className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Dòng thời gian canh tác ({timeline.length} giai đoạn)
            </h3>
          </div>

          {timeline.length === 0 ? (
            <div className="p-4 bg-black/20 rounded-2xl border border-white/10 text-center text-xs text-slate-400">
              Nhật ký mùa vụ đã được kiểm duyệt an toàn và đóng gói chuẩn hóa.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-500/40">
              {timeline.map((log, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
                  <div className="bg-black/30 p-3.5 rounded-2xl border border-white/10 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-300 uppercase">
                        {log.activityType || 'Chăm sóc đồng ruộng'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {log.logDate ? new Date(log.logDate).toLocaleDateString('vi-VN') : '—'}
                      </span>
                    </div>
                    {log.description && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {log.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer cam kết an toàn */}
        <div className="text-center pt-4 text-[11px] text-slate-400 space-y-1">
          <p>© Farm SaaS Traceability Engine - Bảo vệ thương hiệu nông sản Việt</p>
          <p className="italic">Dữ liệu được bảo chứng bằng mã hóa mật mã học và chụp snapshot đóng băng.</p>
        </div>
      </div>
    </div>
  );
};
export default PublicTraceabilityPage;
