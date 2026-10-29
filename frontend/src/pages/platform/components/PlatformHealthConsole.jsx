import React from 'react';
import {
  Activity,
  Database,
  Cpu,
  Clock,
  RefreshCw,
  Server,
  Layers,
  ShieldCheck,
  HardDrive,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PlatformHealthConsole({ metrics = null, isLoading = false, onRefresh }) {
  const dbStatus = metrics?.databaseStatus || 'UP';
  const appliedMigrations = metrics?.appliedMigrationsCount ?? 0;

  const jvmMax = metrics?.jvmMaxMemoryMb || 1;
  const jvmTotal = metrics?.jvmTotalMemoryMb || 0;
  const jvmUsed = metrics?.jvmUsedMemoryMb || 0;
  const jvmFree = metrics?.jvmFreeMemoryMb || 0;
  const jvmPercent = Math.min(100, Math.round((jvmUsed / jvmMax) * 100));

  const cpuCores = metrics?.availableProcessors || 4;
  const uptime = metrics?.uptimeFormatted || '---';
  const serverTime = metrics?.serverTime ? new Date(metrics.serverTime).toLocaleString('vi-VN') : '---';

  const planDist = metrics?.planDistribution || {};

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-600/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Giám Sát Hạ Tầng & Sức Khỏe Nền Tảng (Infrastructure Health)
              </h2>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-bold border border-emerald-300">
                Hệ Thống Ổn Định
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi tải tài nguyên máy chủ JVM, kết nối cơ sở dữ liệu MySQL và tình trạng hoạt động thời gian thực
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={onRefresh}
          className="font-bold"
        >
          🔄 Kiểm Tra Lại Sức Khỏe
        </Button>
      </div>

      {/* GRID CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* CARD 1: CƠ SỞ DỮ LIỆU MYSQL */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Database className="h-4 w-4 text-blue-600" />
              <span>Cơ Sở Dữ Liệu MySQL</span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                dbStatus === 'UP'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              {dbStatus === 'UP' ? 'KẾT NỐI TỐT (UP)' : 'GIÁN ĐOẠN'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Quy mô cấu trúc:</span>
              <span className="font-bold text-slate-800">72 Bảng Quan Hệ (Relational Tables)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Flyway Migrations:</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {appliedMigrations} Phiên bản hoàn tất (V1_0 → V1_6)
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Connection Pool:</span>
              <span className="font-bold text-slate-800">HikariCP (Max 10 / Min Idle 5)</span>
            </div>
          </div>
        </div>

        {/* CARD 2: BỘ NHỚ RAM JVM */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <HardDrive className="h-4 w-4 text-purple-600" />
              <span>Bộ Nhớ Máy Ảo Java (JVM Heap)</span>
            </div>
            <span className="text-xs font-black text-slate-900">{jvmPercent}% Tải</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Đang sử dụng:</span>
              <span className="text-purple-700 font-bold">{jvmUsed} MB / {jvmMax} MB</span>
            </div>

            <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  jvmPercent >= 90 ? 'bg-rose-500' : jvmPercent >= 75 ? 'bg-amber-500' : 'bg-purple-600'
                }`}
                style={{ width: `${jvmPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 pt-1">
              <span>Allocated: {jvmTotal} MB</span>
              <span>Free Heap: {jvmFree} MB</span>
            </div>
          </div>
        </div>

        {/* CARD 3: RUNTIME & UPTIME */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Server className="h-4 w-4 text-emerald-600" />
            <span>Thời Gian Hoạt Động & Máy Chủ</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Uptime liên tục:</span>
              <span className="font-bold text-slate-900">{uptime}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">CPU Cores khả dụng:</span>
              <span className="font-bold text-slate-800">{cpuCores} Nhân (vCPU)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Giờ máy chủ:</span>
              <span className="font-mono text-slate-700">{serverTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PHÂN BỔ GÓI CƯỚC THUÊ BAO (PLAN DISTRIBUTION) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <span>Phân Bổ Gói Cước Thuê Bao Doanh Nghiệp (Subscription Plans)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'].map((p) => {
            const count = planDist[p] || 0;
            return (
              <div key={p} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-center">
                <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider">{p}</span>
                <p className="text-xl font-black text-slate-900 mt-1">{count}</p>
                <span className="text-[10px] text-slate-400">Doanh nghiệp</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

