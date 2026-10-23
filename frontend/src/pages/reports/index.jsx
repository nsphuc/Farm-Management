import React from 'react';
import { BarChart3, TrendingUp, Warehouse, Calculator, BadgeDollarSign, PawPrint, Sprout } from 'lucide-react';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

/**
 * Reports Page - Trung Tâm Báo Cáo Điều Hành & Phân Tích Thông Minh (Mục 3.2 File 08)
 */
export function ReportsPage() {
  const { activeFarmType } = useActiveFarmStore();

  const allReports = [
    {
      id: 'dashboard',
      title: 'Báo Cáo Điều Hành Toàn Diện (Executive Dashboard)',
      desc: 'Tổng hợp doanh thu, chi phí, biên lợi nhuận và hiệu suất vận hành toàn diện.',
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600',
      sector: 'ALL',
    },
    {
      id: 'crop_pnl',
      title: 'Giá Thành & Lợi Nhuận Vụ Mùa (Crop P&L)',
      desc: 'Sản lượng thực thu, tỷ lệ phân loại Grade A/B, chi phí hạt giống - phân bón và biên lợi nhuận theo từng mùa vụ canh tác.',
      icon: BarChart3,
      color: 'bg-blue-50 text-blue-600',
      sector: 'CROP',
    },
    {
      id: 'livestock_fcr',
      title: 'Tiêu Tốn Thức Ăn FCR & Tăng Trọng Chăn Nuôi',
      desc: 'Hệ số chuyển đổi thức ăn (FCR), tốc độ tăng trọng bình quân ngày (ADG) và tỷ lệ hao hụt theo từng đàn/ô chuồng.',
      icon: Calculator,
      color: 'bg-purple-50 text-purple-600',
      sector: 'LIVESTOCK',
    },
    {
      id: 'inventory',
      title: 'Báo Cáo Biến Động Tồn Kho & Xuất Tiêu Hao FEFO',
      desc: 'Sổ cái kho thời gian thực, cảnh báo hạn dùng và vật tư vượt định mức BOM.',
      icon: Warehouse,
      color: 'bg-amber-50 text-amber-600',
      sector: 'ALL',
    },
    {
      id: 'finance',
      title: 'Báo Cáo Tuổi Nợ & Dòng Tiền Thu Chi VietQR',
      desc: 'Phân loại tuổi nợ đối tác: trong hạn, quá hạn 1-30 ngày, 31-60 ngày và cấn trừ hai chiều.',
      icon: BadgeDollarSign,
      color: 'bg-rose-50 text-rose-600',
      sector: 'ALL',
    },
  ];

  const filteredReports = allReports.filter((rep) => {
    if (activeFarmType === 'CROP' && rep.sector === 'LIVESTOCK') return false;
    if (activeFarmType === 'LIVESTOCK' && rep.sector === 'CROP') return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Trung Tâm Báo Cáo Điều Hành & Phân Tích
              </h1>
              {activeFarmType && (
                <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[10px] font-bold border border-slate-200">
                  {activeFarmType === 'CROP'
                    ? '🌾 Báo cáo Trồng Trọt'
                    : activeFarmType === 'LIVESTOCK'
                    ? '🐄 Báo cáo Chăn Nuôi'
                    : '🌐 Báo cáo Toàn Diện'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {filteredReports.length} Báo cáo quản trị số liệu chuyên sâu phục vụ Hội đồng quản trị và Ban giám đốc HTX
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((rep, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-4 ${rep.color}`}>
                <rep.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                {rep.title}
              </h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">{rep.desc}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <span className="text-xs font-bold text-emerald-600 group-hover:underline">
                Xem Báo Cáo →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReportsPage;
