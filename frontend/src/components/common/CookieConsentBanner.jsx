import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, X } from 'lucide-react';

export const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('farm_saas_cookie_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = (type) => {
    localStorage.setItem('farm_saas_cookie_consent', type);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="p-5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Chính Sách Cookie & Dữ Liệu Nông Trại</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Chúng tôi sử dụng cookie phiên an toàn để duy trì đăng nhập bảo mật và tối ưu trải nghiệm điều hành sản xuất. Dữ liệu trang trại của bạn luôn được mã hóa và cô lập tuyệt đối.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Link
                to="/privacy"
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                Chính sách riêng tư
              </Link>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <Link
                to="/terms"
                className="text-[11px] text-slate-500 hover:underline font-medium"
              >
                Điều khoản dịch vụ
              </Link>
            </div>
          </div>
          <button
            onClick={() => handleAccept('essential')}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => handleAccept('essential')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Chỉ cần thiết
          </button>
          <button
            onClick={() => handleAccept('all')}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
          >
            Đồng ý tất cả
          </button>
        </div>
      </div>
    </div>
  );
};
