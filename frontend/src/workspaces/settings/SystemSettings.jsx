import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings, Calendar, Sliders, Shield } from 'lucide-react';
import OperationalCyclePage from '../../pages/organization/cycles/OperationalCyclePage';

/**
 * Cấu hình & Hệ thống (Menu 8 - RULE-UI-001).
 * Hợp nhất Chu kỳ Vận hành (1.5) và Thiết lập chung của Trang trại & Tenant.
 */
export const SystemSettings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'cycles';

  const [activeTab, setActiveTab] = useState(currentTab);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const tabs = [
    {
      id: 'cycles',
      label: '1.5. Chu Kỳ Vận Hành',
      icon: Calendar,
      badge: 'Mùa vụ & Tài chính',
    },
    {
      id: 'general',
      label: 'Cài Đặt Hệ Thống',
      icon: Sliders,
      badge: 'Chung',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Settings Navigation Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                MENU 8
              </span>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">
                Cấu Hình & Quản Trị Hệ Thống
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Thiết lập chu kỳ vận hành mùa vụ (1.5), niên độ tài chính và thông số hệ thống
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="transition-all duration-200">
        {activeTab === 'cycles' && <OperationalCyclePage />}
        {activeTab === 'general' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Cài Đặt Hệ Thống Nâng Cao</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Cấu hình các tham số vận hành, múi giờ, định dạng tiền tệ và chính sách an ninh tổ chức.
            </p>
            <div className="pt-2">
              <button
                onClick={() => handleTabChange('cycles')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
              >
                Chuyển sang Quản lý Chu kỳ Vận hành (1.5)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;
