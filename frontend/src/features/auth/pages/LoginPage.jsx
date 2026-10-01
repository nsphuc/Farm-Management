import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sprout, Lock, User, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../../services/authService';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useTenantStore } from '../../../stores/useTenantStore';

const loginSchema = z.object({
  loginId: z
    .string()
    .min(3, 'Tên đăng nhập hoặc Email phải từ 3 ký tự trở lên.')
    .trim(),
  password: z
    .string()
    .min(6, 'Mật khẩu phải từ 6 ký tự trở lên.'),
  rememberMe: z.boolean().optional(),
});

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setTenants = useTenantStore((state) => state.setTenants);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginId: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      const response = await authService.login({
        loginId: values.loginId,
        password: values.password,
      });

      if (response.success && response.data) {
        const data = response.data;
        const user = data.user || {
          id: data.userId || 1,
          tenantId: data.tenantId || 1,
          username: data.username || values.loginId,
          email: data.email || '',
          fullName: data.fullName || 'Người dùng',
          status: 'ACTIVE',
          roles: data.roles || ['ROLE_SUPER_ADMIN'],
          permissions: [],
        };

        setAuth(data.accessToken, user);

        // Khởi tạo danh sách tenant từ thông tin người dùng
        if (user.tenantId) {
          setTenants([
            {
              id: user.tenantId,
              code: 'BN_01',
              name: 'Nông trang Bắc Ninh',
              subscriptionPlan: 'ENTERPRISE',
              status: 'ACTIVE',
            },
          ]);
        }

        toast.success(`Chào mừng trở lại, ${user.fullName}!`);

        // Điều hướng về trang trước đó hoặc /dashboard
        const origin = location.state?.from?.pathname || '/dashboard';
        navigate(origin, { replace: true });
      } else {
        toast.error(response.message || 'Đăng nhập không thành công.');
      }
    } catch (err) {
      console.error('Lỗi khi đăng nhập:', err);
      const message = err.response?.data?.message || err.message || 'Tên đăng nhập hoặc mật khẩu không đúng.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-slate-50 to-green-100 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/40">
      {/* Background Decorative Rings */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200/40 dark:bg-primary-900/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-300/30 dark:bg-emerald-900/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card Container with Glassmorphism */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 dark:border-slate-800/80 p-8 sm:p-10">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-emerald-500 text-white shadow-lg shadow-primary-600/30 mb-4">
              <Sprout className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Farm SaaS Platform
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Hệ thống Quản lý Đa Trang Trại Thông Minh
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Login ID Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Tên đăng nhập hoặc Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="admin@farmsaas.com hoặc username"
                  autoComplete="username"
                  {...register('loginId')}
                  className={`w-full pl-11 pr-4 py-3 min-h-[44px] rounded-xl text-sm bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 border transition-all focus:outline-none focus:ring-2 ${
                    errors.loginId
                      ? 'border-red-400 focus:ring-red-400/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-primary-500/20'
                  }`}
                />
              </div>
              {errors.loginId && (
                <p className="mt-1.5 text-xs text-red-500">{errors.loginId.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Mật khẩu
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info('Vui lòng liên hệ Quản trị viên Tenant để thiết lập lại mật khẩu.');
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  className={`w-full pl-11 pr-11 py-3 min-h-[44px] rounded-xl text-sm bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 border transition-all focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-red-400 focus:ring-red-400/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-primary-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 min-h-[44px] min-w-[44px] justify-center"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                {...register('rememberMe')}
                className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500 focus:ring-2"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 block text-sm text-slate-600 dark:text-slate-400 select-none cursor-pointer"
              >
                Ghi nhớ đăng nhập
              </label>
            </div>

            {/* Submit Button (Tap Target >= 44px) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-primary-600 to-emerald-600 hover:from-primary-700 hover:to-emerald-700 shadow-md shadow-primary-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Badge */}
          <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
              <span>Bảo mật chuẩn JWT HttpOnly & Tenant Isolation</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
