import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTenantStore } from '../stores/useTenantStore';

export const TenantGuard = ({ children }) => {
  const currentTenantId = useTenantStore((state) => state.currentTenantId);
  const location = useLocation();

  if (!currentTenantId) {
    return <Navigate to="/select-tenant" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
