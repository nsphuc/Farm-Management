import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Users,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  CreditCard,
  QrCode,
  ArrowRight,
  ChevronRight,
  Layers,
  Activity,
  Check,
  Star,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PlatformIntroPage() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('ANNUAL'); // 'MONTHLY' | 'ANNUAL'

  return (
    <div className="space-y-16 lg:space-y-24 py-12 pb-24">
      {/* ================= HEADER TRANG NỀN TẢNG ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wide">
          <ShieldCheck className="w-3.5 h-3.5" />
          Kiến trúc & Bảng giá Dịch vụ
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
          Nền tảng Vận hành An toàn & Bảng giá Minh bạch
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          Tìm hiểu cách FarmGo bảo vệ bí mật giá vốn, cô lập dữ liệu theo từng chuồng nuôi và bảng giá phù hợp từ hộ gia đình đến chuỗi trang trại liên tỉnh.
        </p>
      </section>

      {/* ================= PHẦN 1: GIẢI PHÁP THEO QUY MÔ & LOẠI HÌNH KINH DOANH ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Giải pháp may đo theo từng quy mô trang trại
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Dù bạn nuôi vài trăm con gà thịt hay sở hữu chuỗi hàng vạn con heo thịt, hệ thống đều đáp ứng trơn tru.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cột 1: Cá nhân / Hộ kinh doanh */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-lg">
                🏡
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Hộ gia đình / Cá nhân
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Quy mô từ 1 đến 4 chuồng nuôi. Tập trung vào thao tác cực nhanh trên điện thoại thông minh, không cần nhân viên kế toán chuyên trách.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Chủ trại kiêm luôn quản lý và xuất bán</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Ghi cám, thuốc, cân mẫu trực tiếp tại chuồng</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Tự động tính lãi lỗ theo từng lứa nuôi</span>
                </div>
              </div>
            </div>
            <div className="pt-6">
              <span className="text-[11px] text-slate-400 block mb-1">Gói đề xuất:</span>
              <strong className="text-sm font-bold text-slate-800">Cá nhân Tiêu chuẩn</strong>
            </div>
          </div>

          {/* Cột 2: Gia trại & Hợp tác xã */}
          <div className="bg-white rounded-2xl border border-emerald-300 p-6 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20 flex flex-col justify-between relative">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wide">
              Khuyên dùng
            </div>
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-lg">
                🚜
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Gia trại & Hợp tác xã
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Quy mô từ 5 đến 20 chuồng nuôi, có thuê công nhân ở tại trại. Yêu cầu phân quyền chặt chẽ và theo dõi định mức cám ăn hàng ngày.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Công nhân chỉ thấy chuồng được phân công</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Kế toán kiểm soát hóa đơn cám và sổ quỹ</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Kèm Add-on Bảng lương KPI hiệu quả lứa</span>
                </div>
              </div>
            </div>
            <div className="pt-6">
              <span className="text-[11px] text-slate-400 block mb-1">Gói đề xuất:</span>
              <strong className="text-sm font-bold text-emerald-700">Tiêu chuẩn + Add-on Lương KPI</strong>
            </div>
          </div>

          {/* Cột 3: Doanh nghiệp chuỗi đa chi nhánh */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-lg">
                🏢
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Doanh nghiệp & Chuỗi liên kết
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sở hữu nhiều chi nhánh trang trại tại các tỉnh thành khác nhau. Cần báo cáo tài chính hợp nhất, chuyển kho liên tỉnh và quản lý gia công.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Kích hoạt phân hệ Quản lý Đa chi nhánh</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>So sánh chỉ số FCR giữa các trại thành viên</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Phiếu điều chuyển vật tư & con giống liên trại</span>
                </div>
              </div>
            </div>
            <div className="pt-6">
              <span className="text-[11px] text-slate-400 block mb-1">Gói đề xuất:</span>
              <strong className="text-sm font-bold text-slate-800">Doanh nghiệp Chuỗi Đa trại</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PHẦN 2: KIẾN TRÚC PHÂN QUYỀN & BẢO MẬT DỮ LIỆU ================= */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              Role-Based Access Control (RBAC)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tách bạch 5 vai trò & Khoanh vùng dữ liệu chuồng
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Công nhân chuồng tuyệt đối không nhìn thấy giá trị tồn kho tiền mặt, sổ quỹ hoặc giá mua cám của chủ trại.
            </p>
          </div>

          {/* Ma trận phân quyền minh họa 6 vai trò */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5">Vai trò trong Trang trại</th>
                    <th className="p-3.5 text-center">Xem & Ghi nhật ký</th>
                    <th className="p-3.5 text-center">Quản lý Kho hàng</th>
                    <th className="p-3.5 text-center">Xem Giá vốn & Tiền quỹ</th>
                    <th className="p-3.5 text-center">Xuất bán chuồng</th>
                    <th className="p-3.5">Phạm vi dữ liệu (Scope)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                      Chủ trang trại (Owner)
                    </td>
                    <td className="p-3.5 text-center text-emerald-600 font-bold"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3.5 text-center text-emerald-600 font-bold"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3.5 text-center text-emerald-600 font-bold"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3.5 text-center text-emerald-600 font-bold"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3.5 text-slate-600 font-medium">Toàn quyền toàn hệ thống</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      Trại trưởng (Manager)
                    </td>
                    <td className="p-3.5 text-center text-emerald-600 font-bold"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3.5 text-center text-emerald-600 font-bold"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3.5 text-center text-rose-500"><EyeOff className="w-4 h-4 mx-auto text-slate-300" /></td>
                    <td className="p-3.5 text-center text-emerald-600 font-bold"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3.5 text-slate-600 font-medium">Toàn bộ chuồng thuộc trại</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                      Kế toán kho (Accountant)
                    </td>
                    <td className="p-3.5 text-center text-slate-400">Xem</td>
                    <td className="p-3.5 text-center text-emerald-600 font-bold"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3.5 text-center text-emerald-600 font-bold"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3.5 text-center text-slate-400">Xem</td>
                    <td className="p-3.5 text-slate-600 font-medium">Kho hàng, Hóa đơn & Sổ quỹ</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                      Kỹ thuật viên thú y (Vet)
                    </td>
                    <td className="p-3.5 text-center text-emerald-600 font-bold"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3.5 text-center text-slate-400">Chỉ kho thuốc</td>
                    <td className="p-3.5 text-center text-rose-500"><EyeOff className="w-4 h-4 mx-auto text-slate-300" /></td>
                    <td className="p-3.5 text-center text-rose-500"><XCircle className="w-4 h-4 mx-auto text-slate-300" /></td>
                    <td className="p-3.5 text-slate-600 font-medium">Kỹ thuật & Lịch tiêm phòng</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 bg-emerald-50/20">
                    <td className="p-3.5 font-bold text-emerald-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                      Công nhân chuồng (Barn Worker)
                    </td>
                    <td className="p-3.5 text-center text-emerald-600 font-bold"><Check className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3.5 text-center text-rose-500"><XCircle className="w-4 h-4 mx-auto text-slate-300" /></td>
                    <td className="p-3.5 text-center text-rose-500"><EyeOff className="w-4 h-4 mx-auto text-slate-300" /></td>
                    <td className="p-3.5 text-center text-rose-500"><XCircle className="w-4 h-4 mx-auto text-slate-300" /></td>
                    <td className="p-3.5 text-emerald-700 font-bold">Chỉ chuồng được phân công</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PHẦN 3: BẢNG GIÁ DỊCH VỤ MINH BẠCH (PRICING TABLE) ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Bảng giá Dịch vụ Minh bạch & Tiết kiệm
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Trọn bộ 10 chức năng cốt lõi chỉ với chi phí một bao cám mỗi tháng. Thanh toán tự động qua VNPAY / VietQR kích hoạt tức thì.
          </p>

          {/* Nút chuyển đổi chu kỳ: Tháng / Năm */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 mt-2">
            <button
              type="button"
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                billingCycle === 'MONTHLY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Thanh toán theo tháng
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('ANNUAL')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'ANNUAL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Thanh toán theo năm</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[10px] font-extrabold">
                Tiết kiệm 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Gói Cơ bản Cốt lõi (7 cột) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-emerald-500 p-8 shadow-xl relative flex flex-col justify-between">
            <div className="absolute -top-3.5 left-8 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold tracking-wide uppercase shadow-sm">
              Gói Khuyên Dùng Cho Mọi Trang Trại
            </div>

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-100 pb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">
                    Gói Cá nhân Tiêu chuẩn
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Trọn bộ 10 chức năng chăn nuôi cốt lõi chuẩn FarmGo
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-3xl font-black text-emerald-700">
                    {billingCycle === 'ANNUAL' ? '1.990.000' : '199.000'} <span className="text-sm font-semibold text-slate-500">đ/{billingCycle === 'ANNUAL' ? 'năm' : 'tháng'}</span>
                  </div>
                  {billingCycle === 'ANNUAL' && (
                    <span className="text-[11px] text-amber-600 font-bold">
                      Tương đương chỉ ~165.000 đ/tháng
                    </span>
                  )}
                </div>
              </div>

              {/* Danh sách 10 tính năng cốt lõi bao gồm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sơ đồ khu nuôi & lứa nuôi (Không giới hạn)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ghi nhật ký Mobile-first tiện lợi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kho hàng quy đổi đa đơn vị (Bao/Kg, Chai/Ml)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Xuất dùng nội bộ & kiểm kê kho</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hóa đơn nhập hàng & nợ nhà cung cấp</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Xuất bán cân xe & tạo mã VietQR</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sổ quỹ thu chi & phân bổ giá thành</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Quản lý nhân công tối giản</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Quy trình dinh dưỡng chuẩn VietGAHP</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cảnh báo FCR và nhắc vắc-xin tự động</span>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Thanh toán quét mã VNPAY / VietQR kích hoạt sau 30 giây</span>
              </div>
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl shadow-md"
              >
                Đăng ký gói này ngay
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Danh mục Add-ons mua thêm (5 cột) */}
          <div className="lg:col-span-5 bg-slate-50 rounded-3xl border border-slate-200 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    Dịch vụ Mở rộng (Add-ons)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Bật tắt linh hoạt trong mục Thiết lập chung
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                  Tùy chọn
                </span>
              </div>

              <div className="divide-y divide-slate-200/80 mt-2 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-800 block">Quản lý Đa chi nhánh</strong>
                    <span className="text-[11px] text-slate-500">Chuỗi nhiều trang trại liên tỉnh</span>
                  </div>
                  <span className="font-bold text-emerald-700">99.000 đ/tháng</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-800 block">Bảng lương KPI năng suất</strong>
                    <span className="text-[11px] text-slate-500">Thưởng FCR & tỷ lệ sống</span>
                  </div>
                  <span className="font-bold text-emerald-700">49.000 đ/tháng</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-800 block">Gia súc sinh sản (Nái & Đực)</strong>
                    <span className="text-[11px] text-slate-500">Quản lý phối giống & thẻ tai</span>
                  </div>
                  <span className="font-bold text-emerald-700">79.000 đ/tháng</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-800 block">Ấp nở & Trứng giống gia cầm</strong>
                    <span className="text-[11px] text-slate-500">Lò ấp & tỷ lệ nở gà con</span>
                  </div>
                  <span className="font-bold text-emerald-700">69.000 đ/tháng</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-800 block">Sản xuất phối trộn cám</strong>
                    <span className="text-[11px] text-slate-500">Công thức cám & tồn silo ngô</span>
                  </div>
                  <span className="font-bold text-emerald-700">89.000 đ/tháng</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 mt-4 text-[11px] text-slate-500 text-center">
              Khách hàng dùng thử được trải nghiệm miễn phí toàn bộ Add-ons trong 14 ngày đầu tiên.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PlatformIntroPage;
