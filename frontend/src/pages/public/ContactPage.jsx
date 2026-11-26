import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  HelpCircle,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    livestockType: 'POULTRY_MEAT',
    herdSize: 'MEDIUM',
    notes: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      alert('Vui lòng nhập Họ tên và Số điện thoại liên hệ!');
      return;
    }
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      phone: '',
      livestockType: 'POULTRY_MEAT',
      herdSize: 'MEDIUM',
      notes: '',
    });
    setIsSubmitted(false);
  };

  return (
    <div className="space-y-16 py-12 pb-24">
      {/* ================= HEADER TRANG LIÊN HỆ ================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wide">
          <Phone className="w-3.5 h-3.5" />
          Đồng hành cùng Nhà nông 24/7
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
          Liên hệ Tư vấn & Trải nghiệm Trực tiếp
        </h1>
        <p className="text-base text-slate-600 max-w-2xl mx-auto">
          Đội ngũ chuyên viên kỹ thuật nông nghiệp của FarmGo luôn sẵn sàng tư vấn giải pháp tối ưu cho từng mô hình chuồng trại.
        </p>
      </section>

      {/* ================= BỐ CỤC 2 CỘT CÂN ĐỐI ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Cột trái: Thông tin Kết nối & Hỗ trợ (5/12) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">
                Kênh Hỗ trợ Trực tiếp
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Chúng tôi hiểu rằng dịch bệnh và sự cố chuồng trại không thể chờ đợi. Các kênh liên lạc luôn có kỹ sư trực ca.
              </p>
            </div>

            <div className="space-y-6">
              {/* Hotline */}
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Tổng đài hỗ trợ kỹ thuật (24/7)</span>
                  <strong className="text-base text-slate-900 font-extrabold block">1900 6868 (Nhánh 2)</strong>
                  <span className="text-xs text-slate-500">Cước phí viễn thông tiêu chuẩn</span>
                </div>
              </div>

              {/* Zalo */}
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Zalo Kỹ thuật viên phụ trách chuồng</span>
                  <strong className="text-base text-slate-900 font-extrabold block">0988 123 456</strong>
                  <span className="text-xs text-slate-500">Hỗ trợ gửi hình ảnh bệnh tích & đơn thuốc</span>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Hòm thư điện tử</span>
                  <strong className="text-sm text-slate-900 font-bold block">hotro@farmgo.vn</strong>
                  <span className="text-xs text-slate-500">kinhdoanh@farmgo.vn (Hợp tác chuỗi)</span>
                </div>
              </div>

              {/* Giờ làm việc */}
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Thời gian phục vụ</span>
                  <strong className="text-sm text-slate-900 font-bold block">07:30 - 21:00</strong>
                  <span className="text-xs text-slate-500">Làm việc cả Thứ 7, Chủ nhật và ngày Lễ</span>
                </div>
              </div>

              {/* Địa chỉ */}
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Trụ sở & Văn phòng đại diện</span>
                  <strong className="text-xs text-slate-800 font-bold block leading-relaxed">
                    Hà Nội: Tòa nhà Nông Nghiệp Số, Cầu Giấy, Hà Nội
                  </strong>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    TP.HCM: Tòa nhà Innovation, Khu Công nghệ cao, TP. Thủ Đức
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Form Đăng ký Tư vấn & Đặt lịch Demo (7/12) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
            {isSubmitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Gửi yêu cầu thành công!
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Cảm ơn chủ trại <strong>{formData.fullName}</strong>. Chuyên viên nông nghiệp của FarmGo sẽ liên hệ lại qua số điện thoại/Zalo <strong>{formData.phone}</strong> trong vòng 15 phút.
                </p>
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="text-xs font-semibold text-emerald-700 border-emerald-300"
                  >
                    Gửi thêm yêu cầu khác
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Đăng ký Tư vấn & Đặt lịch Hướng dẫn Demo
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Điền thông tin trang trại của bạn để nhận tài liệu quy trình dinh dưỡng và bản dùng thử phù hợp.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Họ tên */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Họ và tên chủ trại / Người quản lý <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Văn Nam"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Số điện thoại / Zalo */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Số điện thoại (Zalo nhận tài liệu) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="VD: 0988 444 888"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Loại vật nuôi chính */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Loại vật nuôi chính
                    </label>
                    <select
                      value={formData.livestockType}
                      onChange={(e) => setFormData({ ...formData, livestockType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    >
                      <option value="POULTRY_MEAT">Gà thịt / Vịt thịt / Ngan thịt</option>
                      <option value="SWINE_MEAT">Heo thịt thương phẩm (3 Máu)</option>
                      <option value="CATTLE_MEAT">Bò thịt / Bò vỗ béo</option>
                      <option value="AQUACULTURE">Thủy sản (Tôm / Cá ao thâm canh)</option>
                      <option value="MIXED">Nuôi kết hợp đa con</option>
                    </select>
                  </div>

                  {/* Quy mô đàn */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Quy mô đàn hiện tại
                    </label>
                    <select
                      value={formData.herdSize}
                      onChange={(e) => setFormData({ ...formData, herdSize: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    >
                      <option value="SMALL">Dưới 500 con (Gia đình)</option>
                      <option value="MEDIUM">500 - 2.000 con (Gia trại)</option>
                      <option value="LARGE">2.000 - 10.000 con (Trang trại vừa)</option>
                      <option value="VERY_LARGE">Trên 10.000 con (Trang trại lớn / Chuỗi)</option>
                    </select>
                  </div>
                </div>

                {/* Nội dung cần hỗ trợ */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Nhu cầu cần hỗ trợ hoặc vấn đề lớn nhất tại chuồng
                  </label>
                  <textarea
                    rows={3}
                    placeholder="VD: Cần kiểm soát hao hụt cám, cần kết nối cân điện tử hoặc phân công công nhân..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl shadow-md shadow-emerald-600/20"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Gửi yêu cầu tư vấn & Nhận tài liệu
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContactPage;
