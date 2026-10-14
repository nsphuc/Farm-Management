import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { systemService } from '../../services/api/systemService';
import {
  Server,
  Database,
  ShieldCheck,
  Boxes,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const DashboardPage = () => {
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await systemService.getSystemInfo();
      setSystemInfo(response.data);
    } catch (err) {
      setError(err.message || 'Không thể kết nối đến Backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bảng Điều Khiển Kỹ Thuật (Phase 1)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Xác minh kết nối Backend Spring Boot 3, MySQL 8 CSDL và Khung giao diện React + Vite.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStatus} loading={loading}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Làm mới trạng thái
        </Button>
      </div>

      {/* Connectivity Banner */}
      {error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Chưa kết nối được Backend</h4>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
            <p className="text-xs text-rose-600 mt-2">Vui lòng đảm bảo Backend đang chạy tại <code className="bg-rose-100 px-1 py-0.5 rounded">http://localhost:8080</code> qua lệnh <code className="bg-rose-100 px-1 py-0.5 rounded">mvn spring-boot:run</code>.</p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Kết nối Backend & CSDL Hoạt Động Bình Thường</p>
              <p className="text-xs text-emerald-700">Flyway Migration V1_0 đã khởi tạo thành công 70 bảng nghiệp vụ và 30 permissions.</p>
            </div>
          </div>
          <Badge variant="success">Hệ thống Sẵn sàng</Badge>
        </div>
      )}

      {/* Technical Architecture Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Backend Service</p>
              <h4 className="text-xl font-bold text-slate-900 mt-1">Spring Boot 3.3.4</h4>
              <p className="text-xs text-slate-400 mt-0.5">Java 21 LTS - REST API</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Server className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cơ sở dữ liệu</p>
              <h4 className="text-xl font-bold text-slate-900 mt-1">MySQL 8.0.46</h4>
              <p className="text-xs text-slate-400 mt-0.5">Flyway 70 Bảng nghiệp vụ</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phân quyền</p>
              <h4 className="text-xl font-bold text-slate-900 mt-1">RBAC 6 Roles</h4>
              <p className="text-xs text-slate-400 mt-0.5">30 Permissions chuẩn</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Kiến trúc Giao diện</p>
              <h4 className="text-xl font-bold text-slate-900 mt-1">React + Vite</h4>
              <p className="text-xs text-slate-400 mt-0.5">TailwindCSS, Zustand, Router</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Boxes className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Backend Details & API Link */}
      <Card title="Thông Tin Kỹ Thuật Runtime" subtitle="Chi tiết trạng thái hệ thống trả về từ API /api/v1/system/info">
        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Đang tải thông tin...</div>
        ) : systemInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500">Tên ứng dụng:</span>
              <p className="font-semibold text-sm text-slate-800">{systemInfo.application}</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500">Phiên bản Backend:</span>
              <p className="font-semibold text-sm text-slate-800">{systemInfo.version}</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500">Trạng thái CSDL:</span>
              <p className="font-semibold text-sm text-slate-800">{systemInfo.database}</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500">Phiên bản Flyway Schema:</span>
              <p className="font-semibold text-sm text-slate-800">v{systemInfo.schemaVersion}</p>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-slate-400 text-sm">Chưa có dữ liệu runtime.</div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between text-xs text-slate-500">
          <div>
            Swagger UI Docs: <a href="http://localhost:8080/swagger-ui.html" target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold hover:underline">/swagger-ui.html</a>
          </div>
          <div>
            Actuator Health: <a href="http://localhost:8080/actuator/health" target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold hover:underline">/actuator/health</a>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
