import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle, KeyRound, Mail, Clock, X, CheckCircle2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { FormField, Input } from '@/components/ui/FormControls';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const { syncFromAccessibleFarms } = useActiveFarmStore();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotCountdown, setForgotCountdown] = useState(0);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotError, setForgotError] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    let timer;
    if (forgotCountdown > 0) {
      timer = setTimeout(() => setForgotCountdown(forgotCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [forgotCountdown]);

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

      // 1. Lưu token in-memory trong Zustand store
      setAuth(accessToken, userInfo);

      // 2. Đồng bộ ngữ cảnh trang trại
      if (userInfo?.accessibleFarms?.length) {
        syncFromAccessibleFarms(userInfo.accessibleFarms);
      } else {
        useActiveFarmStore.getState().clearActiveContext();
      }

      // 3. Kiểm tra cưỡng chế đổi mật khẩu lần đầu
      if (mustChangePassword || userInfo?.mustChangePassword) {
        navigate('/force-change-password', { replace: true });
        return;
      }

      // 4. Điều hướng theo phân quyền:
      // - Super Admin -> /platform
      // - Nếu chưa có trang trại -> /onboarding (Nhiệm vụ 4)
      // - Nếu đã có trang trại -> /app
      const params = new URLSearchParams(location.search);
      const redirectUrl = params.get('redirect');

      if (userInfo?.isSuperAdmin) {
        navigate(
          redirectUrl && (redirectUrl.startsWith('/platform') || redirectUrl.startsWith('/admin'))
            ? redirectUrl
            : '/platform/tenants',
          { replace: true }
        );
      } else if (!userInfo?.accessibleFarms || userInfo.accessibleFarms.length === 0) {
        navigate('/onboarding', { replace: true });
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

  // Gửi OTP quên mật khẩu
  const handleSendForgotOtp = async () => {
    setForgotError(null);
    const id = forgotIdentifier.trim();
    if (!id) {
      setForgotError('Vui lòng nhập email @gmail.com của bạn');
      return;
    }
    if (!id.toLowerCase().endsWith('@gmail.com')) {
      setForgotError('Email bắt buộc phải có định dạng @gmail.com (ví dụ: user@gmail.com)');
      return;
    }
    try {
      setForgotLoading(true);
      await axios.post('/api/v1/auth/send-otp', {
        email: id.toLowerCase(),
        type: 'FORGOT_PASSWORD',
      });
      setForgotOtpSent(true);
      setForgotCountdown(60);
      toast.success(`Mã OTP đã được gửi đến email ${id}!`);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email!');
    } finally {
      setForgotLoading(false);
    }
  };

  // Xác nhận đổi mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError(null);

    if (!forgotOtp.trim() || forgotOtp.trim().length !== 6) {
      setForgotError('Vui lòng nhập mã OTP gồm 6 chữ số');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 8) {
      setForgotError('Mật khẩu mới phải từ 8 ký tự trở lên (gồm chữ hoa, thường và số)');
      return;
    }

    try {
      setForgotLoading(true);
      await axios.post('/api/v1/auth/forgot-password-with-otp', {
        identifier: forgotIdentifier.trim(),
        otpCode: forgotOtp.trim(),
        newPassword: forgotNewPassword,
      });

      toast.success('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.');
      setShowForgotModal(false);
      setValue('username', forgotIdentifier.trim());
      setValue('password', '');
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại!');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Đăng Nhập FarmGo</h2>
        <p className="mt-1 text-xs text-slate-500">
          Đăng nhập bằng Số điện thoại hoặc Email để quản lý chăn nuôi
        </p>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-200 animate-in fade-in duration-150">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Username / Phone / Email */}
        <FormField
          label="Số điện thoại hoặc Email *"
          name="username"
          required
          error={errors.username}
        >
          <Input
            id="username"
            type="text"
            placeholder="vd: 0912345678 hoặc user@gmail.com"
            autoComplete="username"
            className="text-xs"
            hasError={Boolean(errors.username)}
            {...register('username', {
              required: 'Vui lòng nhập số điện thoại hoặc email',
              validate: (val) => {
                if (val && val.includes('@') && !val.trim().toLowerCase().endsWith('@gmail.com')) {
                  return 'Email đăng nhập bắt buộc phải có định dạng @gmail.com';
                }
                return true;
              },
            })}
          />
        </FormField>

        {/* Password */}
        <FormField
          label="Mật khẩu *"
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
              className="pr-10 text-xs"
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

        <div className="flex items-center justify-between text-xs pt-1">
          <button
            type="button"
            onClick={() => {
              setForgotError(null);
              setShowForgotModal(true);
            }}
            className="text-emerald-700 hover:underline font-semibold"
          >
            Quên mật khẩu?
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            loadingText="Đang xác thực..."
            icon={LogIn}
            className="w-full shadow-md bg-emerald-600 hover:bg-emerald-700 font-bold text-xs"
          >
            Đăng Nhập
          </Button>
        </div>
      </form>

      {/* Chuyển sang Đăng ký */}
      <div className="text-center pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-bold text-emerald-700 hover:underline">
            Đăng ký tài khoản mới
          </Link>
        </p>
      </div>

      {/* Modal Quên mật khẩu qua OTP */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-emerald-600" />
                Khôi Phục Mật Khẩu
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {forgotError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{forgotError}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email đăng ký (@gmail.com) *
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="user@gmail.com"
                    className="text-xs flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={forgotLoading || forgotCountdown > 0}
                    onClick={handleSendForgotOtp}
                    className="shrink-0 text-xs border-emerald-300 text-emerald-800"
                  >
                    {forgotLoading ? (
                      'Đang gửi...'
                    ) : forgotCountdown > 0 ? (
                      `${forgotCountdown}s`
                    ) : forgotOtpSent ? (
                      'Gửi lại'
                    ) : (
                      'Lấy mã OTP'
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã xác thực OTP 6 số *
                </label>
                <Input
                  type="text"
                  maxLength={6}
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  placeholder="Nhập 6 số OTP từ email"
                  className="tracking-widest font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu mới *
                </label>
                <Input
                  type="password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự (hoa, thường, số)"
                  className="text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForgotModal(false)}
                  className="text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Xác nhận đổi mật khẩu
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
