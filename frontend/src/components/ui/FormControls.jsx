import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/formatters';

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
 */
export const Input = React.forwardRef(
  ({ name, id, error, className, hasError, type = 'text', ...props }, ref) => {
    const isError = Boolean(error || hasError);

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
 */
export const Select = React.forwardRef(
  ({ name, id, error, hasError, options = [], children, className, placeholder, ...props }, ref) => {
    const isError = Boolean(error || hasError);

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
