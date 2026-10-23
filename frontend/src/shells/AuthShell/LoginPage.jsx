import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { FormField, Input } from '@/components/ui/FormControls';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';

/**
 * LoginPage Component (Mục 1.1.1 File 08 & Nhiệm vụ 3)
 * Gọi POST /api/v1/auth/login, lưu token in-memory và điều hướng theo phân quyền.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const { syncFromAccessibleFarms } = useActiveFarmStore();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setServerError(null);

    try {
      const response = await axios.post(
        '/api/v1/auth/login',
        {
          username: data.username.trim(),
          password: data.password,
        },
        { withCredentials: true }
      );

      const { accessToken, userInfo, mustChangePassword } = response.data;

      // 1. Lưu token in-memory trong Zustand store (ADR-02)
      setAuth(accessToken, userInfo);

      // 2. Đồng bộ ngữ cảnh trang trại
      if (userInfo?.accessibleFarms?.length) {
        syncFromAccessibleFarms(userInfo.accessibleFarms);
      }

      // 3. Kiểm tra cưỡng chế đổi mật khẩu lần đầu (First-Login Guard)
      if (mustChangePassword || userInfo?.mustChangePassword) {
        navigate('/force-change-password', { replace: true });
        return;
      }

      // 4. Điều hướng theo phân quyền Super Admin vs Tenant
      const params = new URLSearchParams(location.search);
      const redirectUrl = params.get('redirect');

      if (userInfo?.isSuperAdmin) {
        navigate(redirectUrl && redirectUrl.startsWith('/platform') ? redirectUrl : '/platform', {
          replace: true,
        });
      } else {
        navigate(redirectUrl && redirectUrl.startsWith('/app') ? redirectUrl : '/app', {
          replace: true,
        });
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại!';
      setServerError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Đăng Nhập Hệ Thống</h2>
        <p className="mt-1 text-xs text-slate-500">
          Nhập tài khoản được cấp bởi Quản trị viên để truy cập
        </p>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-200 animate-in fade-in duration-150">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Username */}
        <FormField
          label="Tên đăng nhập / Email / SĐT"
          name="username"
          required
          error={errors.username}
        >
          <Input
            id="username"
            type="text"
            placeholder="vd: manager@vinagreen.vn hoặc 0912345678"
            autoComplete="username"
            hasError={Boolean(errors.username)}
            {...register('username', {
              required: 'Vui lòng nhập tên đăng nhập, email hoặc số điện thoại',
            })}
          />
        </FormField>

        {/* Password */}
        <FormField
          label="Mật khẩu"
          name="password"
          required
          error={errors.password}
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pr-10"
              hasError={Boolean(errors.password)}
              {...register('password', {
                required: 'Vui lòng nhập mật khẩu',
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        {/* Submit Button with Double-Submit Guard */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            loadingText="Đang xác thực..."
            icon={LogIn}
            className="w-full shadow-md"
          >
            Đăng Nhập
          </Button>
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-[11px] text-slate-500">
        Cổng đăng nhập hợp nhất bảo mật cao cấp Agri-ERP.
        <br />
        Xác thực phiên qua HttpOnly Refresh Token Rotation.
      </div>
    </div>
  );
}

export default LoginPage;
