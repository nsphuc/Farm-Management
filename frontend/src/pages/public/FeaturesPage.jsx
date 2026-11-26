import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  ClipboardList,
  Package,
  ArrowLeftRight,
  Receipt,
  Scale,
  Wallet,
  Users,
  Sliders,
  Settings,
  Building2,
  Calculator,
  ShieldCheck,
  Activity,
  Egg,
  Factory,
  CheckCircle2,
  ArrowRight,
  Filter,
  Sparkles,
  ChevronRight,
  QrCode,
  Syringe,
  Thermometer,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// 10 Chức năng cốt lõi chuẩn FarmGo
const CORE_FEATURES = [
  {
    id: 'barns',
    group: 'BARNS_LOGS',
    number: '01',
    title: 'Khu nuôi & Lứa nuôi thông minh',
    subtitle: 'Sơ đồ trực quan - Trạng thái chuồng - Vòng đời lứa nuôi',
    desc: 'Quản lý toàn bộ hiện trạng chuồng trại theo phân khu (Khu A Gà thịt, Khu B Heo thịt...). Nắm bắt tức thì chuồng nào đang nuôi, chuồng nào trống hoặc đang tiêu độc khử trùng.',
    bullets: [
      'Hiển thị trực quan sĩ số đàn nuôi, ngày tuổi và tỷ lệ sống lũy kế',
      'Theo dõi vòng đời từ khi thả giống con đến ngày xuất chuồng',
      'Cảnh báo chuồng trống quá hạn tiêu độc khử trùng',
      'Tự động đồng bộ số liệu sang màn hình Nhật ký hằng ngày',
    ],
    mockup: {
      type: 'barn_cards',
      badge: 'Trực quan 2D',
      title: 'Khu A - Gà thịt CP',
      status: 'Đang nuôi: 1.950 con (28 ngày tuổi)',
      fcr: 'FCR: 1.58',
    },
  },
  {
    id: 'daily-logs',
    group: 'BARNS_LOGS',
    number: '02',
    title: 'Ghi nhật ký hằng ngày Mobile-first',
    subtitle: 'Nhiệt độ - Ẩm độ - Cám ăn - Thuốc thú y - Cân mẫu ADG',
    desc: 'Tối ưu vượt trội cho công nhân thao tác bằng một tay ngay tại chuồng nuôi. Nhập liệu nhanh nhiệt độ, lượng cám ăn sáng/chiều, số lượng chết và lý do hao hụt.',
    bullets: [
      'Giao diện thẻ lớn, nút to dễ bấm trên điện thoại không lo bấm nhầm',
      'Tự động gợi ý định mức cám chuẩn theo ngày tuổi quy trình',
      'Tính toán tăng trọng trung bình ngày (ADG) và FCR tức thì',
      'Chặn sửa xóa nhật ký đối với công nhân chuồng để bảo toàn số liệu',
    ],
    mockup: {
      type: 'daily_log_form',
      badge: 'Thao tác 1 tay',
      title: 'Nhật ký Chuồng A1',
      status: 'Ăn 280 kg Cám GĐ2 • Chết 2 con',
      fcr: 'Nhiệt độ: 28.5°C • ADG: 81.4 g/ngày',
    },
  },
  {
    id: 'inventory',
    group: 'INVENTORY',
    number: '03',
    title: 'Kho hàng hóa & Quy đổi đa đơn vị tính',
    subtitle: 'Bao <-> Kg • Chai <-> Ml • Quản lý Lô & Hạn sử dụng FEFO',
    desc: 'Giải quyết triệt để bài toán nhập vào theo Bao 25kg/40kg nhưng xuất ăn từng Kg, hoặc thuốc thú y nhập theo Chai 1 Lít nhưng tiêm nhỏ giọt Ml theo đàn.',
    bullets: [
      'Tự động quy đổi đơn vị tính cơ sở không bao giờ nhầm lẫn',
      'Quản lý tồn kho theo từng Lô sản xuất và Hạn sử dụng (FEFO)',
      'Cảnh báo hàng sắp hết và lô thuốc cận hạn sử dụng 15-30 ngày',
      'Bảo mật giá trị tồn kho: Ẩn giá tiền với Trại trưởng và Công nhân',
    ],
    mockup: {
      type: 'inventory_table',
      badge: 'Quy đổi thông minh',
      title: 'Kho Cám Trung Tâm',
      status: 'Tồn: 130 bao (3.250 kg) • 3 mặt hàng sắp hết',
      fcr: 'FEFO: Ưu tiên xuất lô nhập trước',
    },
  },
  {
    id: 'internal-transfers',
    group: 'INVENTORY',
    number: '04',
    title: 'Xuất nhập nội bộ & Kiểm kê thực tế',
    subtitle: 'Xuất dùng vật tư • Điều chuyển kho • Nhập hoàn trả cám dư',
    desc: 'Xử lý mượt mà mọi biến động kho ngoài luồng nhật ký: Xuất vôi sát trùng, bóng đèn sưởi ấm, chuyển kho cám sang kho chuồng hoặc hoàn trả cám thừa khi kết thúc lứa.',
    bullets: [
      'Phiếu xuất vật tư dùng chung cho chuồng nuôi kiểm soát chi phí',
      'Phiếu nhập hoàn trả cám/thuốc thừa khi xuất chuồng thanh lý lứa',
      'Biên bản kiểm kê kho định kỳ, tự động xử lý chênh lệch thừa/thiếu',
      'Hạch toán trực tiếp vào chi phí vận hành chung của trang trại',
    ],
    mockup: {
      type: 'transfer_receipt',
      badge: 'Nội bộ minh bạch',
      title: 'Phiếu Nhập Trả Thừa',
      status: 'Hoàn 12 bao Cám Vỗ Béo từ Chuồng B1',
      fcr: 'Trừ trực tiếp giá thành lứa nuôi',
    },
  },
  {
    id: 'purchase-invoices',
    group: 'PURCHASE_SALES',
    number: '05',
    title: 'Hóa đơn nhập hàng & Công nợ Nhà cung cấp',
    subtitle: 'Nhập giống • Cám nhà máy • Thuốc thú y • Nợ gối đầu',
    desc: 'Quản lý toàn bộ đơn hàng nhập từ các tập đoàn thức ăn chăn nuôi (CP, Japfa, Cargill, De Heus). Theo dõi sát lịch thanh toán gối đầu, hạn nợ và chiết khấu thương mại.',
    bullets: [
      'Lưu trữ hình ảnh hóa đơn giấy hoặc phiếu giao nhận của nhà xe',
      'Quản lý hạn mức công nợ và cảnh báo nợ NCC quá hạn thanh toán',
      'Hỗ trợ mua hàng thanh toán ngay hoặc thanh toán từng đợt',
      'Liên thông tự động số tiền phải trả vào Sổ quỹ và Báo cáo tài chính',
    ],
    mockup: {
      type: 'purchase_invoice',
      badge: 'Quản lý công nợ',
      title: 'HĐ Nhập Cám Cargill #882',
      status: 'Tổng tiền: 65.000.000 đ (Đã trả 30.000.000 đ)',
      fcr: 'Còn nợ gối đầu: 35.000.000 đ',
    },
  },
  {
    id: 'sales',
    group: 'PURCHASE_SALES',
    number: '06',
    title: 'Xuất bán chuồng & Phiếu cân điện tử VietQR',
    subtitle: 'Cân xe • Trừ bì • Đơn giá theo kg hơi • Thu tiền mã VietQR',
    desc: 'Quy trình xuất bán chuyên nghiệp cho thương lái. Tự động tính tổng trọng lượng qua từng mã cân xe hoặc lồng gà, trừ tỷ lệ hao hụt nước và tạo mã VietQR thanh toán.',
    bullets: [
      'Nhập mã cân xe tổng tải và xe không tải (trừ bì tự động)',
      'Tự động tính đơn giá bình quân theo kg hơi xuất chuồng',
      'Tạo mã thanh toán VietQR động theo đúng số tiền phiếu cân',
      'Tự động ghi nhận số lượng giảm đàn và cập nhật trạng thái chuồng trống',
    ],
    mockup: {
      type: 'sales_slip',
      badge: 'Cân xe & VietQR',
      title: 'Phiếu Xuất Chuồng XK-081',
      status: '50 con Heo thịt • 5.250 kg • Đơn giá 64.000đ/kg',
      fcr: 'Tạo mã VietQR thu tiền 336.000.000 đ',
    },
  },
  {
    id: 'cashbook',
    group: 'PURCHASE_SALES',
    number: '07',
    title: 'Sổ quỹ thu chi & Phân bổ chi phí lứa nuôi',
    subtitle: 'Quỹ tiền mặt • Tài khoản ngân hàng • Phân bổ tiền điện/nước',
    desc: 'Quản lý minh bạch dòng tiền vào ra. Cho phép phân bổ các khoản chi phí vận hành chung (tiền điện trạm biến áp, tiền nước, sửa chữa quạt thông gió) vào từng lứa nuôi cụ thể.',
    bullets: [
      'Tách bạch số dư quỹ Tiền mặt tại trại và Tài khoản ngân hàng',
      'Tự động tạo phiếu thu chi khi duyệt Hóa đơn mua bán',
      'Phân bổ chi phí tiền điện nước theo tỷ trọng đàn để tính giá thành chính xác',
      'Bảo mật phân quyền: Chỉ Chủ trang trại và Kế toán mới xem được',
    ],
    mockup: {
      type: 'cashbook_ledger',
      badge: 'Tài chính bảo mật',
      title: 'Sổ Quỹ Thu Chi T11',
      status: 'Số dư thực tế: 284.500.000 đ',
      fcr: 'Phân bổ 12.5tr tiền điện vào Lứa T11',
    },
  },
  {
    id: 'workforce',
    group: 'BARNS_LOGS',
    number: '08',
    title: 'Quản lý nhân công & Lương tối giản',
    subtitle: 'Lương cố định tháng • Công khoán theo lứa • Tạm ứng sổ quỹ',
    desc: 'Loại bỏ hoàn toàn các loại máy chấm công vân tay hay GPS cồng kềnh không phù hợp môi trường chuồng trại. Quản lý nhân sự theo mô hình thực tế trang trại gia súc gia cầm.',
    bullets: [
      'Quản lý hồ sơ công nhân, người phụ trách dãy chuồng',
      'Tính lương cố định tháng hoặc công khoán trọn gói theo lứa nuôi',
      'Theo dõi các khoản tạm ứng tiền mặt liên thông tự động với Sổ quỹ',
      'Hạch toán chi phí nhân công trực tiếp vào giá thành đàn vật nuôi',
    ],
    mockup: {
      type: 'workforce_card',
      badge: 'Tối giản cho chuồng',
      title: 'Bảng Lương Tháng 11',
      status: '8 Nhân sự • Quỹ lương: 68.000.000 đ',
      fcr: 'Liên thông khấu trừ tạm ứng sổ quỹ',
    },
  },
  {
    id: 'livestock-settings',
    group: 'SETTINGS',
    number: '09',
    title: 'Cấu hình Giống & Quy trình dinh dưỡng',
    subtitle: 'Định mức cám theo ngày tuổi • Lịch vắc-xin VietGAHP chuẩn',
    desc: 'Số hóa toàn bộ cẩm nang kỹ thuật của các hãng giống hàng đầu. Khai báo định mức cám ăn tăng dần theo từng ngày tuổi và quy trình tiêm phòng phòng dịch an toàn sinh học.',
    bullets: [
      'Thư viện quy trình mẫu cho Gà thịt 45 ngày, Heo thịt 120 ngày',
      'Tùy chỉnh định mức gam cám/con/ngày theo từng giai đoạn phát triển',
      'Cấu hình lịch nhắc vắc-xin tự động kèm hướng dẫn đường uống/tiêm',
      'Làm căn cứ chuẩn xác để so sánh FCR và phát hiện hao hụt cám',
    ],
    mockup: {
      type: 'program_spec',
      badge: 'Chuẩn VietGAHP',
      title: 'Quy trình Gà thịt CP 45 ngày',
      status: '4 Giai đoạn cám • 8 Mốc vắc-xin',
      fcr: 'Chuẩn FCR mục tiêu: 1.55 - 1.65',
    },
  },
  {
    id: 'general-settings',
    group: 'SETTINGS',
    number: '10',
    title: 'Thiết lập chung & Phân quyền kiêm nhiệm',
    subtitle: 'Hồ sơ cơ sở • Mã số vùng nuôi • Phân quyền SCRUD 3 nhóm vai trò',
    desc: 'Thiết lập thông tin pháp lý của trang trại, mã vùng nuôi xuất khẩu và cấu hình phân quyền người dùng thông minh theo cơ chế kiêm nhiệm vai trò thực tế.',
    bullets: [
      'Cập nhật hồ sơ cơ sở chăn nuôi, mã số vùng nuôi truy xuất nguồn gốc',
      'Ma trận phân quyền linh hoạt: Nhóm Vận hành, Nhóm Kỹ thuật, Nhóm Tài chính',
      'Quản lý gói dịch vụ và các Add-ons mở rộng thanh toán qua VNPAY',
      'Cấu hình ngưỡng cảnh báo cám và quy tắc quản lý kho thuốc',
    ],
    mockup: {
      type: 'settings_matrix',
      badge: 'Phân quyền SCRUD',
      title: 'Phân quyền Kiêm nhiệm',
      status: '3 Nhóm vai trò • Khoanh vùng theo chuồng',
      fcr: 'Bảo mật đa tầng dữ liệu',
    },
  },
];

