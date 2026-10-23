import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MasterGeographicTree } from './workspaces/A_Geography/components/MasterGeographicTree';
import { ZoneFormModal } from './workspaces/A_Geography/components/ZoneFormModal';
import { LocationFormModal } from './workspaces/A_Geography/components/LocationFormModal';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveFarmStore } from '@/store/useActiveFarmStore';

vi.mock('@/services/modules/geographyService', () => ({
  geographyService: {
    getFarms: vi.fn().mockResolvedValue([]),
    getZones: vi.fn().mockResolvedValue([]),
    getLocations: vi.fn().mockResolvedValue([]),
    createZone: vi.fn().mockResolvedValue({ id: 101, code: 'ZON-2610-0001', name: 'Khu Nhà Kính A' }),
    updateZone: vi.fn().mockResolvedValue({ id: 101 }),
    createLocation: vi.fn().mockResolvedValue({ id: 201, code: 'LOC-PLOT-2610-0001', name: 'Luống 01' }),
    updateLocation: vi.fn().mockResolvedValue({ id: 201 }),
  },
}));

describe('Workspace A Geography UX/UI & Contextual Flow Standards', () => {
  const mockFarms = [
    {
      id: 1,
      name: 'Trang Trại Trồng Trọt Đà Lạt',
      code: 'FRM-DL-001',
      farmType: 'CROP',
      totalAreaM2: 50000,
      status: 'ACTIVE',
      zones: [
        {
          id: 11,
          farmId: 1,
          name: 'Nhà Kính Dưa Lưới A1',
          code: 'ZON-DL-001',
          zoneType: 'GREENHOUSE',
          areaM2: 10000,
          status: 'ACTIVE',
          locations: [
            { id: 111, zoneId: 11, name: 'Luống Cà Chua 01', code: 'LOC-PLOT-001', status: 'ACTIVE' },
          ],
        },
      ],
    },
    {
      id: 2,
      name: 'Trang Trại Chăn Nuôi Ba Vì',
      code: 'FRM-BV-002',
      farmType: 'LIVESTOCK',
      totalAreaM2: 80000,
      status: 'ACTIVE',
      zones: [
        {
          id: 21,
          farmId: 2,
          name: 'Khu Chuồng Bò Sữa B1',
          code: 'ZON-BV-001',
          zoneType: 'BARN',
          areaM2: 15000,
          status: 'ACTIVE',
          locations: [
            { id: 211, zoneId: 21, name: 'Ô Chuồng Số 01', code: 'LOC-BARN-001', status: 'OCCUPIED' },
          ],
        },
      ],
    },
    {
      id: 3,
      name: 'Trang Trại Mới Chưa Có Khu',
      code: 'FRM-EMPTY-003',
      farmType: 'MIXED',
      totalAreaM2: 30000,
      status: 'ACTIVE',
      zones: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      accessToken: 'mock-token',
      isAuthenticated: true,
      userInfo: {
        id: 1,
        username: 'owner@farm.vn',
        fullName: 'Chủ Trang Trại Test',
        scopeLevel: 'TENANT',
        roles: [{ code: 'ROLE_FARM_OWNER' }],
        permissions: ['PERM_FARM_VIEW', 'PERM_ZONE_MANAGE', 'PERM_FARM_CREATE', 'PERM_FARM_UPDATE'],
      },
    });

    useActiveFarmStore.setState({
      activeFarmId: 'ALL',
      farms: mockFarms,
    });
  });

  // 1. Kiểm tra Cây địa lý (MasterGeographicTree) hiển thị các nút thao tác inline nhanh
  it('1. MasterGeographicTree render đầy đủ các nút inline nhanh [+ Khu] trên Farm và [+ Vị trí], [Sửa] trên Zone', () => {
    const handleAddZone = vi.fn();
    const handleAddLocation = vi.fn();
    const handleEditZone = vi.fn();

    render(
      <MasterGeographicTree
        farms={mockFarms}
        selectedNode={null}
        onSelectNode={vi.fn()}
        onAddZone={handleAddZone}
        onAddLocation={handleAddLocation}
        onEditZone={handleEditZone}
      />
    );

    // Kiểm tra tên trang trại và phân khu xuất hiện
    expect(screen.getByText('Trang Trại Trồng Trọt Đà Lạt')).toBeInTheDocument();
    expect(screen.getByText('Trang Trại Chăn Nuôi Ba Vì')).toBeInTheDocument();

    // Nút inline [+ Khu] trên Farm Node
    const addZoneBtns = screen.getAllByTitle('Thêm phân khu vào trang trại này');
    expect(addZoneBtns.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(addZoneBtns[0]);
    expect(handleAddZone).toHaveBeenCalledWith(mockFarms[0]);

    // Nút inline [+ Vị trí] trên Zone Node
    const addPlotBtn = screen.getByTitle('Thêm luống / ô đất vào phân khu này');
    expect(addPlotBtn).toBeInTheDocument();
    fireEvent.click(addPlotBtn);
    expect(handleAddLocation).toHaveBeenCalledWith(mockFarms[0], mockFarms[0].zones[0]);

    // Nút inline [Sửa] trên Zone Node
    const editZoneBtns = screen.getAllByTitle('Sửa thông số phân khu');
    expect(editZoneBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(editZoneBtns[0]);
    expect(handleEditZone).toHaveBeenCalledWith(mockFarms[0], mockFarms[0].zones[0]);
  });

  // 2. Kiểm tra ZoneFormModal: Lọc zoneType thông minh theo loại hình trang trại (CROP vs LIVESTOCK)
  it('2. ZoneFormModal tự động lọc loại phân khu theo loại hình trang trại và tính toán diện tích còn trống', () => {
    // 2.1. Kiểm tra với Farm Trồng trọt (CROP): Không hiển thị BARN
    const { rerender } = render(
      <ZoneFormModal
        isOpen={true}
        onClose={vi.fn()}
        farms={mockFarms}
        initialFarmId={1} // CROP farm
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Trang Trại Trồng Trọt Đà Lạt')).toBeInTheDocument();
    expect(screen.getByText(/🌾 Trại Trồng trọt/i)).toBeInTheDocument();
    // Dropdown không chứa BARN
    expect(screen.queryByText(/BARN - Chuồng Trại Chăn Nuôi/i)).not.toBeInTheDocument();
    expect(screen.getByText(/GREENHOUSE - Nhà Màng/i)).toBeInTheDocument();

    // 2.2. Kiểm tra với Farm Chăn nuôi (LIVESTOCK): Không hiển thị GREENHOUSE
    rerender(
      <ZoneFormModal
        isOpen={true}
        onClose={vi.fn()}
        farms={mockFarms}
        initialFarmId={2} // LIVESTOCK farm
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Trang Trại Chăn Nuôi Ba Vì')).toBeInTheDocument();
    expect(screen.getByText(/🐄 Trại Chăn nuôi/i)).toBeInTheDocument();
    // Dropdown không chứa GREENHOUSE
    expect(screen.queryByText(/GREENHOUSE - Nhà Màng/i)).not.toBeInTheDocument();
    expect(screen.getByText(/BARN - Chuồng Trại Chăn Nuôi/i)).toBeInTheDocument();
  });

  // 3. Kiểm tra LocationFormModal: Thích ứng nhãn theo zoneType và Smart Empty State khi Farm chưa có Zone
  it('3. LocationFormModal tự động đổi nhãn động khi phân khu là BARN ("Ô Chuồng") vs GREENHOUSE ("Luống Đất")', () => {
    // 3.1. Khi chọn phân khu BARN (Chuồng nuôi)
    const { rerender } = render(
      <LocationFormModal
        isOpen={true}
        onClose={vi.fn()}
        farms={mockFarms}
        initialFarmId={2}
        initialZoneId={21} // BARN zone
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Thêm Ô Chuồng / Dãy Chuồng Chăn Nuôi')).toBeInTheDocument();
    expect(screen.getByText('Tên Ô Chuồng / Dãy Chuồng')).toBeInTheDocument();
    expect(screen.getByText('Mô Tả Quy Cách Ô Chuồng')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tạo Ô Chuồng Mới' })).toBeInTheDocument();

    // 3.2. Khi chọn phân khu GREENHOUSE (Nhà màng)
    rerender(
      <LocationFormModal
        isOpen={true}
        onClose={vi.fn()}
        farms={mockFarms}
        initialFarmId={1}
        initialZoneId={11} // GREENHOUSE zone
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Thêm Luống / Lô Đất Canh Tác')).toBeInTheDocument();
    expect(screen.getByText('Tên Luống / Lô Đất Canh Tác')).toBeInTheDocument();
    expect(screen.getByText('Mô Tả Luống / Lô Đất')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tạo Luống / Lô Đất Mới' })).toBeInTheDocument();
  });

  it('4. LocationFormModal hiển thị Smart Empty State kèm nút CTA chuyển mượt sang tạo phân khu khi Farm chưa có Zone', () => {
    const handleOpenZoneModal = vi.fn();

    render(
      <LocationFormModal
        isOpen={true}
        onClose={vi.fn()}
        farms={mockFarms}
        initialFarmId={3} // Farm chưa có Zone nào
        initialZoneId={null}
        onOpenZoneModal={handleOpenZoneModal}
        onSuccess={vi.fn()}
      />
    );

    // Kiểm tra thông báo cảnh báo vàng và nút CTA
    expect(screen.getByText(/chưa có phân khu ACTIVE nào/i)).toBeInTheDocument();
    const createZoneCta = screen.getByText('[+ Tạo Phân Khu Cho Trang Trại Này Ngay]');
    expect(createZoneCta).toBeInTheDocument();

    fireEvent.click(createZoneCta);
    expect(handleOpenZoneModal).toHaveBeenCalledWith(3);
  });
});
