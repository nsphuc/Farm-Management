import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, AlertCircle, CheckCircle2, Sprout } from 'lucide-react';
import { useAuthStore } from '../../store/auth/useAuthStore';
import { authService } from '../../services/auth/authService';
import { ForceChangePasswordModal } from './ForceChangePasswordModal';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth, isAuthenticated } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Nếu người dùng đã đăng nhập thì tự động điều hướng sang trang chủ hoặc platform
  useEffect(() => {
    if (isAuthenticated) {
      const isSuper = useAuthStore.getState().user?.roles?.includes('ROLE_SUPER_ADMIN');
      navigate(isSuper ? '/platform' : '/', { replace: true });
    }

    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setInfoMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.');
    }
  }, [isAuthenticated, location, navigate]);

  const [showForceChangePassword, setShowForceChangePassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const response = await authService.login(username.trim(), password);
      const { user, accessToken } = response.data || {};

      if (user && accessToken) {
        setAuth(user, accessToken);
        const defaultTarget = user?.roles?.includes('ROLE_SUPER_ADMIN') ? '/platform' : '/';
        const from = location.state?.from?.pathname || defaultTarget;
        navigate(from, { replace: true });
      } else {
        setErrorMessage('Dữ liệu xác thực không hợp lệ. Vui lòng thử lại.');
      }
    } catch (err) {
      // Bắt mã lỗi Ép đổi mật khẩu lần đầu (HTTP 428 / 403 hoặc code MUST_CHANGE_PASSWORD)
      if (
        err.code === 'MUST_CHANGE_PASSWORD' ||
        err.status === 428 ||
        err.response?.status === 428 ||
        (err.status === 403 && err.message?.includes('đổi mật khẩu'))
      ) {
        setShowForceChangePassword(true);
        return;
      }

      const message =
        err.message ||
        err.response?.data?.message ||
        'Tên đăng nhập hoặc mật khẩu không chính xác.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceChangeSuccess = async (newPassword) => {
    setShowForceChangePassword(false);
    setPassword(newPassword);
    setIsLoading(true);

    try {
      // Đăng nhập tự động với mật khẩu mới vừa đổi
      const response = await authService.login(username.trim(), newPassword);
      const { user, accessToken } = response.data || {};

      if (user && accessToken) {
        setAuth(user, accessToken);
        const defaultTarget = user?.roles?.includes('ROLE_SUPER_ADMIN') ? '/platform' : '/';
        const from = location.state?.from?.pathname || defaultTarget;
        navigate(from, { replace: true });
      } else {
        setInfoMessage('Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.');
      }
    } catch {
      setInfoMessage('Đổi mật khẩu thành công. Vui lòng nhập lại mật khẩu mới để đăng nhập.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 p-4">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-emerald-500/20 p-8 sm:p-10 transition-all">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/30 mb-4">
            <Sprout className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 font-serif">
            Farm SaaS Platform
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-sans">
            Hệ thống Quản lý Đa Trang trại & Chuỗi Cung ứng
          </p>
        </div>

        {/* Thông báo phiên hết hạn */}
        {infoMessage && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Thông báo lỗi */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form Đăng nhập */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Tên đăng nhập hoặc Email
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ví dụ: admin hoặc user@farm.vn"
                disabled={isLoading}
                autoFocus
                className="block w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Mật khẩu
              </label>
            </div>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu của bạn"
                disabled={isLoading}
                className="block w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-semibold text-sm shadow-lg shadow-emerald-600/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xác thực...</span>
                </div>
              ) : (
                'Đăng nhập hệ thống'
              )}
            </button>
          </div>
        </form>

        {/* Footer bảo mật */}
        <div className="mt-8 text-center text-xs text-slate-400 border-t border-slate-100 pt-4">
          Bảo mật đa tầng: In-Memory Bearer Access JWT & HttpOnly Session Cookie (DEC-05)
        </div>
      </div>

      {/* Modal ép đổi mật khẩu lần đầu */}
      <ForceChangePasswordModal
        isOpen={showForceChangePassword}
        onClose={() => setShowForceChangePassword(false)}
        username={username.trim()}
        initialOldPassword={password}
        onSuccess={handleForceChangeSuccess}
      />
    </div>
  );
};

export default LoginPage;
