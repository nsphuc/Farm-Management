import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { Loader2 } from 'lucide-react';

/**
 * AuthGuard - Bảo vệ route yêu cầu xác thực
 * Khi F5 trang (in-memory token bị rỗng), tự động kích hoạt Silent Refresh Token
 * qua HttpOnly Cookie để khôi phục phiên làm việc trước khi quyết định cho vào hay chuyển hướng /login.
 */
export function AuthGuard({ children }) {
  const location = useLocation();
  const { isAuthenticated, accessToken, userInfo, setAuth, isInitialized, setInitialized } = useAuthStore();
  const { syncFromAccessibleFarms } = useActiveFarmStore();
  const [isVerifying, setIsVerifying] = useState(!accessToken);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      if (accessToken && userInfo) {
        if (isMounted) {
          setIsVerifying(false);
          setInitialized(true);
        }
        return;
      }

      try {
        // Gọi refresh token endpoint với cookie HttpOnly
        const refreshRes = await axios.post(
          '/api/v1/auth/refresh',
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshRes.data?.accessToken;
        let userData = refreshRes.data?.userInfo;

        // Nếu refreshRes chưa trả đủ userInfo, gọi tiếp /auth/me
        if (!userData && newAccessToken) {
          const meRes = await axios.get('/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${newAccessToken}` },
            withCredentials: true,
          });
          userData = meRes.data;
        }

        if (isMounted && newAccessToken && userData) {
          setAuth(newAccessToken, userData);
          syncFromAccessibleFarms(userData.accessibleFarms || []);
        }
      } catch (err) {
        if (isMounted) {
          useAuthStore.getState().clearAuth();
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
          setInitialized(true);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [accessToken, userInfo, setAuth, setInitialized, syncFromAccessibleFarms]);

  if (isVerifying || !isInitialized) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 backdrop-blur-sm">
            <span className="text-2xl font-bold tracking-wider text-emerald-400">AGRI</span>
            <div className="absolute -inset-1 animate-pulse rounded-2xl bg-emerald-500/20" />
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
            <span className="text-sm font-medium">Đang khôi phục phiên làm việc...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return children;
}

export default AuthGuard;
