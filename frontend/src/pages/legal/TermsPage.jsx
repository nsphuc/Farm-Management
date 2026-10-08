import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

export const TermsPage = () => {
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
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Điều Khoản Dịch Vụ Nền Tảng (Terms of Service)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Hiệu lực từ tháng 10/2026 • Áp dụng cho Hệ thống Quản trị Nông nghiệp Đa Khách Thuê (SaaS)
            </p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>1. Quy Định Chung & Kiến Trúc Multi-Tenant</span>
            </h2>
            <p>
              Nền tảng Farm SaaS Platform cung cấp giải pháp chuyển đổi số toàn diện cho các hợp tác xã, trang trại thông minh và doanh nghiệp nông nghiệp. Bằng việc truy cập hoặc sử dụng hệ thống, bạn cam kết tuân thủ các nguyên tắc bảo mật và phân quyền được quy định trong tài liệu này. Mỗi tổ chức (Tenant) được cấp không gian dữ liệu riêng biệt và cô lập logic hoàn toàn thông qua cơ chế The Farm Barrier.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>2. Quyền Sở Hữu Dữ Liệu & Bản Quyền</span>
            </h2>
            <p>
              Tất cả dữ liệu sản xuất, lịch trình mùa vụ, nhật ký nhật trình canh tác VietGAP, hồ sơ gia súc RFID, thông tin kho bãi và chứng từ kế toán thuộc quyền sở hữu duy nhất của Trang trại và Doanh nghiệp đăng ký thuê bao. Nhà cung cấp dịch vụ cam kết không sử dụng dữ liệu sản xuất của khách hàng cho mục đích thương mại ngoài phạm vi hỗ trợ kỹ thuật và vận hành hệ thống.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>3. Trách Nhiệm Về Tem Truy Xuất Nguồn Gốc (Traceability)</span>
            </h2>
            <p>
              Chủ trang trại và Kỹ thuật viên chịu trách nhiệm về tính trung thực của các thông tin được mã hóa vào mã QR công khai (nhật ký bón phân, phun thuốc BVTV, thời gian cách ly PHI). Hệ thống lưu vết điện tử (Audit Log) bất biến và sẽ kích hoạt cơ chế thu hồi lô hàng khẩn cấp (Recall) nếu phát hiện hành vi gian dối số liệu.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>4. Cam Kết Mức Độ Dịch Vụ (SLA & Uptime)</span>
            </h2>
            <p>
              Chúng tôi cam kết duy trì độ khả dụng của hệ thống tối thiểu 99.9% hàng tháng, đảm bảo khả năng kết nối thời gian thực qua giao thức WebSocket và đồng bộ ngoại tuyến PWA đối với nhân sự làm việc tại các vùng canh tác thiếu sóng viễn thông.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
