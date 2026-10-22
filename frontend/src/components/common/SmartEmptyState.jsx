import React from 'react';
import { Inbox, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Can } from '@/components/common/Can';
import { cn } from '@/utils/formatters';
import { renderIcon } from '@/utils/iconHelper';

/**
 * SmartEmptyState Component (Tiêu chí 2 File 10 & Điều 4 File 08)
 * Không để bảng trống vô hồn, hiển thị hình ảnh thân thiện kèm nút CTA điều hướng tạo dữ liệu gốc.
 * Hỗ trợ đa định dạng icon/emptyIcon: JSX Element (<Inbox />) hoặc Component type (Inbox).
 */
export function SmartEmptyState({
  icon = Inbox,
  emptyIcon,
  title = 'Chưa có dữ liệu nào',
  description = 'Hiện tại chưa có bản ghi nào trong hệ thống. Hãy bắt đầu bằng cách thêm mới bên dưới.',
  actionLabel,
  onAction,
  actionIcon = Plus,
  permission,
  className,
}) {
  const targetIcon = emptyIcon || icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center transition-all',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
        {renderIcon(targetIcon, 'h-8 w-8 text-emerald-600')}
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-800">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="mt-6">
          {permission ? (
            <Can permission={permission}>
              <Button
                variant="primary"
                size="md"
                icon={actionIcon}
                onClick={onAction}
              >
                {actionLabel}
              </Button>
            </Can>
          ) : (
            <Button
              variant="primary"
              size="md"
              icon={actionIcon}
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default SmartEmptyState;
