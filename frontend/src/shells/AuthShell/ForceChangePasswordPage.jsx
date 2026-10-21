import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldAlert, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { FormField, Input } from '@/components/ui/FormControls';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

// Chuẩn NIST Regex: 8-64 ký tự, gồm ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt (@$!%*?&)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$/;

/**
 * ForceChangePasswordPage Component (Mục 1.1.1 File 08 & Tiêu chí 6 File 10)
 * Màn hình cưỡng chế đổi mật khẩu lần đầu. Không thể tắt, đóng hay bỏ qua.
 */
export function ForceChangePasswordPage() {
  const navigate = useNavigate();
  const { accessToken, userInfo, setAuth, setMustChangePassword, isSuperAdmin } = useAuthStore();
  const { syncFromAccessibleFarms } = useActiveFarmStore();

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPasswordValue = watch('newPassword');

  const onSubmit = async (data) => {
    setServerError(null);

    if (data.newPassword === data.oldPassword) {
      setServerError('Mật khẩu mới không được trùng với mật khẩu cũ hiện tại!');
      return;
    }

    try {
      const response = await axios.post(
        '/api/v1/auth/change-password',
        {
          oldPassword: data.oldPassword,
          newPassword: data.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      const resData = response.data || {};
      const newAccessToken = resData.accessToken || accessToken;
      const newUserInfo = resData.userInfo
        ? { ...resData.userInfo, mustChangePassword: false }
        : userInfo
        ? { ...userInfo, mustChangePassword: false }
        : null;

      // Cập nhật Auth Store với accessToken mới & userInfo đã gỡ cờ mustChangePassword
      if (newAccessToken && newUserInfo) {
        setAuth(newAccessToken, newUserInfo);
      } else {
        setMustChangePassword(false);
      }

      // Đồng bộ thông tin trang trại nếu có
      if (newUserInfo?.accessibleFarms?.length) {
        syncFromAccessibleFarms(newUserInfo.accessibleFarms);
      }

      setIsSuccess(true);

      setTimeout(() => {
        if (isSuperAdmin()) {
          navigate('/platform', { replace: true });
        } else {
          navigate('/app', { replace: true });
        }
      }, 1000);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ!';
      setServerError(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="mt-3 text-xl font-bold text-slate-900 tracking-tight">
          Bắt Buộc Đổi Mật Khẩu Lần Đầu
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Để đảm bảo an toàn tài khoản nông trại, bạn bắt buộc phải thiết lập mật khẩu mới trước khi tiếp tục.
        </p>
      </div>

      {serverError && (
        <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-200 animate-in fade-in duration-150">
          {serverError}
        </div>
      )}

      {isSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 ring-1 ring-emerald-200 animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Đổi mật khẩu thành công! Đang chuyển hướng vào hệ thống...</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Old Password */}
        <FormField
          label="Mật khẩu cũ (do Admin cấp)"
          name="oldPassword"
          required
          error={errors.oldPassword}
        >
          <div className="relative">
            <Input
              id="oldPassword"
              type={showOldPass ? 'text' : 'password'}
              placeholder="••••••••"
              hasError={Boolean(errors.oldPassword)}
              {...register('oldPassword', {
                required: 'Vui lòng nhập mật khẩu cũ hiện tại',
              })}
            />
            <button
              type="button"
              onClick={() => setShowOldPass(!showOldPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showOldPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        {/* New Password */}
        <FormField
          label="Mật khẩu mới"
          name="newPassword"
          required
          error={errors.newPassword}
          hint="Từ 8-64 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)"
        >
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPass ? 'text' : 'password'}
              placeholder="••••••••"
              hasError={Boolean(errors.newPassword)}
              {...register('newPassword', {
                required: 'Vui lòng nhập mật khẩu mới',
                pattern: {
                  value: PASSWORD_REGEX,
                  message:
                    'Mật khẩu phải từ 8-64 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&)',
                },
              })}
            />
            <button
              type="button"
              onClick={() => setShowNewPass(!showNewPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        {/* Confirm Password */}
        <FormField
          label="Xác nhận mật khẩu mới"
          name="confirmPassword"
          required
          error={errors.confirmPassword}
        >
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPass ? 'text' : 'password'}
              placeholder="••••••••"
              hasError={Boolean(errors.confirmPassword)}
              {...register('confirmPassword', {
                required: 'Vui lòng xác nhận mật khẩu mới',
                validate: (val) =>
                  val === newPasswordValue || 'Mật khẩu xác nhận không khớp với mật khẩu mới',
              })}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            loadingText="Đang cập nhật mật khẩu..."
            icon={KeyRound}
            className="w-full shadow-md"
          >
            Lưu Mật Khẩu Mới & Tiếp Tục
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ForceChangePasswordPage;
