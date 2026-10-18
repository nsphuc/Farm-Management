import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, Lock, ShieldAlert, CheckCircle2, XCircle, KeyRound, AlertCircle } from 'lucide-react';
import { authService } from '../../services/auth/authService';
import { toast } from '../../store/ui/useToastStore';

// Regex chuẩn NIST Security từ master-validation-constraints.md:
// Tối thiểu 8 ký tự, tối đa 64 ký tự, ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt (@$!%*?&._-#)
const NIST_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-#])[A-Za-z\d@$!%*?&._\-#]{8,64}$/;

export const ForceChangePasswordModal = ({
  isOpen,
  onClose,
  username,
  initialOldPassword = '',
  onSuccess,
}) => {
  const [oldPassword, setOldPassword] = useState(initialOldPassword);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Các tiêu chí kiểm tra độ phức tạp của mật khẩu mới theo chuẩn NIST
  const criteria = useMemo(() => {
    return {
      length: newPassword.length >= 8 && newPassword.length <= 64,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /\d/.test(newPassword),
      hasSpecial: /[@$!%*?&._\-#]/.test(newPassword),
    };
  }, [newPassword]);

  const isPasswordValid = useMemo(() => {
    return NIST_PASSWORD_REGEX.test(newPassword);
  }, [newPassword]);

  const isSameAsOld = useMemo(() => {
    return Boolean(oldPassword && newPassword && oldPassword === newPassword);
  }, [oldPassword, newPassword]);

  const isMatch = useMemo(() => {
    return Boolean(confirmPassword && newPassword === confirmPassword);
  }, [newPassword, confirmPassword]);

  const isFormValid = useMemo(() => {
    return (
      Boolean(oldPassword?.trim()) &&
      isPasswordValid &&
      !isSameAsOld &&
      isMatch
    );
  }, [oldPassword, isPasswordValid, isSameAsOld, isMatch]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!isFormValid) {
      if (!isPasswordValid) {
        setServerError('Mật khẩu mới chưa đáp ứng đầy đủ tiêu chuẩn bảo mật NIST.');
      } else if (isSameAsOld) {
        setServerError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      } else if (!isMatch) {
        setServerError('Xác nhận mật khẩu không khớp với mật khẩu mới.');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.changePassword({
        username: username?.trim(),
        oldPassword: oldPassword?.trim(),
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      });

      toast.success(
        'Đổi mật khẩu thành công! Tài khoản đã được kích hoạt vĩnh viễn.',
        'Thiết lập bảo mật thành công'
      );

      if (onSuccess) {
        onSuccess(newPassword);
      }
    } catch (err) {
      const msg =
        err.message ||
        err.response?.data?.message ||
        'Không thể đổi mật khẩu. Vui lòng kiểm tra lại thông tin.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden transform transition-all">
        {/* Header với dải màu cảnh báo & biểu tượng bảo mật */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-6 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-white mb-3 shadow-inner">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight font-serif">
            Yêu cầu Đổi Mật khẩu Lần đầu
          </h2>
          <p className="text-xs text-amber-100 mt-1 max-w-sm mx-auto">
            Tài khoản <span className="font-semibold text-white">[{username}]</span> đang sử dụng mật khẩu mặc định (Ngày sinh). Vui lòng thiết lập mật khẩu mạnh để kích hoạt quyền truy cập.
          </p>
        </div>

        {/* Nội dung Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {/* Thông báo lỗi từ Server */}
          {serverError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium">{serverError}</span>
            </div>
          )}

          {/* 1. Mật khẩu hiện tại (Ngày sinh) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Mật khẩu hiện tại (Mặc định) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Nhập mật khẩu ngày sinh (ddMMyyyy)"
                required
                disabled={isSubmitting}
                className="block w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 2. Mật khẩu mới */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới mạnh mẽ"
                required
                disabled={isSubmitting}
                className={`block w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 ${
                  newPassword.length > 0 && !isPasswordValid
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-rose-500/20 focus:border-rose-500'
                    : isPasswordValid
                    ? 'border-emerald-500 bg-emerald-50/30 text-slate-800 focus:ring-emerald-500/20 focus:border-emerald-500'
                    : 'border-slate-200 bg-slate-50/50 text-slate-800 focus:ring-amber-500/20 focus:border-amber-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Báo lỗi đỏ real-time nếu mật khẩu trùng với mật khẩu cũ */}
            {isSameAsOld && (
              <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Mật khẩu mới không được trùng với mật khẩu mặc định hiện tại!
              </p>
            )}

            {/* Tiêu chuẩn NIST Checklist */}
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                Quy chuẩn NIST Security (master-validation-constraints.md):
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className={`flex items-center gap-1.5 ${criteria.length ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {criteria.length ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <span>Từ 8 đến 64 ký tự</span>
                </div>
                <div className={`flex items-center gap-1.5 ${criteria.hasUpper ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {criteria.hasUpper ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <span>Ít nhất 1 chữ hoa (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${criteria.hasLower ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {criteria.hasLower ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <span>Ít nhất 1 chữ thường (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${criteria.hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {criteria.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <span>Ít nhất 1 chữ số (0-9)</span>
                </div>
                <div className={`col-span-2 flex items-center gap-1.5 ${criteria.hasSpecial ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {criteria.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <span>Ký tự đặc biệt (@$!%*?&._-#)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Xác nhận mật khẩu mới */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                required
                disabled={isSubmitting}
                className={`block w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 ${
                  confirmPassword.length > 0 && !isMatch
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-rose-500/20 focus:border-rose-500'
                    : confirmPassword.length > 0 && isMatch
                    ? 'border-emerald-500 bg-emerald-50/30 text-slate-800 focus:ring-emerald-500/20 focus:border-emerald-500'
                    : 'border-slate-200 bg-slate-50/50 text-slate-800 focus:ring-amber-500/20 focus:border-amber-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Báo đỏ real-time nếu không khớp */}
            {confirmPassword.length > 0 && !isMatch && (
              <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Mật khẩu xác nhận không khớp với mật khẩu mới!
              </p>
            )}
          </div>

          {/* Nút hành động */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Hủy bỏ & Quay lại
            </button>

            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm shadow-md transition-all duration-200 ${
                isFormValid && !isSubmitting
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/30 cursor-pointer active:scale-98'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang lưu mật khẩu mới...</span>
                </>
              ) : (
                'Kích hoạt & Đổi Mật Khẩu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForceChangePasswordModal;