// 6 Dịch vụ Mở rộng (Add-ons Grid)
const ADDON_SERVICES = [
  {
    code: 'BRANCHES',
    name: 'Quản lý Đa chi nhánh',
    icon: Building2,
    badge: 'Chuỗi trang trại',
    desc: 'Quản trị tập trung nhiều chi nhánh trang trại khác nhau trên cùng một tài khoản. Điều chuyển vật tư liên chi nhánh và so sánh hiệu suất FCR giữa các trại.',
    price: '99.000 đ/tháng',
  },
  {
    code: 'PAYROLL',
    name: 'Bảng lương KPI',
    icon: Calculator,
    badge: 'Hiệu quả chuồng',
    desc: 'Cơ chế thưởng phạt năng suất: Thưởng FCR thấp hơn định mức, thưởng tỷ lệ sống cao vượt chuẩn và tự động tính bảng lương công nhân cuối lứa.',
    price: '49.000 đ/tháng',
  },
  {
    code: 'BREEDING',
    name: 'Gia súc sinh sản',
    icon: Activity,
    badge: 'Thẻ tai & Nái',
    desc: 'Theo dõi heo nái, đực giống, chu kỳ lên giống, ngày phối giống, ngày đẻ dự kiến, số con sơ sinh còn sống và lịch cai sữa heo con theo mã thẻ tai RFID.',
    price: '79.000 đ/tháng',
  },
  {
    code: 'POULTRY_HATCHERY',
    name: 'Ấp nở & Trứng giống',
    icon: Egg,
    badge: 'Lò ấp gia cầm',
    desc: 'Quản lý mẻ ấp trứng giống gia cầm, theo dõi nhiệt độ lò ấp, độ ẩm, ngày soi trứng loại cồ và thống kê tỷ lệ nở gà con một ngày tuổi (DOC).',
    price: '69.000 đ/tháng',
  },
  {
    code: 'FEED_MILL',
    name: 'Sản xuất phối trộn cám',
    icon: Factory,
    badge: 'Chế biến cám',
    desc: 'Tự phối trộn thức ăn tại trại: Quản lý công thức dinh dưỡng, định mức nguyên liệu (ngô, đậu nành, premix), silo tồn trữ và tính giá thành mẻ trộn.',
    price: '89.000 đ/tháng',
  },
  {
    code: 'CUSTOM_ROLES',
    name: 'Mở rộng vai trò Custom Roles',
    icon: ShieldCheck,
    badge: 'Phân quyền sâu',
    desc: 'Tạo các vai trò tùy biến không giới hạn (Bác sĩ thú y ngoài trại, Thủ kho tổng, Giám sát chất lượng độc lập) với các quyền SCRUD chuyên biệt.',
    price: '39.000 đ/tháng',
  },
];

