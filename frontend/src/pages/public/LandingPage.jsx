import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Layers, 
  Package, 
  ShoppingCart, 
  BookOpen, 
  Truck, 
  DollarSign, 
  Cpu, 
  Building2, 
  ClipboardEdit, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Activity,
  HeartPulse,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function LandingPage() {
  const navigate = useNavigate();

  // 10 Tính năng chăn nuôi cốt lõi theo đúng Nhiệm vụ 1
  const coreFeatures = [
    {
      id: 'herd',
      title: '1. Quản lý bầy đàn',
      icon: Users,
      badge: 'Trọng tâm',
      color: 'from-amber-500 to-orange-500',
      description: 'Theo dõi đàn heo thịt, đàn gia cầm từ lúc nhập con giống đến xuất bán. Đo lường tỷ lệ tăng trọng FCR, số lượng con sống/chết và phân loại thể trọng.',
    },
    {
      id: 'inventory',
      title: '2. Quản lý tồn kho',
      icon: Package,
      badge: 'Tự động',
      color: 'from-blue-500 to-indigo-500',
      description: 'Quản lý kho cám hỗn hợp, thức ăn đậm đặc, thuốc thú y, vắc-xin theo hạn sử dụng và thẻ tai RFID. Cảnh báo sắp hết hàng và cận hạn dùng.',
    },
    {
      id: 'sales',
      title: '3. Quản lý bán hàng',
      icon: ShoppingCart,
      badge: 'Thương mại',
      color: 'from-emerald-500 to-teal-500',
      description: 'Lập đơn bán gia súc, gia cầm xuất chuồng theo khối lượng cân xe thực tế. Quản lý hợp đồng thương lái, biểu giá thị trường và xuất hóa đơn B2B.',
    },
    {
      id: 'cashflow',
      title: '4. Sổ quỹ',
      icon: DollarSign,
      badge: 'Tài chính',
      color: 'from-emerald-600 to-green-600',
      description: 'Quản lý toàn diện dòng tiền thực tế tại trang trại: Phiếu thu, phiếu chi, quỹ tiền mặt và tài khoản ngân hàng. Báo cáo dòng tiền thu chi minh bạch.',
    },
    {
      id: 'procurement',
      title: '5. Quản lý nhập hàng',
      icon: Truck,
      badge: 'Vật tư',
      color: 'from-purple-500 to-pink-500',
      description: 'Quản lý hóa đơn nhập con giống (CP, Japfa, Dabaco), nhập cám nhà máy và thuốc thú y. Đối soát công nợ phải trả nhà cung cấp tự động.',
    },
    {
      id: 'labor',
      title: '6. Quản lý nhân công',
      icon: Users,
      badge: 'Nhân sự',
      color: 'from-sky-500 to-cyan-500',
      description: 'Phân công kỹ thuật viên và công nhân phụ trách từng dãy chuồng nuôi cụ thể. Quản lý ca trực đêm chuồng đẻ, an toàn sinh học và sát trùng.',
    },
    {
      id: 'payroll',
      title: '7. Bảng lương',
      icon: TrendingUp,
      badge: 'Tính lương',
      color: 'from-rose-500 to-red-500',
      description: 'Tổng hợp ngày công chấm công thực tế, tính phụ cấp độc hại môi trường chăn nuôi, thưởng năng suất xuất chuồng và xuất phiếu lương tự động.',
    },
    {
      id: 'equipment',
      title: '8. Quản lý thiết bị',
      icon: Cpu,
      badge: 'IoT & Giàn lạnh',
      color: 'from-violet-500 to-indigo-600',
      description: 'Theo dõi tình trạng hoạt động của giàn lạnh chuồng kín, quạt thông gió công nghiệp, máng ăn tự động, cảm biến nhiệt độ - độ ẩm môi trường chuồng.',
    },
    {
      id: 'branches',
      title: '9. Quản lý chi nhánh',
      icon: Building2,
      badge: 'Đa cơ sở',
      color: 'from-teal-600 to-emerald-700',
      description: 'Dễ dàng mở rộng và giám sát tập trung nhiều chi nhánh, cụm trang trại chăn nuôi độc lập trên cùng một nền tảng quản trị duy nhất.',
    },
    {
      id: 'logs',
      title: '10. Ghi nhật ký',
      icon: ClipboardEdit,
      badge: 'Sổ điện tử',
      color: 'from-amber-600 to-yellow-600',
      description: 'Nhật ký chăn nuôi điện tử VietGAHP: Ghi nhận lượng cám cho ăn hàng ngày, lịch tiêm phòng vắc-xin, triệu chứng bệnh và biện pháp can thiệp thú y.',
    },
  ];

  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in duration-300">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>Phiên Bản Chuyên Biệt Cho Trang Trại Chăn Nuôi 2026</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Số Hóa Toàn Diện Trang Trại{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
            Gia Súc & Gia Cầm
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Giải pháp ERP điện tử khép kín: Giám sát bầy đàn, quản lý thức ăn & vắc-xin, 
          hạch toán giá thành xuất chuồng và bán hàng tự động cho các cơ sở và hộ kinh doanh chăn nuôi.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            size="lg"
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/30 px-6 py-3"
          >
            Đăng ký trải nghiệm ngay
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              const el = document.getElementById('features-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto text-sm font-semibold border-slate-300 text-slate-700 rounded-xl px-6 py-3 hover:bg-slate-100"
          >
            Khám phá 10 tính năng
          </Button>
        </div>

        {/* Highlight Trust Badges */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Chuẩn An toàn Sinh học VietGAHP</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Chống Thất Thoát Thức Ăn & Thuốc</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span>Tối Ưu Chỉ Số Tăng Trọng FCR</span>
          </div>
        </div>
      </section>

      {/* Features Section (10 Tính năng) */}
      <section id="features-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Hệ Thống Tính Năng
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            10 Tính Năng Quản Trị Chăn Nuôi Cốt Lõi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Đáp ứng đầy đủ mọi nghiệp vụ thực tế từ khâu con giống, thức ăn, chuồng trại cho đến kế toán dòng tiền.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreFeatures.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${f.color} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {f.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Guide Section */}
      <section id="guide-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl space-y-6">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Hướng Dẫn Khởi Tạo
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              3 Bước Đơn Giản Để Bắt Đầu Với FarmGo
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Bạn không cần cài đặt phần mềm phức tạp. Chỉ cần một tài khoản và 2 phút thiết lập cơ sở chăn nuôi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-2">
              <span className="text-2xl font-black text-emerald-400">01</span>
              <h4 className="text-sm font-bold text-white">Đăng Ký Tài Khoản</h4>
              <p className="text-xs text-emerald-200">
                Đăng ký bằng họ tên, số điện thoại và email @gmail.com xác thực mã OTP nhanh chóng.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-2">
              <span className="text-2xl font-black text-emerald-400">02</span>
              <h4 className="text-sm font-bold text-white">Tạo Cơ Sở Chăn Nuôi</h4>
              <p className="text-xs text-emerald-200">
                Nhập địa chỉ, loại hình Cá nhân kinh doanh, chọn lĩnh vực Gia súc (Heo thịt) hoặc Gia cầm.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-2">
              <span className="text-2xl font-black text-emerald-400">03</span>
              <h4 className="text-sm font-bold text-white">Trải Nghiệm Demo</h4>
              <p className="text-xs text-emerald-200">
                Chọn gói dùng thử demo miễn phí và bắt đầu quản lý đàn vật nuôi ngay trên điện thoại hoặc máy tính.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact-section" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Cần Tư Vấn Thiết Lập Trang Trại Chăn Nuôi?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Đội ngũ chuyên gia kỹ thuật chăn nuôi và thú y của FarmGo luôn sẵn sàng hỗ trợ trực tiếp 24/7.
        </p>
        <div className="inline-flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-xs">
          <span className="font-semibold text-slate-700">📞 Hotline Hỗ Trợ: <strong>1900 6868</strong></span>
          <span className="text-slate-300">|</span>
          <span className="font-semibold text-slate-700">✉️ Email: <strong>support@farmgo.vn</strong></span>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
