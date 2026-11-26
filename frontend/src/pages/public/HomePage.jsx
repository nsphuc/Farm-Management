import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  Scale,
  Syringe,
  Wallet,
  Play,
  Users,
  AlertTriangle,
  ChevronRight,
  Package,
  Calendar,
  Building2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-16 lg:space-y-24 pb-20">
      {/* ================= 1. HERO SECTION (CHIA 2 CỘT) ================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 pt-12 pb-16 lg:pt-20 lg:pb-24">
        {/* Background glow decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-emerald-200/40 via-teal-100/30 to-transparent blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Cột trái: Tiêu đề + Giới thiệu + CTA Buttons */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                Giải pháp ERP Chăn nuôi Khép kín #1 Việt Nam
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Phần mềm Quản lý Trang trại <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                  Chăn nuôi Toàn diện
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Xóa bỏ hoàn toàn sổ tay ghi chép lem nhem. Số hóa từ nhập con giống, kiểm soát tiêu hao thức ăn (FCR), tự động nhắc lịch vắc-xin đến xuất chuồng cân xe và hạch toán lãi lỗ chính xác từng lứa nuôi.
              </p>

              {/* Dãy cam kết ngắn */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-1 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Dễ dùng tại chuồng trên điện thoại</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Cảnh báo thất thoát cám tức thì</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Chuẩn VietGAHP & Thú y</span>
                </div>
              </div>

              {/* 2 Nút CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-3">
                <Button
                  size="lg"
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
                >
                  Bắt đầu miễn phí ngay
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/guides')}
                  className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold border-slate-300 text-slate-700 hover:text-emerald-700 hover:bg-white rounded-xl shadow-xs"
                >
                  <Play className="w-4 h-4 mr-2 text-emerald-600 fill-emerald-600" />
                  Xem video hướng dẫn
                </Button>
              </div>
            </div>

            {/* Cột phải: Mockup Giao diện Dashboard Trang trại sắc nét */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-2xl bg-slate-900/5 p-2 ring-1 ring-slate-900/10 shadow-2xl backdrop-blur-xl">
                <div className="rounded-xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-4">
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                        🐖
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Trang trại Hòa Bình</div>
                        <div className="text-[10px] text-slate-400">Chi nhánh 1: Trại Heo Thịt</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Đang nuôi: 2.450 con
                    </span>
                  </div>

                  {/* 3 Thẻ chỉ số nhanh */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-500">Tỷ lệ sống</div>
                      <div className="text-base font-extrabold text-emerald-600">98.2%</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-500">FCR đạt</div>
                      <div className="text-base font-extrabold text-slate-800">1.72</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-500">Tồn kho cám</div>
                      <div className="text-base font-extrabold text-blue-600">130 bao</div>
                    </div>
                  </div>

                  {/* Mockup Cảnh báo thông minh */}
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                    <Syringe className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-amber-900 leading-tight">
                      <strong>Lịch tiêm phòng hôm nay:</strong> Vắc-xin Gumboro lần 2 tại Chuồng A1 (1.950 con). Cắt nước trước 2 giờ.
                    </div>
                  </div>

                  {/* Mockup Biểu đồ cám mini */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                      <span>Cám tiêu thụ: Thực tế vs Định mức</span>
                      <span className="text-emerald-700 font-bold">+1.2% (Đạt)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full w-[78%]" />
                      <div className="bg-amber-400 h-full w-[8%]" />
                    </div>
                  </div>

                  {/* Mockup Nút thao tác nhanh */}
                  <div className="pt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Cập nhật 5 phút trước</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                      Xem chi tiết <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. KHỐI 3 LĨNH VỰC CHĂN NUÔI CHUYÊN BIỆT ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tối ưu chuyên biệt cho từng loại vật nuôi
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Mỗi loài có đặc thù tăng trọng, chu kỳ dịch tễ và công thức cám riêng biệt. FarmGo cấu hình sẵn quy trình chuẩn theo từng đối tượng nuôi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Gia súc */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-2xl">
                🐷
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Gia súc (Heo thịt, Bò thịt)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Quản lý heo thịt thương phẩm từ tách mẹ đến xuất chuồng, theo dõi tăng trọng bình quân ngày (ADG), khẩu phần cám theo từng giai đoạn và phòng dịch tả heo châu Phi.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đo FCR & Cân mẫu tăng trọng ADG</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Quản lý cám cai sữa & giai đoạn vỗ béo</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tính lãi lỗ theo kg hơi xuất chuồng</span>
                </div>
              </div>
            </div>
            <div className="pt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/features')}
                className="w-full text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              >
                Khám phá giải pháp Heo thịt <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>

          {/* Card 2: Gia cầm */}
          <div className="bg-white rounded-2xl border border-emerald-300/80 p-6 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20 flex flex-col justify-between relative">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wide">
              Phổ biến nhất
            </div>
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl">
                🐔
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Gia cầm (Gà, Vịt, Ngan thịt)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Được thiết kế cho trại gà thịt 45 ngày (CP, Ross 308) và gà thả vườn. Theo dõi sát sao lượng cám theo ngày tuổi, tự động nhắc lịch uống vắc-xin và kiểm soát hao hụt.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Quy trình 45 ngày lập trình sẵn</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nhắc lịch Gumboro, Newcastle, Cúm</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cảnh báo cắn mổ, tiêu chảy E.coli</span>
                </div>
              </div>
            </div>
            <div className="pt-6">
              <Button
                size="sm"
                onClick={() => navigate('/features')}
                className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Khám phá giải pháp Gia cầm <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>

          {/* Card 3: Thủy sản */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-2xl">
                🐟
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Thủy sản (Tôm, Cá thâm canh)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Theo dõi các ao nuôi công nghiệp, kiểm soát chất lượng môi trường nước (pH, nhiệt độ, oxy hòa tan, độ kiềm), chu kỳ quạt nước và hệ số chuyển đổi thức ăn ao nuôi.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ghi nhận chỉ số nước pH & Oxy</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Quản lý men vi sinh & khoáng tạt</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tính chi phí tiền điện chạy quạt ao</span>
                </div>
              </div>
            </div>
            <div className="pt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/features')}
                className="w-full text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              >
                Khám phá giải pháp Thủy sản <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3. KHỐI 4 GIÁ TRỊ CỐT LÕI (WHY CHOOSE US) ================= */}
      <section className="bg-slate-100/60 py-16 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              4 Giá trị Cốt lõi tạo nên sự khác biệt
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Không dàn trải tính năng thừa thãi. FarmGo tập trung giải quyết đúng 4 nỗi lo lớn nhất của chủ trang trại Việt Nam.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Giá trị 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">
                Kiểm soát FCR & Cám ăn
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tự động so sánh lượng cám thực tế với định mức kỹ thuật. Cảnh báo ngay khi cám vượt ngưỡng +10% để ngăn thất thoát và rơi vãi tại máng ăn.
              </p>
            </div>

            {/* Giá trị 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Syringe className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">
                Tự động nhắc lịch Vắc-xin
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Không lo công nhân quên lịch nhỏ mắt hay tiêm phòng. Hệ thống tự động đẩy thông báo nhắc việc chính xác theo ngày tuổi của từng đàn nuôi.
              </p>
            </div>

            {/* Giá trị 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">
                Phân quyền nhân sự chặt chẽ
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Khoanh vùng dữ liệu: Công nhân chỉ thấy chuồng được phân công, ẩn 100% chi phí giá vốn và quỹ tiền tệ. Trại trưởng quản lý kỹ thuật, kế toán giữ sổ quỹ.
              </p>
            </div>

            {/* Giá trị 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">
                Hạch toán Lãi/Lỗ tức thì
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ngay khi lập phiếu xuất bán chuồng, hệ thống tự động tổng hợp chi phí cám, con giống, thuốc thú y, điện nước và nhân công để kết chuyển lãi lỗ từng lứa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4. BANNER KÊU GỌI HÀNH ĐỘNG CUỐI TRANG (BOTTOM CTA) ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-8 sm:p-12 lg:p-16 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Sẵn sàng đưa trang trại của bạn vào quy trình quản lý hiện đại?
            </h2>
            <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
              Hơn 1.200 trang trại trên khắp cả nước đã số hóa thành công với FarmGo. Khởi tạo tài khoản dùng thử miễn phí ngay hôm nay.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="px-8 py-3.5 text-sm font-bold bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl shadow-lg transition-all"
              >
                Đăng ký dùng thử miễn phí
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/contact')}
                className="px-6 py-3.5 text-sm font-semibold border-emerald-400/60 text-white hover:bg-emerald-700/60 rounded-xl"
              >
                Liên hệ tư vấn trực tiếp
              </Button>
            </div>
          </div>

          {/* Background decorative elements */}
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-15 pointer-events-none">
            <span className="text-[180px]">🐖</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
