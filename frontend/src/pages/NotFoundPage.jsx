import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 p-6 text-center text-slate-900">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 shadow-sm">
        <FileQuestion className="h-10 w-10" />
      </div>

      <h1 className="mt-6 text-3xl font-black text-slate-900 tracking-tight">404 - Không Tìm Thấy Trang</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Đường dẫn bạn đang truy cập không tồn tại hoặc đã được chuyển sang phân hệ mới trong kiến trúc Agri-ERP.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Link to="/app">
          <Button variant="primary" size="md" icon={ArrowLeft}>
            Về Bàn Làm Việc Chính
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
