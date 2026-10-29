import React, { useState } from 'react';
import {
  Radio,
  Building,
  Users,
  AlertTriangle,
  Info,
  Bell,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { platformService } from '@/services/modules/platformService';
import { toast } from '@/store/useToastStore';

const PRESET_TEMPLATES = [
  {
    id: 'maintenance',
    label: '🛠️ Bảo trì máy chủ định kỳ',
    type: 'ALERT',
    title: 'Thông báo: Bảo trì và nâng cấp hạ tầng máy chủ định kỳ',
    message:
      'Hệ thống Agri-ERP sẽ tiến hành bảo trì hạ tầng đám mây trong khoảng thời gian từ 00:00 đến 02:00. Trong thời gian này, các tính năng có thể gián đoạn tạm thời. Trân trọng cảm ơn!',
  },
  {
    id: 'renewal',
    label: '💳 Nhắc gia hạn gói dịch vụ SaaS',
    type: 'WARNING',
    title: 'Thông báo: Nhắc nhở thời hạn gói dịch vụ SaaS',
    message:
      'Gói cước SaaS của doanh nghiệp bạn sắp đến kỳ gia hạn. Vui lòng liên hệ Quản trị viên hệ thống để kiểm tra và duy trì không gián đoạn các hoạt động trang trại.',
  },
  {
    id: 'new_feature',
    label: '✨ Ra mắt tính năng mới',
    type: 'INFO',
    title: 'Thông báo: Cập nhật tính năng Báo cáo & QR Traceability v2.0',
    message:
      'Hệ thống vừa cập nhật phân hệ Báo cáo Tài chính Real-time và Bản đồ phân khu WS-A với trải nghiệm mượt mà hơn. Hãy trải nghiệm ngay!',
  },
];

export function BroadcastNotificationModal({ isOpen, onClose, tenants = [], onSuccess }) {
  const [scope, setScope] = useState('ALL'); // ALL or SPECIFIC
  const [targetTenantId, setTargetTenantId] = useState('');
  const [onlyOwners, setOnlyOwners] = useState(true);
  const [type, setType] = useState('SYSTEM');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleApplyPreset = (presetId) => {
    const tmpl = PRESET_TEMPLATES.find((t) => t.id === presetId);
    if (tmpl) {
      setType(tmpl.type);
      setTitle(tmpl.title);
      setMessage(tmpl.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung thông báo');
      return;
    }
    if (scope === 'SPECIFIC' && !targetTenantId) {
      toast.error('Vui lòng chọn Doanh nghiệp nhận thông báo');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        message: message.trim(),
        type,
        targetTenantId: scope === 'SPECIFIC' ? Number(targetTenantId) : null,
        onlyOwners,
      };

      const res = await platformService.broadcastNotification(payload);
      toast.success(res?.message || `Phát thông báo thành công đến ${res?.recipientCount || 0} tài khoản!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Broadcast notification error:', err);
      toast.error(err?.response?.data?.message || 'Lỗi khi phát thông báo diện rộng');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Phát Thông Báo Hệ Thống Diện Rộng (Broadcast)
            </h3>
            <p className="text-xs text-slate-500">
              Gửi thông báo tức thì tới hàng loạt Doanh nghiệp thuê bao và người dùng
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Mẫu soạn nhanh */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Chọn Mẫu Soạn Nhanh (Preset Templates)
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleApplyPreset(tmpl.id)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-rose-400 hover:bg-rose-50/50 hover:text-rose-700 transition-colors"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Phạm vi gửi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phạm Vi Doanh Nghiệp
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-rose-500 focus:outline-none"
              >
                <option value="ALL">🌐 Tất cả Doanh nghiệp ACTIVE</option>
                <option value="SPECIFIC">🏢 Chọn 1 Doanh nghiệp cụ thể</option>
              </select>
            </div>

            {scope === 'SPECIFIC' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn Doanh Nghiệp (Tenant) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={targetTenantId}
                  onChange={(e) => setTargetTenantId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-rose-500 focus:outline-none"
                >
                  <option value="">-- Chọn Doanh nghiệp --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Đối tượng & Loại thông báo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Đối Tượng Nhận
              </label>
              <select
                value={onlyOwners ? 'owners' : 'all'}
                onChange={(e) => setOnlyOwners(e.target.value === 'owners')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-rose-500 focus:outline-none"
              >
                <option value="owners">👑 Chỉ Chủ đầu tư (ROLE_FARM_OWNER)</option>
                <option value="all">👥 Toàn bộ người dùng ACTIVE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Loại Thông Báo (Type)
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-rose-500 focus:outline-none"
              >
                <option value="SYSTEM">🔔 SYSTEM (Thông báo hệ thống)</option>
                <option value="ALERT">🚨 ALERT (Khẩn cấp / Bảo trì)</option>
                <option value="WARNING">⚠️ WARNING (Cảnh báo hạn mức)</option>
                <option value="INFO">ℹ️ INFO (Tin tức / Hướng dẫn)</option>
              </select>
            </div>
          </div>

          {/* Tiêu đề & Nội dung */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu Đề Thông Báo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Thông báo bảo trì máy chủ..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nội Dung Chi Tiết <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Nhập nội dung thông báo gửi đến người dùng..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium focus:border-rose-500 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="md" onClick={onClose}>
              Hủy Bỏ
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="md"
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 font-bold shadow-md shadow-rose-600/20"
            >
              {isSubmitting ? 'Đang Phát...' : '📢 Phát Thông Báo Ngay'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BroadcastNotificationModal;

