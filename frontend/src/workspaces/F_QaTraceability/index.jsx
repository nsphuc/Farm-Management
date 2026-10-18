import React, { useState } from 'react';
import { ShieldCheck, Printer, AlertOctagon, CheckCircle2, Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import { Can } from '@/components/common/Can';
import { formatWeight, formatDate } from '@/utils/formatters';

const KANBAN_COLUMNS = [
  { id: 'PENDING_APPROVAL', title: 'Chờ Duyệt KCS', color: 'border-amber-400 bg-amber-50/50' },
  { id: 'READY_TO_PRINT', title: 'Sẵn Sàng In Tem', color: 'border-blue-400 bg-blue-50/50' },
  { id: 'PRINTED', title: 'Đã In Tem Nhãn', color: 'border-indigo-400 bg-indigo-50/50' },
  { id: 'SELLING', title: 'Đang Xuất Bán', color: 'border-emerald-400 bg-emerald-50/50' },
  { id: 'REJECTED', title: 'Từ Chối KCS', color: 'border-slate-400 bg-slate-50/50' },
  { id: 'RECALLED', title: 'Thu Hồi Khẩn Cấp', color: 'border-rose-400 bg-rose-50/50' },
];

/**
 * Workspace F: Đường Ống Quản Trị Chất Lượng & Truy Xuất Nguồn Gốc (Điều 2.6 File 08)
 * Kanban 6 cột khớp 100% trạng thái SQL product_batches.status (#44)
 */
export function QaTraceabilityWorkspace() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 ring-1 ring-teal-200">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Đường Ống Quản Trị Chất Lượng & Truy Xuất Nguồn Gốc
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kanban 6 cột kiểm định KCS, đóng băng bản chụp JSON SHA-256 và in tem nhãn nhiệt ESC/POS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Can permission="PERM_LABEL_PRINT">
            <Button variant="outline" size="sm" icon={Printer}>
              In Tem Hàng Loạt
            </Button>
          </Can>
        </div>
      </div>

      {/* Visual Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {KANBAN_COLUMNS.map((col) => {
          const colBatches = batches.filter((b) => b.status === col.id);

          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-2xl border-t-4 bg-white p-3 shadow-xs min-h-[450px] ${col.color}`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-800">{col.title}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {colBatches.length}
                </span>
              </div>

              <div className="flex-1 py-3 space-y-2.5 overflow-y-auto">
                {colBatches.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-400">
                    Không có lô hàng
                  </div>
                ) : (
                  colBatches.map((batch) => (
                    <div
                      key={batch.id}
                      onClick={() => {
                        setSelectedBatch(batch);
                        setIsDrawerOpen(true);
                      }}
                      className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-emerald-500 cursor-pointer transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 font-mono">
                          {batch.batchCode}
                        </span>
                        <StatusBadge status={batch.qualityGrade} size="sm" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        {batch.productName}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>SL: {formatWeight(batch.remainingQuantity)}</span>
                        <span>{formatDate(batch.harvestDate)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <SlideOverDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedBatch ? `Lô: ${selectedBatch.batchCode}` : 'Chi Tiết Lô Thành Phẩm'}
        subtitle="Hồ sơ KCS 360°, bản chụp JSON đóng băng và mã QR công khai"
      >
        <div className="p-4 text-xs text-slate-600">
          Chi tiết kết quả kiểm định chất lượng KCS, bảng nguồn gốc phối trộn và bản chụp bất biến.
        </div>
      </SlideOverDrawer>
    </div>
  );
}

export default QaTraceabilityWorkspace;
