import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Play,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Smartphone,
  Layers,
  ShieldCheck,
  Scale,
  Syringe,
  Info,
  ArrowRight,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// 5 Chuyên mục bài hướng dẫn theo quy trình thực hành thực tế
const GUIDE_SECTIONS = [
  {
    id: 'step-1',
    number: '1',
    title: 'Bắt đầu & Tạo cơ sở chăn nuôi',
    shortDesc: 'Đăng ký tài khoản, thiết lập thông tin cơ sở và mã vùng nuôi.',
    steps: [
      {
        stepTitle: 'Bước 1.1: Đăng ký tài khoản Chủ trang trại',
        stepContent: 'Truy cập trang Đăng ký, nhập Họ tên, Số điện thoại và Mật khẩu an toàn. Hệ thống tự động tạo mã định danh trang trại ban đầu.',
      },
      {
        stepTitle: 'Bước 1.2: Khai báo Hồ sơ cơ sở trong Thiết lập chung',
        stepContent: 'Vào mục "Thiết lập chung" -> "Thông tin dịch vụ". Điền Tên trang trại, Địa chỉ vùng nuôi, Loại hình kinh doanh (Cá nhân, Hộ kinh doanh, Hợp tác xã) và Mã số vùng nuôi để phục vụ truy xuất nguồn gốc.',
      },
      {
        stepTitle: 'Bước 1.3: Chọn loại hình vật nuôi chủ lực',
        stepContent: 'Lựa chọn mô hình chăn nuôi chính: Gia súc thịt (Heo thịt), Gia cầm thịt (Gà/Vịt), hoặc Thủy sản thâm canh để hệ thống nạp sẵn cấu hình mẫu.',
      },
    ],
    videoTitle: 'Video Hướng dẫn: Khởi tạo Trang trại & Thiết lập Vùng nuôi (2 phút)',
    proTip: 'Nên chụp sẵn Giấy chứng nhận đủ điều kiện chăn nuôi hoặc chứng chỉ VietGAHP để đính kèm vào hồ sơ pháp lý của trang trại.',
  },
  {
    id: 'step-2',
    number: '2',
    title: 'Thiết lập Chuồng & Chương trình nuôi',
    shortDesc: 'Khai báo danh sách chuồng, chọn quy trình cám và lịch vắc-xin chuẩn.',
    steps: [
      {
        stepTitle: 'Bước 2.1: Thêm Phân khu và Chuồng nuôi',
        stepContent: 'Truy cập mục "Khu nuôi", bấm "Thêm chuồng mới". Nhập Tên chuồng (VD: Chuồng A1), Sức chứa tối đa (VD: 2.000 con gà hoặc 300 con heo), diện tích và hệ thống làm mát.',
      },
      {
        stepTitle: 'Bước 2.2: Kích hoạt Lứa nuôi mới (Thả giống)',
        stepContent: 'Bấm "Tạo lứa nuôi mới", nhập Ngày bắt đầu thả giống, Số lượng con giống ban đầu, Nguồn giống (CP, Japfa, Dabaco) và Trọng lượng bình quân ngày nhập.',
      },
      {
        stepTitle: 'Bước 2.3: Áp dụng Quy trình dinh dưỡng & Lịch tiêm phòng',
        stepContent: 'Chọn Quy trình mẫu từ thư viện (VD: Gà thịt 45 ngày hoặc Heo thịt 120 ngày). Hệ thống sẽ tự động lập lịch nhắc cám ăn và ngày uống vắc-xin theo ngày tuổi.',
      },
    ],
    videoTitle: 'Video Hướng dẫn: Khai báo Chuồng & Lập lịch Quy trình nuôi (3 phút)',
    proTip: 'Nếu nuôi giống gà lai hoặc heo địa phương có thời gian nuôi dài hơn, bạn hoàn toàn có thể chỉnh sửa số ngày tuổi và định mức cám trong mục Cấu hình giống.',
  },
  {
    id: 'step-3',
    number: '3',
    title: 'Ghi nhật ký & Quản lý Kho cám/thuốc',
    shortDesc: 'Thao tác Mobile-first tại chuồng, theo dõi cám ăn, thuốc và hao hụt.',
    steps: [
      {
        stepTitle: 'Bước 3.1: Nhập cám và thuốc thú y vào Kho hàng hóa',
        stepContent: 'Vào "Kho hàng hóa" hoặc "Hóa đơn nhập hàng", tạo phiếu nhập cám theo Bao. Hệ thống tự động quy đổi ra Kg để sẵn sàng xuất chuồng ăn hàng ngày.',
      },
      {
        stepTitle: 'Bước 3.2: Thao tác Ghi nhật ký tại chuồng nuôi',
        stepContent: 'Công nhân mở điện thoại tại chuồng, chọn Chuồng đang tác nghiệp. Giao diện hiển thị sẵn định mức cám gợi ý. Chỉ cần xác nhận số bao/kg cám thực tế cho ăn trong ngày.',
      },
      {
        stepTitle: 'Bước 3.3: Ghi nhận hao hụt và xử lý dịch bệnh',
        stepContent: 'Nếu có vật nuôi chết hoặc loại thải, nhập số lượng và chọn nguyên nhân (tiêu chảy, cắn mổ, còi cọc). Kho thuốc tự động trừ khi công nhân tick xác nhận tiêm phòng.',
      },
    ],
    videoTitle: 'Video Hướng dẫn: Công nhân ghi nhật ký 1 tay trên điện thoại (90 giây)',
    proTip: 'Cân mẫu định kỳ 7 ngày/lần (bắt ngẫu nhiên 30-50 con) nhập vào Tab Cân mẫu để hệ thống tự động tính tốc độ tăng trọng ADG và FCR chuẩn xác.',
  },
  {
    id: 'step-4',
    number: '4',
    title: 'Xuất bán thương phẩm & Sổ quỹ',
    shortDesc: 'Phiếu cân điện tử, trừ bì, tạo mã VietQR và phân bổ chi phí tiền điện.',
    steps: [
      {
        stepTitle: 'Bước 4.1: Tạo Phiếu xuất bán chuồng khi xuất lứa',
        stepContent: 'Vào mục "Xuất bán", chọn chuồng cần thanh lý. Nhập mã cân xe hoặc số lượng con xuất, đơn giá thỏa thuận với thương lái theo kg hơi.',
      },
      {
        stepTitle: 'Bước 4.2: Thu tiền nhanh qua mã VietQR',
        stepContent: 'Hệ thống tự động sinh mã VietQR đúng chính xác số tiền cần thu. Thương lái quét mã chuyển khoản, tiền về thẳng tài khoản ngân hàng của chủ trại.',
      },
      {
        stepTitle: 'Bước 4.3: Nhập chi phí tiền điện nước và kết chuyển lãi lỗ',
        stepContent: 'Vào "Sổ quỹ", lập phiếu chi tiền điện trạm biến áp, tiền nước sinh hoạt. Bấm "Phân bổ chi phí vào lứa nuôi" để xem báo cáo Lãi/Lỗ ròng của lứa vừa bán.',
      },
    ],
    videoTitle: 'Video Hướng dẫn: Xuất chuồng, thu tiền VietQR & Tính lãi lỗ lứa nuôi (3 phút)',
    proTip: 'Sau khi xuất bán hết lứa, hãy chuyển trạng thái chuồng sang "Vệ sinh sát trùng" để hệ thống theo dõi thời gian cách ly trống chuồng an toàn sinh học.',
  },
  {
    id: 'step-5',
    number: '5',
    title: 'Phân quyền nhân sự & Quản lý công',
    shortDesc: 'Mời công nhân vào hệ thống, khoanh vùng chuồng và bảo mật giá vốn.',
    steps: [
      {
        stepTitle: 'Bước 5.1: Mời thành viên mới vào Trang trại',
        stepContent: 'Vào "Thiết lập chung" -> "Quyền hạn người dùng". Bấm "Thêm thành viên", nhập Số điện thoại và Họ tên người lao động.',
      },
      {
        stepTitle: 'Bước 5.2: Gán vai trò vận hành và khoanh vùng chuồng',
        stepContent: 'Chọn vai trò "Công nhân chuồng", bỏ tick "Toàn bộ chuồng" và chỉ chọn đúng các chuồng công nhân đó phụ trách (VD: Chuồng A1, A2).',
      },
      {
        stepTitle: 'Bước 5.3: Quản lý ứng lương và tính công khoán',
        stepContent: 'Tại mục "Nhân công", ghi nhận các khoản tạm ứng tiền mặt của công nhân trong tháng. Khi kết thúc lứa, hệ thống tự động trừ tạm ứng và thanh toán lương.',
      },
    ],
    videoTitle: 'Video Hướng dẫn: Phân quyền công nhân & Bảo mật chi phí nhạy cảm (2 phút)',
    proTip: 'Công nhân chuồng sẽ không nhìn thấy menu Sổ quỹ, không thấy giá mua cám của nhà máy và không xem được số tiền tồn quỹ của chủ trại.',
  },
];

