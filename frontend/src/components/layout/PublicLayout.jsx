import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Layers,
  HelpCircle,
  PhoneCall,
  LogIn,
  UserPlus,
  ArrowRight,
  Sparkles,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Clock,
  Download,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PublicLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Tính năng', path: '/features' },
    { label: 'Nền tảng quản trị', path: '/platform' },
    { label: 'Hướng dẫn', path: '/guides' },
    { label: 'Liên hệ', path: '/contact' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/guides') return location.pathname.startsWith('/guide');
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* ================= THANH HEADER (STICKY TOP) ================= */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Bên trái: Logo + Tên thương hiệu */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <span className="text-xl">🐖</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                FarmGo <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold tracking-normal border border-emerald-200">Chăn Nuôi</span>
              </span>
              <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
                Nền tảng Quản trị Chăn nuôi Gia súc & Gia cầm Toàn diện
              </span>
            </div>
          </Link>

          {/* Ở giữa: 5 Mục điều hướng chính (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  isActive(link.path)
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Bên phải: Nút phụ Đăng nhập & Nút chính Dùng thử miễn phí */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/login')}
              className="text-xs font-semibold text-slate-700 hover:text-emerald-700 border-slate-300 rounded-xl px-3.5 py-2"
            >
              <LogIn className="h-3.5 w-3.5 mr-1 text-slate-500" />
              Đăng nhập
            </Button>

            <Button
              size="sm"
              onClick={() => navigate('/register')}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm shadow-emerald-600/30 px-4 py-2"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Dùng thử miễn phí
            </Button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Mở menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-4 duration-200 shadow-lg">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                  isActive(link.path)
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full text-xs font-semibold py-2.5"
              >
                <LogIn className="h-3.5 w-3.5 mr-1.5" />
                Đăng nhập
              </Button>
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/register');
                }}
                className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white py-2.5"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Dùng thử miễn phí
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1">
        {children || <Outlet />}
      </main>

      {/* ================= CHÂN TRANG (FOOTER - 4 CỘT) ================= */}
      <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Cột 1: Giới thiệu ngắn + Thông tin liên hệ */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                  🐖
                </div>
                <span className="font-extrabold text-base text-slate-900 tracking-tight">
                  FarmGo Chăn Nuôi
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống phần mềm quản lý trang trại chăn nuôi gia súc, gia cầm và thủy sản khép kín. Số hóa toàn diện sổ sách chuồng trại, kiểm soát FCR và hạch toán lãi lỗ chính xác.
              </p>
              <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Hotline: <strong>1900 6868</strong> (07:30 - 21:00)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Email: hotro@farmgo.vn</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Tòa nhà Nông Nghiệp Số, Cầu Giấy, Hà Nội</span>
                </div>
              </div>
            </div>

            {/* Cột 2: Liên kết nhanh 5 trang */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm tracking-wide uppercase">
                Liên kết nhanh
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/" className="hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-400" /> Trang chủ
                  </Link>
                </li>
                <li>
                  <Link to="/features" className="hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-400" /> Tính năng cốt lõi & Add-ons
                  </Link>
                </li>
                <li>
                  <Link to="/platform" className="hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-400" /> Nền tảng quản trị & Bảng giá
                  </Link>
                </li>
                <li>
                  <Link to="/guides" className="hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-400" /> Hướng dẫn sử dụng & FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-400" /> Liên hệ tư vấn & Đặt lịch Demo
                  </Link>
                </li>
              </ul>
            </div>

            {/* Cột 3: Danh mục giải pháp chuyên biệt */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm tracking-wide uppercase">
                Giải pháp chăn nuôi
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-1.5">
                  <span className="text-base">🐷</span>
                  <div>
                    <strong className="text-slate-800">Gia súc (Heo thịt, Bò thịt)</strong>
                    <p className="text-[11px] text-slate-500">Quản lý bầy đàn, cân mẫu ADG, cai sữa & vỗ béo</p>
                  </div>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-base">🐔</span>
                  <div>
                    <strong className="text-slate-800">Gia cầm (Gà, Vịt, Ngan thịt)</strong>
                    <p className="text-[11px] text-slate-500">Quy trình 45 ngày, lịch vắc-xin tự động & FCR chuẩn</p>
                  </div>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-base">🐟</span>
                  <div>
                    <strong className="text-slate-800">Thủy sản (Tôm, Cá)</strong>
                    <p className="text-[11px] text-slate-500">Theo dõi môi trường nước, pH, oxy & chu kỳ thu tỉa</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Cột 4: Đăng ký trải nghiệm & Ứng dụng di động */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm tracking-wide uppercase">
                Trải nghiệm FarmGo
              </h4>
              <p className="text-xs text-slate-500">
                Khởi tạo trang trại chỉ trong 2 phút. Dùng thử miễn phí đầy đủ tính năng cho lứa nuôi đầu tiên.
              </p>
              <div className="space-y-2 pt-1">
                <Button
                  onClick={() => navigate('/register')}
                  className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Đăng ký dùng thử ngay
                </Button>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ứng dụng Web Mobile: Tối ưu 100% cảm ứng tại chuồng</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <p>© 2026 FarmGo Chăn Nuôi Platform. Chuẩn hóa theo quy trình chăn nuôi an toàn sinh học VietGAHP.</p>
            <div className="flex items-center gap-4">
              <span>Bảo mật dữ liệu đám mây</span>
              <span>•</span>
              <span>Hỗ trợ kỹ thuật 24/7</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export const PublicPortalShell = PublicLayout;
export default PublicLayout;
