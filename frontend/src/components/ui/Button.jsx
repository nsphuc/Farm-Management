import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/formatters';
import { renderIcon } from '@/utils/iconHelper';

// Re-export để các UI components khác có thể import trực tiếp từ Button.jsx hoặc từ iconHelper
export { renderIcon };
export const renderSafeIcon = renderIcon;

const VARIANTS = {
  primary:
    'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm focus-visible:ring-emerald-500',
  secondary:
    'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-slate-400',
  success:
    'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-sm focus-visible:ring-green-500',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm focus-visible:ring-rose-500',
  outline:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 shadow-xs focus-visible:ring-emerald-500',
  ghost:
    'text-slate-600 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-400',
};

const SIZES = {
  sm: 'px-2.5 py-1.5 text-xs font-medium rounded-md gap-1.5',
  md: 'px-3.5 py-2 text-sm font-medium rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base font-semibold rounded-lg gap-2.5',
};

/**
 * Button Component with Built-in Double-Submit Guard (Tiêu chí 1 File 10)
 * Hỗ trợ đa định dạng icon: JSX Element (<Plus />), Lucide Component (Plus), leftIcon, rightIcon.
 * Tự động disabled + Spinner "Đang xử lý..." khi isLoading = true.
 */
export const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loading,
      loadingText = 'Đang xử lý...',
      icon,
      leftIcon,
      rightIcon,
      iconRight,
      disabled,
      className,
      type = 'button',
      onClick,
      ...props
    },
    ref
  ) => {
    const showLoading = Boolean(isLoading || loading);
    const isDisabled = Boolean(disabled || showLoading);

    const handleClick = (e) => {
      if (isDisabled) {
        e.preventDefault();
        return;
      }
      if (onClick) {
        onClick(e);
      }
    };

    const iconSizeClass =
      size === 'sm'
        ? 'h-3.5 w-3.5 shrink-0'
        : size === 'lg'
        ? 'h-5 w-5 shrink-0'
        : 'h-4 w-4 shrink-0';

    const leadingIcon = leftIcon || icon;
    const trailingIcon = rightIcon || iconRight;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-60 disabled:pointer-events-none',
          VARIANTS[variant] || VARIANTS.primary,
          SIZES[size] || SIZES.md,
          className
        )}
        {...props}
      >
        {showLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>{loadingText}</span>
          </>
        ) : (
          <>
            {renderIcon(leadingIcon, iconSizeClass)}
            {children}
            {renderIcon(trailingIcon, iconSizeClass)}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