// Danh sách FAQ thường gặp
const FAQS = [
  {
    q: 'Phần mềm FarmGo có dùng được mượt mà trên điện thoại không?',
    a: 'Hoàn toàn có! FarmGo được thiết kế theo tư duy Mobile-first. Công nhân tại chuồng chỉ cần mở trình duyệt web trên điện thoại (Chrome/Safari), giao diện tự động tối ưu các nút bấm to, chữ rõ ràng để thao tác dễ dàng ngay cả khi đang đeo găng tay lao động.',
  },
  {
    q: 'Trang trại nuôi kết hợp cả Heo thịt, Gà thịt và Cá có dùng chung một tài khoản được không?',
    a: 'Được hỗ trợ hoàn hảo. Hệ thống cho phép bạn tạo nhiều phân khu khác nhau: Khu A (Gà thịt), Khu B (Heo thịt), Khu C (Ao cá) trên cùng một trang trại. Mỗi phân khu có quy trình chăm sóc, thức ăn và lịch vắc-xin độc lập.',
  },
  {
    q: 'Trang trại ở vùng nông thôn không có máy chấm công vân tay thì tính lương thế nào?',
    a: 'FarmGo thiết kế phân hệ Nhân công tối giản riêng cho trang trại chăn nuôi. Bạn chỉ cần áp dụng cơ chế Lương cố định tháng hoặc Công khoán trọn gói theo từng lứa nuôi. Mọi khoản tạm ứng tiền mặt đều được liên thông tự động với Sổ quỹ.',
  },
  {
    q: 'Nếu tôi làm mất hoặc đổi điện thoại mới thì dữ liệu nhật ký có bị mất không?',
    a: 'Tuyệt đối không! Toàn bộ dữ liệu nhật ký, tồn kho và sổ quỹ được lưu trữ an toàn trên nền tảng điện toán đám mây. Bạn chỉ cần lấy điện thoại mới, đăng nhập số điện thoại và mật khẩu là toàn bộ số liệu được khôi phục ngay lập tức.',
  },
  {
    q: 'Tôi có cần cài đặt phần mềm phức tạp hoặc mua máy tính đắt tiền không?',
    a: 'Không cần. FarmGo là phần mềm hoạt động trực tiếp trên nền tảng Web đám mây (SaaS). Bạn có thể truy cập bằng bất kỳ thiết bị nào: điện thoại thông minh, máy tính bảng hoặc máy tính để bàn có kết nối Internet.',
  },
  {
    q: 'Khi gặp sự cố kỹ thuật hoặc chưa hiểu cách ghi sổ, tôi có thể liên hệ ai hỗ trợ?',
    a: 'Đội ngũ kỹ sư chăn nuôi và hỗ trợ phần mềm của FarmGo luôn túc trực hỗ trợ 24/7 qua Hotline 1900 6868 hoặc nhóm Zalo hỗ trợ kỹ thuật trực tiếp cho từng trang trại.',
  },
];

