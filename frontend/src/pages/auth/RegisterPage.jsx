import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UserPlus, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Mail, 
  Phone, 
  User, 
  Lock, 
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Clock
} from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { FormField, Input } from '@/components/ui/FormControls';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { toast } from '@/store/useToastStore';

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      password: '',
      otpCode: '',
    },
    mode: 'onBlur',
  });

  const emailValue = watch('email');

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle Send OTP
  const handleSendOtp = async () => {
    setServerError(null);
    clearErrors('email');

    const email = emailValue?.trim().toLowerCase();
    if (!email) {
      setError('email', { type: 'manual', message: 'Vui lòng nhập email trước khi lấy mã OTP' });
      return;
    }

    // Kiểm tra định dạng bắt buộc @gmail.com (Nhiệm vụ 2)
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      setError('email', { type: 'manual', message: 'Email bắt buộc phải có định dạng @gmail.com (Ví dụ: user@gmail.com)' });
      return;
    }

    try {
      setIsSendingOtp(true);
      await axios.post('/api/v1/auth/send-otp', {
        email,
        type: 'REGISTER',
      });
      setOtpSent(true);
      setCountdown(60);
      toast.success(`Mã OTP đã được gửi đến ${email}. Vui lòng kiểm tra hộp thư!`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng thử lại sau!';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Submit Registration Form
  const onSubmit = async (data) => {
    setServerError(null);

    // Kiểm tra OTP đã nhập chưa
    if (!data.otpCode || data.otpCode.trim().length !== 6) {
      setError('otpCode', { type: 'manual', message: 'Vui lòng nhập mã xác thực OTP gồm 6 chữ số' });
      return;
    }

    try {
      const response = await axios.post(
        '/api/v1/auth/register',
        {
          fullName: data.fullName.trim(),
          phone: data.phone.trim(),
          email: data.email.trim().toLowerCase(),
          password: data.password,
          otpCode: data.otpCode.trim(),
        },
        { withCredentials: true }
      );

      const { accessToken, userInfo } = response.data;

      // Lưu token vào Zustand store
      setAuth(accessToken, userInfo);
      if (userInfo?.accessibleFarms?.length) {
        useActiveFarmStore.getState().syncFromAccessibleFarms(userInfo.accessibleFarms);
      } else {
        useActiveFarmStore.getState().clearActiveContext();
      }

      toast.success('Đăng ký tài khoản và khởi tạo trang trại thành công!');

      // Tự động điều hướng vào ứng dụng trang trại
      navigate('/app', { replace: true });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Đăng ký tài khoản thất bại. Vui lòng kiểm tra lại thông tin!';
      setServerError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Đăng Ký Tài Khoản FarmGo</h2>
        <p className="mt-1 text-xs text-slate-500">
          Tạo tài khoản để quản lý cơ sở chăn nuôi thông minh của bạn
        </p>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-200 animate-in fade-in duration-150">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Họ và tên */}
        <FormField label="Họ và tên *" error={errors.fullName?.message}>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Ví dụ: Nguyễn Văn Bình"
              className="pl-9 text-xs"
              {...register('fullName', {
                required: 'Vui lòng nhập họ và tên',
                minLength: { value: 2, message: 'Họ và tên phải từ 2 ký tự' },
                pattern: {
                  value: /^[\p{L}\s]{2,150}$/u,
                  message: 'Họ và tên không được chứa số hoặc ký tự đặc biệt',
                },
              })}
            />
          </div>
        </FormField>

        {/* Số điện thoại */}
        <FormField label="Số điện thoại *" error={errors.phone?.message}>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="tel"
              placeholder="Ví dụ: 0912345678"
              className="pl-9 text-xs"
              {...register('phone', {
                required: 'Vui lòng nhập số điện thoại',
                pattern: {
                  value: /^(03|05|07|08|09)\d{8}$/,
                  message: 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 03, 05, 07, 08, 09)',
                },
              })}
            />
          </div>
        </FormField>

        {/* Email (@gmail.com) */}
        <FormField 
          label="Email (bắt buộc @gmail.com) *" 
          error={errors.email?.message}
          hint="Hệ thống gửi mã xác thực OTP về email này"
        >
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="email"
              placeholder="user@gmail.com"
              className="pl-9 text-xs"
              {...register('email', {
                required: 'Vui lòng nhập email',
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
                  message: 'Email bắt buộc phải có định dạng @gmail.com (Ví dụ: user@gmail.com)',
                },
              })}
            />
          </div>
        </FormField>

        {/* Mã xác thực OTP qua Email */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Mã xác thực Email (OTP) *
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                maxLength={6}
                placeholder="Nhập 6 số OTP"
                className="pl-9 tracking-widest font-mono font-bold text-xs"
                {...register('otpCode', {
                  required: 'Vui lòng nhập mã OTP',
                  pattern: {
                    value: /^\d{6}$/,
                    message: 'Mã OTP gồm 6 chữ số',
                  },
                })}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSendingOtp || countdown > 0}
              onClick={handleSendOtp}
              className="shrink-0 text-xs font-semibold px-3 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
            >
              {isSendingOtp ? (
                'Đang gửi...'
              ) : countdown > 0 ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {countdown}s
                </span>
              ) : otpSent ? (
                'Gửi lại mã'
              ) : (
                'Nhận mã OTP'
              )}
            </Button>
          </div>
          {errors.otpCode && (
            <p className="text-[11px] text-rose-600">{errors.otpCode.message}</p>
          )}
        </div>

        {/* Mật khẩu */}
        <FormField 
          label="Mật khẩu *" 
          error={errors.password?.message}
          hint="Tối thiểu 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số"
        >
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="pl-9 pr-10 text-xs"
              {...register('password', {
                required: 'Vui lòng nhập mật khẩu',
                minLength: { value: 8, message: 'Mật khẩu phải từ 8 ký tự trở lên' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                  message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số',
                },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        {/* Nút Đăng ký */}
        <Button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm shadow-emerald-600/30"
          isLoading={isSubmitting}
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          Đăng Ký Tài Khoản
        </Button>
      </form>

      {/* Chuyển sang Đăng nhập */}
      <div className="text-center pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-bold text-emerald-700 hover:underline">
            Đăng nhập tại đây
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
