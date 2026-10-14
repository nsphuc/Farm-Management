import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">404 - Không Tìm Thấy Trang</h1>
      <p className="text-slate-500 mt-2 max-w-md text-sm">
        Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển trong hệ thống Farm SaaS.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button variant="primary">Quay về Trang chủ</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
