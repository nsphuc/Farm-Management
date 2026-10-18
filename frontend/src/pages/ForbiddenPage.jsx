import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ForbiddenPage() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 p-6 text-center text-slate-900">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 ring-1 ring-rose-200 shadow-sm">
        <ShieldAlert className="h-10 w-10" />
      </div>

      <h1 className="mt-6 text-3xl font-black text-slate-900 tracking-tight">403 - Quyền Truy Cập Bị Từ Chối</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Bạn không có quyền thực hiện thao tác này hoặc tài khoản của bạn không thuộc phạm vi trang trại đang làm việc.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Link to="/app">
          <Button variant="primary" size="md" icon={ArrowLeft}>
            Về Bàn Làm Việc
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default ForbiddenPage;
