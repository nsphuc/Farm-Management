import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * OwnerRestrictedGuard - Chặn Owner truy cập vào WS-E (Canh tác) và WS-G (Chấm công / Nhật ký)
 * Nếu isOwner === true, tự động điều hướng sang /app/geography (Mặt Bằng & Trang Trại)
 */
export function OwnerRestrictedGuard({ children, redirectTo = '/app/geography' }) {
  const { isOwner } = useAuthStore();
  if (isOwner()) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}

export default OwnerRestrictedGuard;
