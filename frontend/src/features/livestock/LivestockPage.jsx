import React, { useState, useEffect } from 'react';
import { 
  Beef, 
  Tag, 
  Layers, 
  Search, 
  Filter, 
  Plus, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  RefreshCw, 
  MoreVertical,
  Calendar,
  Scale,
  Eye,
  Syringe,
  ChevronRight,
  Sparkles,
  Users
} from 'lucide-react';
import { useFarmStore } from '../../stores/useFarmStore';
import { livestockService } from '../../services/livestockService';
import { CreateGroupModal } from './CreateGroupModal';
import { CreateIndividualModal } from './CreateIndividualModal';
import { LivestockEventModal } from './LivestockEventModal';
import { IndividualDetailDrawer } from './IndividualDetailDrawer';
import { toast } from 'sonner';

export const LivestockPage = () => {
  const { currentFarm } = useFarmStore();
  const farmId = currentFarm?.id;

  const [activeTab, setActiveTab] = useState('INDIVIDUALS'); // 'INDIVIDUALS' or 'GROUPS'
  const [loading, setLoading] = useState(false);

  // Data states
  const [individuals, setIndividuals] = useState([]);
  const [groups, setGroups] = useState([]);
  const [breeds, setBreeds] = useState([]);

  // Search & Filter
  const [rfidSearch, setRfidSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [breedFilter, setBreedFilter] = useState('');
  const [groupSearch, setGroupSearch] = useState('');

  // Modals & Drawer states
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);
  const [selectedIndividualId, setSelectedIndividualId] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  
  // Event Modal state
  const [eventModalData, setEventModalData] = useState({
    isOpen: false,
    targetType: 'INDIVIDUAL',
    targetId: null,
    targetLabel: ''
  });

  useEffect(() => {
    if (farmId) {
      loadBreeds();
      loadData();
    }
  }, [farmId, activeTab]);

  const loadBreeds = async () => {
    try {
      const data = await livestockService.getBreeds();
      const list = data?.items || (Array.isArray(data) ? data : []);
      setBreeds(list);
    } catch (err) {
      console.error('Lỗi tải danh mục giống:', err);
      setBreeds([]);
    }
  };

  const loadData = async () => {
    if (!farmId) return;
    try {
      setLoading(true);
      if (activeTab === 'INDIVIDUALS') {
        const indData = await livestockService.getIndividuals(farmId);
        const list = indData?.items || (Array.isArray(indData) ? indData : []);
        setIndividuals(list);
      } else {
        const grpData = await livestockService.getGroups(farmId);
        const list = grpData?.items || (Array.isArray(grpData) ? grpData : []);
        setGroups(list);
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải dữ liệu chăn nuôi');
    } finally {
      setLoading(false);
    }
  };

  // Safe arrays
  const safeIndividuals = Array.isArray(individuals) ? individuals : [];
  const safeGroups = Array.isArray(groups) ? groups : [];

  // KPIs
  const totalIndividuals = safeIndividuals.length;
  const activeIndividuals = safeIndividuals.filter(i => i.status === 'DANG_NUOI').length;
  const healthyIndividuals = safeIndividuals.filter(i => i.healthStatus === 'KHOE_MANH').length;
  const sickIndividuals = safeIndividuals.filter(i => i.healthStatus === 'BENH' || i.healthStatus === 'CACH_LY' || i.healthStatus === 'DIEU_TRI').length;
  const totalGroups = safeGroups.length;

  // Filtered individuals
  const filteredIndividuals = safeIndividuals.filter((item) => {
    const matchRfid = rfidSearch ? item.rfidTagCode?.toLowerCase().includes(rfidSearch.toLowerCase()) : true;
    const matchHealth = healthFilter ? item.healthStatus === healthFilter : true;
    const matchBreed = breedFilter ? item.breedId === Number(breedFilter) : true;
    return matchRfid && matchHealth && matchBreed;
  });

  // Filtered groups
  const filteredGroups = safeGroups.filter((g) => {
    const matchSearch = groupSearch 
      ? g.name?.toLowerCase().includes(groupSearch.toLowerCase()) || g.groupCode?.toLowerCase().includes(groupSearch.toLowerCase())
      : true;
    const matchBreed = breedFilter ? g.breedId === Number(breedFilter) : true;
    return matchSearch && matchBreed;
  });

  const handleOpenDetail = (indId) => {
    setSelectedIndividualId(indId);
    setIsDetailDrawerOpen(true);
  };

  const handleOpenEventModalForIndividual = (ind) => {
    setEventModalData({
      isOpen: true,
      targetType: 'INDIVIDUAL',
      targetId: ind.id,
      targetLabel: `${ind.rfidTagCode} (${ind.breedName || ind.species || 'Vật nuôi'})`
    });
  };

  const handleOpenEventModalForGroup = (grp) => {
    setEventModalData({
      isOpen: true,
      targetType: 'GROUP',
      targetId: grp.id,
      targetLabel: `${grp.name} (${grp.groupCode})`
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Beef className="w-7 h-7 text-emerald-600" />
            Quản lý Chăn nuôi & Lập chỉ mục RFID
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi cá thể có thẻ tai thông minh RFID, quản lý bầy đàn và lịch sử tiêm phòng VietGAHP
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'INDIVIDUALS' ? (
            <button
              onClick={() => setIsIndividualModalOpen(true)}
              className="min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 hover:shadow-lg transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Đăng ký Cá thể RFID
            </button>
          ) : (
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 hover:shadow-lg transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Khởi tạo Bầy đàn mới
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng cá thể RFID</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{totalIndividuals}</h3>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Khỏe mạnh</p>
            <h3 className="text-xl font-bold text-blue-600 mt-0.5">{healthyIndividuals}</h3>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Điều trị / Cách ly</p>
            <h3 className="text-xl font-bold text-rose-600 mt-0.5">{sickIndividuals}</h3>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng Đàn / Bầy</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{totalGroups}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-4">
        <button
          onClick={() => setActiveTab('INDIVIDUALS')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'INDIVIDUALS'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Tag className="w-4 h-4" />
          Cá thể Thẻ tai RFID ({totalIndividuals})
        </button>
        <button
          onClick={() => setActiveTab('GROUPS')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'GROUPS'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Quản lý Bầy đàn ({totalGroups})
        </button>
      </div>

      {/* Main Tab 1: Individuals */}
      {activeTab === 'INDIVIDUALS' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Quét hoặc tìm nhanh mã thẻ tai RFID (VD: BO-2026-00001)..."
                value={rfidSearch}
                onChange={(e) => setRfidSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Tất cả sức khỏe</option>
                <option value="KHOE_MANH">Khỏe mạnh</option>
                <option value="BENH">Bị bệnh</option>
                <option value="DIEU_TRI">Đang điều trị</option>
                <option value="CACH_LY">Cách ly y tế</option>
              </select>

              <select
                value={breedFilter}
                onChange={(e) => setBreedFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Tất cả giống loài</option>
                {breeds.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.species})
                  </option>
                ))}
              </select>

              <button
                onClick={loadData}
                className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl border border-slate-200 transition"
                title="Làm mới"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Mã Thẻ Tai RFID</th>
                    <th className="px-5 py-3.5">Giống / Loài</th>
                    <th className="px-5 py-3.5">Giới tính</th>
                    <th className="px-5 py-3.5">Trọng lượng (kg)</th>
                    <th className="px-5 py-3.5">Tình trạng Sức khỏe</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        Đang tải danh sách cá thể...
                      </td>
                    </tr>
                  ) : filteredIndividuals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        Không tìm thấy cá thể nào phù hợp với điều kiện tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredIndividuals.map((ind) => {
                      const isSick = ind.healthStatus === 'BENH' || ind.healthStatus === 'CACH_LY' || ind.healthStatus === 'DIEU_TRI';
                      return (
                        <tr key={ind.id} className="hover:bg-slate-50/80 transition group">
                          <td className="px-5 py-3.5 font-medium">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                                {ind.rfidTagCode}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            {ind.breedName || ind.species || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                            {ind.gender === 'DUC' ? '♂ Đực' : ind.gender === 'CAI' ? '♀ Cái' : '—'}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-800">
                            {ind.weightKg ? `${ind.weightKg} kg` : '—'}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                ind.healthStatus === 'KHOE_MANH'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isSick
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              {ind.healthStatus === 'KHOE_MANH' ? (
                                <ShieldCheck className="w-3.5 h-3.5" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5" />
                              )}
                              {ind.healthStatus === 'KHOE_MANH'
                                ? 'Khỏe mạnh'
                                : ind.healthStatus === 'DIEU_TRI'
                                ? 'Đang điều trị'
                                : ind.healthStatus === 'CACH_LY'
                                ? 'Cách ly y tế'
                                : ind.healthStatus === 'BENH'
                                ? 'Bị bệnh'
                                : ind.healthStatus}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs font-medium text-slate-600">
                            {ind.status === 'DANG_NUOI' ? 'Đang nuôi' : ind.status}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEventModalForIndividual(ind)}
                                title="Ghi sự kiện / Tiêm phòng / Cân đo"
                                className="min-h-[40px] px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                              >
                                <Syringe className="w-3.5 h-3.5" /> Sự kiện
                              </button>
                              <button
                                onClick={() => handleOpenDetail(ind.id)}
                                title="Xem lý lịch cá thể"
                                className="min-h-[40px] px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" /> Lý lịch
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 2: Groups */}
      {activeTab === 'GROUPS' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên bầy đàn hoặc mã đàn..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={breedFilter}
                onChange={(e) => setBreedFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Tất cả giống loài</option>
                {breeds.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.species})
                  </option>
                ))}
              </select>

              <button
                onClick={loadData}
                className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl border border-slate-200 transition"
                title="Làm mới"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Groups Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Mã Đàn</th>
                    <th className="px-5 py-3.5">Tên Đàn / Bầy</th>
                    <th className="px-5 py-3.5">Giống loài</th>
                    <th className="px-5 py-3.5">Số lượng hiện tại</th>
                    <th className="px-5 py-3.5">Ngày nhập đàn</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        Đang tải danh sách bầy đàn...
                      </td>
                    </tr>
                  ) : filteredGroups.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        Chưa có bầy đàn nào được tạo.
                      </td>
                    </tr>
                  ) : (
                    filteredGroups.map((grp) => (
                      <tr key={grp.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3.5 font-mono font-bold text-xs text-slate-800">
                          {grp.groupCode}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {grp.name}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-700">
                          {grp.breedName || '—'}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-emerald-700">
                          {grp.currentQuantity} con
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">
                          {grp.entryDate ? new Date(grp.entryDate).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              grp.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {grp.status === 'ACTIVE' ? 'Đang nuôi' : grp.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenEventModalForGroup(grp)}
                            className="min-h-[40px] px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
                          >
                            <Syringe className="w-3.5 h-3.5" /> Ghi sự kiện đàn
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Drawer */}
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        farmId={farmId}
        onSuccess={loadData}
      />

      <CreateIndividualModal
        isOpen={isIndividualModalOpen}
        onClose={() => setIsIndividualModalOpen(false)}
        farmId={farmId}
        onSuccess={loadData}
      />

      <IndividualDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        individualId={selectedIndividualId}
        farmId={farmId}
        onOpenEventModal={(ind) => handleOpenEventModalForIndividual(ind)}
        onIndividualUpdated={loadData}
      />

      <LivestockEventModal
        isOpen={eventModalData.isOpen}
        onClose={() => setEventModalData(prev => ({ ...prev, isOpen: false }))}
        farmId={farmId}
        targetType={eventModalData.targetType}
        targetId={eventModalData.targetId}
        targetLabel={eventModalData.targetLabel}
        onSuccess={() => {
          loadData();
          if (isDetailDrawerOpen) {
            // Trigger refresh drawer if open
            setSelectedIndividualId((prev) => prev);
          }
        }}
      />
    </div>
  );
};
export default LivestockPage;
