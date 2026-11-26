import React, { useState, useEffect } from 'react';
import {
  Activity,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Baby,
  HeartHandshake,
  Tag,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';
import { useActiveBranchStore } from '@/store/useActiveBranchStore';
import { addonsService } from '@/services/modules/addonsService';
import { toast } from '@/store/useToastStore';

const STATUS_LABELS = {
  HEIFER: { label: 'Hậu bị', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  MATING: { label: 'Đang phối', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  PREGNANT: { label: 'Mang thai', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  LACTATING: { label: 'Nuôi con', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

export function BreedingLivestockPage() {
  const { currentFarmId } = useActiveFarmStore();
  const { currentBranchId } = useActiveBranchStore();

  const [summary, setSummary] = useState({
    totalSows: 0,
    pregnantCount: 0,
    lactatingCount: 0,
    heiferCount: 0,
    matingCount: 0,
    avgBornAlive: 12.5,
  });
  const [animals, setAnimals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modal Thêm / Sửa cá thể
  const [isAnimalModalOpen, setIsAnimalModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [animalForm, setAnimalForm] = useState({
    tagCode: '',
    breedName: 'Heo nái Landrace ngoại thuần',
    parity: 1,
    reproductiveStatus: 'PREGNANT',
    matingDate: '',
    barnName: 'Chuồng Nái Đẻ A1',
    notes: '',
  });

  // Modal Ghi nhận Phối giống & Đẻ
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [targetAnimal, setTargetAnimal] = useState(null);
  const [eventForm, setEventForm] = useState({
    eventType: 'MATING', // MATING, BIRTH, WEANING
    eventDate: new Date().toISOString().split('T')[0],
    bornAliveCount: 12,
    weanedCount: 12,
    notes: '',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [sumRes, listRes] = await Promise.all([
        addonsService.getBreedingSummary({
          farmId: currentFarmId,
          branchId: currentBranchId !== 'ALL' ? currentBranchId : undefined,
        }),
        addonsService.getBreedingAnimals({
          farmId: currentFarmId,
          branchId: currentBranchId !== 'ALL' ? currentBranchId : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          keyword: keyword.trim() || undefined,
        }),
      ]);
      if (sumRes) setSummary(sumRes);
      if (Array.isArray(listRes)) setAnimals(listRes);
    } catch (err) {
      console.warn('Could not load breeding data', err);
      toast.error('Lỗi tải dữ liệu đàn nái sinh sản');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentFarmId, currentBranchId, statusFilter]);

  const handleOpenCreateAnimal = () => {
    setEditingAnimal(null);
    setAnimalForm({
      tagCode: `NAI-${String(animals.length + 1).padStart(3, '0')}`,
      breedName: 'Heo nái Landrace thuần ngoại',
      parity: 1,
      reproductiveStatus: 'HEIFER',
      matingDate: '',
      barnName: 'Chuồng Hậu Bị B1',
      notes: '',
    });
    setIsAnimalModalOpen(true);
  };

  const handleOpenEditAnimal = (a) => {
    setEditingAnimal(a);
    setAnimalForm({
      tagCode: a.tagCode,
      breedName: a.breedName,
      parity: a.parity,
      reproductiveStatus: a.reproductiveStatus,
      matingDate: a.matingDate || '',
      barnName: a.barnName || '',
      notes: a.notes || '',
    });
    setIsAnimalModalOpen(true);
  };

  const handleSaveAnimal = async (e) => {
    e.preventDefault();
    if (!animalForm.tagCode.trim()) {
      toast.error('Vui lòng nhập số thẻ tai');
      return;
    }
    try {
      if (editingAnimal) {
        await addonsService.updateBreedingAnimal(
          editingAnimal.id,
          {
            ...animalForm,
            branchId: currentBranchId !== 'ALL' ? currentBranchId : undefined,
          },
          { farmId: currentFarmId }
        );
        toast.success(`Đã cập nhật cá thể "${animalForm.tagCode}"!`);
      } else {
        await addonsService.createBreedingAnimal(
          {
            ...animalForm,
            branchId: currentBranchId !== 'ALL' ? currentBranchId : undefined,
          },
          { farmId: currentFarmId }
        );
        toast.success(`Đã thêm mới cá thể thẻ tai "${animalForm.tagCode}"!`);
      }
      setIsAnimalModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu cá thể');
    }
  };

  const handleOpenRecordEvent = (a) => {
    setTargetAnimal(a);
    const nextType = a.reproductiveStatus === 'PREGNANT' ? 'BIRTH' : 'MATING';
    setEventForm({
      eventType: nextType,
      eventDate: new Date().toISOString().split('T')[0],
      bornAliveCount: 12,
      weanedCount: 12,
      notes: '',
    });
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!targetAnimal) return;
    try {
      await addonsService.recordBreedingEvent(
        targetAnimal.id,
        {
          eventType: eventForm.eventType,
          eventDate: eventForm.eventDate,
          bornAliveCount: Number(eventForm.bornAliveCount),
          weanedCount: Number(eventForm.weanedCount),
          notes: eventForm.notes,
        },
        { farmId: currentFarmId }
      );
      toast.success(
        `Đã ghi nhận sự kiện ${
          eventForm.eventType === 'MATING' ? 'Phối giống (+114 ngày dự sinh)' : 'Đẻ con thành công'
        } cho nái "${targetAnimal.tagCode}"!`
      );
      setIsEventModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi ghi nhận sự kiện');
    }
  };

  const handleDeleteAnimal = async (a) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cá thể "${a.tagCode}"?`)) return;
    try {
      await addonsService.deleteBreedingAnimal(a.id, { farmId: currentFarmId });
      toast.success(`Đã xóa cá thể "${a.tagCode}"!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa cá thể');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-pink-50 text-pink-700">
            <Activity className="h-6 w-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Quản Lý Gia Súc Sinh Sản (Thẻ Tai)
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-pink-100 text-pink-800 uppercase">
                Add-on Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi chu kỳ sinh sản từng heo nái/bò theo mã thẻ tai RFID, tự động tính ngày dự kiến đẻ (+114 ngày)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            icon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
            className="text-xs font-bold"
          >
            Làm mới
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateAnimal}
            icon={<Plus className="h-4 w-4" />}
            className="text-xs font-bold bg-pink-700 hover:bg-pink-800 text-white shadow-sm"
          >
            + Thêm Cá Thể Nái Mới
          </Button>
        </div>
      </div>

      {/* 2. Thẻ KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Tổng đàn nái đang nuôi</span>
            <Tag className="h-4 w-4 text-pink-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{summary.totalSows} con</div>
          <div className="text-[11px] text-slate-400">Gồm nái sinh sản & hậu bị</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Đang mang thai</span>
            <Baby className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700">{summary.pregnantCount} con</div>
          <div className="text-[11px] text-blue-600 font-semibold">Chuẩn bị chuồng nái đẻ</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Đang nuôi con</span>
            <HeartHandshake className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{summary.lactatingCount} con</div>
          <div className="text-[11px] text-emerald-600 font-semibold">Theo dõi ngày cai sữa</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Tỷ lệ đẻ bình quân</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {summary.avgBornAlive} con/lứa
          </div>
          <div className="text-[11px] text-slate-500">Con sơ sinh còn sống</div>
        </div>
      </div>

      {/* 3. Bảng Danh sách Cá thể */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Thanh tìm kiếm & lọc */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Số thẻ tai, Tên giống..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              className="bg-transparent border-none outline-none w-full text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="font-semibold text-slate-600">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="HEIFER">Hậu bị</option>
              <option value="MATING">Đang phối</option>
              <option value="PREGNANT">Mang thai</option>
              <option value="LACTATING">Nuôi con</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-700 font-bold">
                <th className="py-3 px-4">Số thẻ tai</th>
                <th className="py-3 px-4">Tên giống & Chuồng</th>
                <th className="py-3 px-4 text-center">Lứa đẻ thứ</th>
                <th className="py-3 px-4 text-center">Trạng thái sinh sản</th>
                <th className="py-3 px-4">Ngày phối giống</th>
                <th className="py-3 px-4">Ngày dự kiến đẻ</th>
                <th className="py-3 px-4 text-center">Con sống / Cai sữa</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {animals.map((a) => {
                const badge = STATUS_LABELS[a.reproductiveStatus] || STATUS_LABELS.PREGNANT;
                return (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-black text-slate-900 font-mono text-sm flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-pink-600" />
                        <span>{a.tagCode}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{a.notes || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{a.breedName}</div>
                      <div className="text-[11px] text-slate-500">{a.barnName || 'Chưa gán chuồng'}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      Lứa #{a.parity}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {a.matingDate || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {a.expectedBirthDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-blue-500" />
                          <span>{a.expectedBirthDate}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="font-bold text-emerald-700">{a.bornAliveCount || 0} con</span>
                      {a.weanedCount > 0 && <span className="text-slate-400"> (Cai sữa: {a.weanedCount})</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenRecordEvent(a)}
                          className="px-2 py-1 rounded bg-pink-50 text-pink-700 hover:bg-pink-100 font-bold text-[11px] transition-colors"
                        >
                          Ghi Nhận Sự Kiện
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditAnimal(a)}
                          aria-label={`Sửa cá thể ${a.tagCode}`}
                          title="Sửa thông tin cá thể"
                          className="p-1 rounded text-slate-400 hover:text-slate-700"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAnimal(a)}
                          aria-label={`Xóa cá thể ${a.tagCode}`}
                          title="Xóa cá thể"
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {animals.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Chưa có cá thể gia súc sinh sản nào được ghi nhận.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: THÊM / SỬA CÁ THỂ */}
      <Modal
        isOpen={isAnimalModalOpen}
        onClose={() => setIsAnimalModalOpen(false)}
        title={editingAnimal ? `Sửa Cá Thể: ${editingAnimal.tagCode}` : 'Thêm Mới Cá Thể Nái / Bò Sinh Sản'}
        size="md"
      >
        <form onSubmit={handleSaveAnimal} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Số thẻ tai (RFID) *" required>
              <Input
                value={animalForm.tagCode}
                onChange={(e) => setAnimalForm({ ...animalForm, tagCode: e.target.value })}
                placeholder="VD: NAI-001"
              />
            </FormField>
            <FormField label="Giống vật nuôi *" required>
              <Input
                value={animalForm.breedName}
                onChange={(e) => setAnimalForm({ ...animalForm, breedName: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Lứa đẻ thứ">
              <Input
                type="number"
                value={animalForm.parity}
                onChange={(e) => setAnimalForm({ ...animalForm, parity: Number(e.target.value) })}
              />
            </FormField>
            <FormField label="Trạng thái sinh sản">
              <Select
                value={animalForm.reproductiveStatus}
                onChange={(e) => setAnimalForm({ ...animalForm, reproductiveStatus: e.target.value })}
                options={[
                  { value: 'HEIFER', label: 'Hậu bị' },
                  { value: 'MATING', label: 'Đang phối' },
                  { value: 'PREGNANT', label: 'Mang thai (+114 ngày dự kiến đẻ)' },
                  { value: 'LACTATING', label: 'Nuôi con' },
                ]}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Ngày phối giống (nếu có)" hint="Tự động tính ngày đẻ">
              <Input
                type="date"
                value={animalForm.matingDate}
                onChange={(e) => setAnimalForm({ ...animalForm, matingDate: e.target.value })}
              />
            </FormField>
            <FormField label="Vị trí chuồng nuôi">
              <Input
                value={animalForm.barnName}
                onChange={(e) => setAnimalForm({ ...animalForm, barnName: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Ghi chú theo dõi">
            <Input
              value={animalForm.notes}
              onChange={(e) => setAnimalForm({ ...animalForm, notes: e.target.value })}
              placeholder="VD: Nguồn gốc heo cụ kỵ nhập ngoại, phối tinh Duroc..."
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAnimalModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold bg-pink-700 hover:bg-pink-800 text-white">
              {editingAnimal ? 'Lưu Thay Đổi' : 'Tạo Cá Thể'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: GHI NHẬN SỰ KIỆN PHỐI GIỐNG / ĐẺ / CAI SỮA */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={`Ghi Nhận Sự Kiện Sinh Sản: ${targetAnimal?.tagCode || ''}`}
        size="md"
      >
        <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
          <FormField label="Loại sự kiện sinh sản *" required>
            <Select
              value={eventForm.eventType}
              onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
              options={[
                { value: 'MATING', label: '1. Phối giống (Tự động tính ngày dự kiến đẻ +114 ngày)' },
                { value: 'BIRTH', label: '2. Đẻ con (Ghi nhận số lượng con sơ sinh sống, chuyển nuôi con)' },
                { value: 'WEANING', label: '3. Cai sữa heo con (Sẵn sàng cho chu kỳ phối tiếp theo)' },
              ]}
            />
          </FormField>

          <FormField label="Ngày diễn ra sự kiện *" required>
            <Input
              type="date"
              value={eventForm.eventDate}
              onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
            />
          </FormField>

          {eventForm.eventType === 'BIRTH' && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Số con sống đạt chuẩn *" required>
                <Input
                  type="number"
                  value={eventForm.bornAliveCount}
                  onChange={(e) => setEventForm({ ...eventForm, bornAliveCount: e.target.value })}
                />
              </FormField>
              <FormField label="Dự kiến cai sữa (con)">
                <Input
                  type="number"
                  value={eventForm.weanedCount}
                  onChange={(e) => setEventForm({ ...eventForm, weanedCount: e.target.value })}
                />
              </FormField>
            </div>
          )}

          <FormField label="Ghi chú kỹ thuật">
            <textarea
              rows={2}
              value={eventForm.notes}
              onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
              placeholder="VD: Mã liều tinh phối Duroc D09, thể trạng nái tốt..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-1 focus:ring-pink-500"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEventModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold bg-pink-700 hover:bg-pink-800 text-white">
              Xác Nhận Sự Kiện
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default BreedingLivestockPage;
