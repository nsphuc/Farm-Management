import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * RoleScopeGuard - Tách biệt tuyệt đối giữa ROLE_SUPER_ADMIN và các Role của Tenant (Điều 1 File 08)
 * - ROLE_SUPER_ADMIN: Chỉ được hoạt động trong /platform/* (ẩn 100% menu Farm Ops)
 * - 5 Role thuộc Tenant: Chỉ được hoạt động trong /app/* (không thể vào /platform/*)
 */
export function RoleScopeGuard({ scope, children }) {
  const { isSuperAdmin } = useAuthStore();
  const isSuper = isSuperAdmin();

  if (scope === 'PLATFORM') {
    if (!isSuper) {
      // Người dùng Tenant không được phép vào /platform/*
      return <Navigate to="/app" replace />;
    }
  } else if (scope === 'TENANT') {
    if (isSuper) {
      // Super Admin không vào /app/* để tránh xung đột ngữ cảnh trang trại
      return <Navigate to="/platform" replace />;
    }
  }

  return children;
}

export default RoleScopeGuard;