export function FeaturesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');

  const filteredFeatures = useMemo(() => {
    if (activeTab === 'ALL') return CORE_FEATURES;
    return CORE_FEATURES.filter((f) => f.group === activeTab);
  }, [activeTab]);

  return (
    <div className="space-y-16 lg:space-y-24 py-12 pb-24">
      {/* ================= HEADER TRANG TÍNH NĂNG ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wide">
          <Layers className="w-3.5 h-3.5" />
          Hệ sinh thái FarmGo Toàn diện
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
          Bộ tính năng Chuyên sâu cho Trang trại Hiện đại
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          Khám phá 10 chức năng cốt lõi được thiết kế bám sát 100% nghiệp vụ chuồng trại và 6 dịch vụ mở rộng khi trang trại phát triển quy mô.
        </p>

        {/* Thanh lọc nhanh theo nhóm nghiệp vụ */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ALL'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Tất cả (10 chức năng)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('BARNS_LOGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'BARNS_LOGS'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Quản lý Chuồng & Nhật ký
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INVENTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'INVENTORY'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Kho bãi & Vật tư
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PURCHASE_SALES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PURCHASE_SALES'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Mua bán & Sổ quỹ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'SETTINGS'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Quy trình & Cấu hình
          </button>
        </div>
      </section>

      {/* ================= 10 CHỨC NĂNG CỐT LÕI (Z-PATTERN TRÁI - PHẢI) ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {filteredFeatures.map((feat, index) => {
          const isEven = index % 2 === 1;

          return (
            <div
              key={feat.id}
              className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center ${
                isEven ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Cột Mô tả Chức năng */}
              <div className={`lg:col-span-6 space-y-4 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-emerald-600/80 font-mono">
                    {feat.number}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    {feat.subtitle}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {feat.title}
                </h2>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {feat.desc}
                </p>

                {/* 4 Gạch đầu dòng nghiệp vụ */}
                <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-slate-700">
                  {feat.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/register')}
                    className="text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50 rounded-xl"
                  >
                    Trải nghiệm tính năng này
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>

              {/* Cột Khung Mockup Minh họa */}
              <div className={`lg:col-span-6 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                <div className="rounded-2xl bg-gradient-to-tr from-slate-100 to-emerald-50/50 p-3 sm:p-4 border border-slate-200/80 shadow-md">
                  <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs">
                          {feat.number}
                        </span>
                        <span className="font-bold text-slate-800 text-sm">{feat.mockup.title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {feat.mockup.badge}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                      <div className="text-xs font-bold text-slate-800">{feat.mockup.status}</div>
                      <div className="text-xs text-emerald-700 font-semibold">{feat.mockup.fcr}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
                      <div className="p-2 rounded bg-emerald-50/50 border border-emerald-100 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Tự động đồng bộ</span>
                      </div>
                      <div className="p-2 rounded bg-emerald-50/50 border border-emerald-100 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Báo cáo tức thì</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ================= KHỐI 6 DỊCH VỤ MỞ RỘNG (ADD-ONS GRID) ================= */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Linh hoạt mở rộng (App Store Add-ons)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              6 Dịch vụ Mở rộng khi Trang trại Lớn mạnh
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Chỉ trả phí cho những tính năng bạn thực sự cần. Tích hợp thanh toán kích hoạt tức thì qua VNPAY / VietQR.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ADDON_SERVICES.map((addon) => {
              const IconComp = addon.icon;
              return (
                <div
                  key={addon.code}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {addon.badge}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">
                      {addon.name}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {addon.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Cước phí dịch vụ</span>
                      <strong className="text-sm text-emerald-700 font-extrabold">{addon.price}</strong>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/platform')}
                      className="text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-700 border-slate-200"
                    >
                      Bảng giá
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= BOTTOM CTA ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-4">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
            Trải nghiệm trọn bộ 10 chức năng cốt lõi ngay hôm nay
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Không cần thẻ tín dụng. Khởi tạo và thiết lập chuồng trại đầu tiên chỉ mất chưa đầy 3 phút.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button
              onClick={() => navigate('/register')}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl shadow-md shadow-emerald-600/20"
            >
              Đăng ký dùng thử miễn phí
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default FeaturesPage;