export function GuidesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('step-1');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Lọc theo tìm kiếm
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return GUIDE_SECTIONS;
    const q = searchQuery.toLowerCase();
    return GUIDE_SECTIONS.filter(
      (sec) =>
        sec.title.toLowerCase().includes(q) ||
        sec.shortDesc.toLowerCase().includes(q) ||
        sec.steps.some((s) => s.stepTitle.toLowerCase().includes(q) || s.stepContent.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const activeSection = useMemo(() => {
    return GUIDE_SECTIONS.find((s) => s.id === selectedSectionId) || GUIDE_SECTIONS[0];
  }, [selectedSectionId]);

  return (
    <div className="space-y-16 lg:space-y-24 py-12 pb-24">
      {/* ================= THANH TÌM KIẾM HƯỚNG DẪN LỚN ================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wide">
          <BookOpen className="w-3.5 h-3.5" />
          Trung tâm Trợ giúp & Hướng dẫn Sử dụng
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
          Học cách Vận hành FarmGo trong 15 Phút
        </h1>
        <p className="text-base text-slate-600 max-w-2xl mx-auto">
          Cẩm nang thực hành từng bước từ thiết lập chuồng trại, phân công công nhân đến xuất chuồng thu tiền.
        </p>

        {/* Search Bar lớn */}
        <div className="pt-4 max-w-2xl mx-auto relative">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm: cách ghi cám ăn, tạo chuồng mới, xuất bán cân xe, phân quyền công nhân..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-300 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>
      </section>

      {/* ================= BỐ CỤC 2 CỘT (SIDEBAR MỤC LỤC 25% + NỘI DUNG 75%) ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cột trái: Sidebar Mục lục (3/12 ~ 25%) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm sticky top-24 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
              Lộ trình 5 bước thực hành
            </h3>
            <div className="space-y-1">
              {filteredSections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                    selectedSectionId === sec.id
                      ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center shrink-0 font-bold ${
                      selectedSectionId === sec.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {sec.number}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold truncate">{sec.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{sec.shortDesc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cột phải: Nội dung chi tiết (8/12 ~ 75%) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
            {/* Header bài viết */}
            <div className="space-y-2 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                <span>Chuyên đề {activeSection.number}</span>
                <span>•</span>
                <span>Hướng dẫn thực hành</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {activeSection.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {activeSection.shortDesc}
              </p>
            </div>

            {/* Step-by-step đánh số rõ ràng */}
            <div className="space-y-6">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Các thao tác chi tiết:
              </h3>
              <div className="space-y-4">
                {activeSection.steps.map((st, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      {st.stepTitle}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {st.stepContent}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Khung mô phỏng Video Hướng dẫn Minh họa */}
            <div className="rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 p-6 text-white space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                <Video className="w-4 h-4" />
                <span>Video thực chiến</span>
              </div>
              <h4 className="text-base font-bold text-white">
                {activeSection.videoTitle}
              </h4>
              <p className="text-xs text-slate-300">
                Theo dõi trực quan từng cú chạm trên màn hình điện thoại do kỹ sư FarmGo thao tác mẫu.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  onClick={() => navigate('/register')}
                >
                  <Play className="w-3.5 h-3.5 mr-1.5 fill-white" />
                  Mở xem video demo
                </Button>
              </div>
            </div>

            {/* Mẹo vận hành thực tế tại chuồng (Pro Tip) */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-amber-900 font-bold block mb-0.5">
                  Mẹo vận hành thực tế tại chuồng (Pro Tip):
                </strong>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {activeSection.proTip}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= KHỐI CÂU HỎI THƯỜNG GẶP (FAQ ACCORDION) ================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5" />
            Hỏi đáp thường gặp
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Giải đáp thắc mắc của Chủ trang trại
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Những băn khoăn phổ biến nhất trước khi đưa FarmGo vào ứng dụng thực tế.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div key={index} className="transition-colors">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-emerald-600 font-mono">Q{index + 1}.</span>
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-50 bg-slate-50/30">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default GuidesPage;
