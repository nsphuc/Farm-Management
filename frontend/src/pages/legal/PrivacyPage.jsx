import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-6 sm:p-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Chính Sách Quyền Riêng Tư & Bảo Mật Dữ Liệu (Privacy Policy)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Cam kết bảo mật thông tin tài chính, nhân sự và vị trí GPS nông trường
            </p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>1. Thu Thập Dữ Liệu Vị Trí Địa Lý (GPS Geofencing)</span>
            </h2>
            <p>
              Hệ thống chỉ yêu cầu quyền truy cập vị trí địa lý của thiết bị khi nhân sự thực hiện thao tác Chấm công vào ca / Chấm công tan ca trên ứng dụng di động. Tọa độ GPS thu thập được chỉ dùng để đối chiếu với bán kính địa giới trang trại (Geofence Radius), hoàn toàn không thực hiện theo dõi hành trình cá nhân của người lao động sau giờ làm việc.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>2. Bảo Mật Xác Thực & Mã Hóa Đường Truyền</span>
            </h2>
            <p>
              Tất cả các phiên làm việc đều được xác thực bằng JSON Web Token (JWT) lưu trữ an toàn trong HttpOnly Cookie nhằm ngăn ngừa tấn công XSS. Mọi giao dịch truyền dữ liệu giữa trình duyệt của người dùng và máy chủ đều được mã hóa bằng chuẩn TLS 1.3 / SSL 256-bit.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>3. Quyền Kiểm Soát Dữ Liệu Của Khách Hàng (GDPR Compliance)</span>
            </h2>
            <p>
              Người dùng có toàn quyền yêu cầu trích xuất toàn bộ dữ liệu nông trại dưới dạng file mở (Excel, CSV, JSON) hoặc yêu cầu xóa dữ liệu định kỳ khi chấm dứt hợp đồng sử dụng dịch vụ nền tảng.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
