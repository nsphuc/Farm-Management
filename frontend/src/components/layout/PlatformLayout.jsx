import React from 'react';
import { AdminLayout } from '@/pages/admin/AdminLayout';

/**
 * PlatformLayout / PlatformShell
 * Chuyển tiếp toàn bộ giao diện quản trị Super Admin sang AdminLayout mới
 * (Tông màu tối Slate/Indigo/Emerald với 4 phân hệ chuẩn FarmGo)
 */
export function PlatformLayout() {
  return <AdminLayout />;
}

export const PlatformShell = PlatformLayout;

export default PlatformLayout;
