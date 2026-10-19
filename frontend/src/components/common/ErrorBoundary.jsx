import React from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Global & Workspace ErrorBoundary Component (Tiêu chuẩn Chống Sập Trắng Toàn Cục)
 * Bắt mọi runtime render error tại các Workspace, hiển thị UI thân thiện kèm nút Thử Lại / Tải lại trang.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log lỗi để developer dễ truy vết trên console
    console.error('[ErrorBoundary Caught Error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/app';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback(this.state.error, this.handleReset)
          : this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white p-8 sm:p-12 text-center shadow-xs">
          {/* Error Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-300/60 shadow-xs mb-5">
            <AlertTriangle className="h-8 w-8" />
          </div>

          {/* Heading & Notice */}
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Đã xảy ra sự cố không mong muốn
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500 leading-relaxed">
            Khu vực làm việc tạm thời không thể hiển thị do lỗi kỹ thuật runtime. Dữ liệu hệ thống của bạn vẫn an toàn và không bị ảnh hưởng.
          </p>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={this.handleReload}
            >
              Tải lại trang
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={this.handleReset}
            >
              Thử lại khu vực này
            </Button>
            <Button
              variant="ghost"
              size="md"
              icon={<Home className="h-4 w-4" />}
              onClick={this.handleGoHome}
            >
              Về Trang chủ
            </Button>
          </div>

          {/* Technical Debug Collapsible (Hỗ trợ Dev & QA) */}
          {this.state.error && (
            <details className="mt-8 w-full max-w-2xl text-left">
              <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors select-none flex items-center justify-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 transition-transform details-open:rotate-90" />
                <span>Xem thông tin lỗi kỹ thuật (Chi tiết Developer)</span>
              </summary>
              <div className="mt-3 rounded-xl bg-slate-900 p-4 font-mono text-xs text-rose-300 shadow-inner overflow-x-auto max-h-60 leading-relaxed">
                <div className="font-bold text-rose-400 mb-2">
                  {this.state.error.name}: {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <pre className="text-[11px] text-slate-400 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                )}
                {this.state.errorInfo?.componentStack && (
                  <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 whitespace-pre-wrap">
                    <span className="text-amber-400 font-semibold">Component Hierarchy:</span>
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
