import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/formatters';
import { renderIcon } from '@/utils/iconHelper';
import { Button } from './Button';

/**
 * FormField wrapper with Label, Asterisk, and Inline Field Error (Tiêu chí 4 File 10)
 */
export function FormField({
  label,
  name,
  required = false,
  error,
  hint,
  children,
  className,
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={name}
          className="text-xs font-semibold text-slate-700 flex items-center gap-1"
        >
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      {children}

      {hint && !error && <p className="text-[11px] text-slate-500">{hint}</p>}

      {error && (
        <p className="flex items-center gap-1 text-[11px] font-medium text-rose-600 animate-in fade-in duration-150">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{typeof error === 'string' ? error : error.message}</span>
        </p>
      )}
    </div>
  );
}

/**
 * Standard TextInput with React Hook Form ref support
 * Hỗ trợ đa định dạng prefixIcon / leftIcon / suffixIcon / rightIcon / icon.
 */
export const Input = React.forwardRef(
  (
    {
      name,
      id,
      error,
      className,
      hasError,
      type = 'text',
      icon,
      prefixIcon,
      leftIcon,
      suffixIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const isError = Boolean(error || hasError);
    const leadingIcon = prefixIcon || leftIcon || icon;
    const trailingIcon = suffixIcon || rightIcon;

    if (leadingIcon || trailingIcon) {
      return (
        <div className="relative flex items-center w-full">
          {leadingIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
              {renderIcon(leadingIcon, 'h-4 w-4 shrink-0')}
            </div>
          )}
          <input
            ref={ref}
            id={id || name}
            name={name}
            type={type}
            className={cn(
              'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors',
              'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
              leadingIcon && 'pl-9',
              trailingIcon && 'pr-9',
              isError
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 bg-rose-50/20'
                : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20',
              'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
              className
            )}
            {...props}
          />
          {trailingIcon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-slate-400">
              {renderIcon(trailingIcon, 'h-4 w-4 shrink-0')}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        id={id || name}
        name={name}
        type={type}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors',
          'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
          isError
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 bg-rose-50/20'
            : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20',
          'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

/**
 * Standard SelectInput
 * Hỗ trợ đa định dạng prefixIcon / leftIcon / icon.
 */
export const Select = React.forwardRef(
  (
    {
      name,
      id,
      error,
      hasError,
      options = [],
      children,
      className,
      placeholder,
      icon,
      prefixIcon,
      leftIcon,
      ...props
    },
    ref
  ) => {
    const isError = Boolean(error || hasError);
    const leadingIcon = prefixIcon || leftIcon || icon;

    if (leadingIcon) {
      return (
        <div className="relative flex items-center w-full">
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
            {renderIcon(leadingIcon, 'h-4 w-4 shrink-0')}
          </div>
          <select
            ref={ref}
            id={id || name}
            name={name}
            className={cn(
              'w-full rounded-lg border bg-white pl-9 pr-3 py-2 text-sm text-slate-900 transition-colors cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              isError
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 bg-rose-50/20'
                : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20',
              'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>
        </div>
      );
    }

    return (
      <select
        ref={ref}
        id={id || name}
        name={name}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          isError
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 bg-rose-50/20'
            : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20',
          'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

/**
 * Standard TextareaInput
 */
export const Textarea = React.forwardRef(
  ({ name, id, error, hasError, rows = 3, className, ...props }, ref) => {
    const isError = Boolean(error || hasError);

    return (
      <textarea
        ref={ref}
        id={id || name}
        name={name}
        rows={rows}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors',
          'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
          isError
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 bg-rose-50/20'
            : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20',
          'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

/**
 * Toggle Switch Input
 */
export const Switch = React.forwardRef(
  ({ name, id, checked, onChange, label, description, disabled, className }, ref) => {
    return (
      <label
        htmlFor={id || name}
        className={cn(
          'flex items-center gap-3 cursor-pointer select-none',
          disabled && 'cursor-not-allowed opacity-60',
          className
        )}
      >
        <div className="relative inline-flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={id || name}
            name={name}
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="text-xs font-semibold text-slate-800">{label}</span>}
            {description && <span className="text-[11px] text-slate-500">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);
Switch.displayName = 'Switch';

/**
 * Standardized CodeInput (Mục 1 Chặng Chuẩn Hóa Frontend)
 * - Create Mode:
 *   - Master entity: Input tự động điền mã, kèm nút phụ [🔄 Tự sinh] bên cạnh
 *   - Transaction entity: readOnly={true}, tự động sinh mã
 * - Edit Mode:
 *   - BẮT BUỘC: disabled={true} / readOnly={true} (nền xám bg-slate-100 cursor-not-allowed)
 *     Tuyệt đối không cho phép sửa mã định danh sau khi đã tạo!
 */
export const CodeInput = React.forwardRef(
  (
    {
      value,
      onChange,
      onRegenerate,
      prefix = 'FRM',
      isEditMode = false,
      isTransaction = false,
      placeholder = 'VD: FRM-2610-0001',
      className,
      error,
      disabled,
      readOnly,
      ...props
    },
    ref
  ) => {
    // In edit mode, lock completely
    const isLocked = Boolean(isEditMode || disabled || readOnly);
    const showRegenerateBtn = !isEditMode && !isTransaction && typeof onRegenerate === 'function';

    return (
      <div className="flex items-center gap-2 w-full">
        <Input
          ref={ref}
          value={value}
          onChange={onChange}
          disabled={isLocked}
          readOnly={isTransaction || isLocked}
          placeholder={placeholder}
          error={error}
          className={cn(
            'font-mono uppercase tracking-wider',
            isLocked && 'bg-slate-100 text-slate-500 cursor-not-allowed select-none font-semibold',
            isTransaction && !isLocked && 'bg-slate-50 text-slate-700 font-bold',
            className
          )}
          {...props}
        />
        {showRegenerateBtn && (
          <Button
            type="button"
            variant="outline"
            size="md"
            icon={<RefreshCw className="h-4 w-4 text-emerald-600" />}
            onClick={onRegenerate}
            title="Tự động sinh mã mới"
            className="shrink-0 text-xs font-semibold px-3"
          >
            Tự sinh
          </Button>
        )}
      </div>
    );
  }
);
CodeInput.displayName = 'CodeInput';
