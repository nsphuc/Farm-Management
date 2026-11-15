import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkerDailyTasksView } from './components/WorkerDailyTasksView';
import { hrService } from '@/services/modules/hrService';
import { toast } from '@/store/useToastStore';
import { isShiftCoveringTask, checkTaskOverdue } from '@/utils/formatters';

// Mock hrService
vi.mock('@/services/modules/hrService', () => ({
  hrService: {
    updateTaskStatus: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock toast
vi.mock('@/store/useToastStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('WorkerDailyTasksView - Kanban Board for Field Workers', () => {
  const mockCurrentEmployee = {
    id: 10,
    fullName: 'Nguyễn Văn Công Nhân',
    position: 'FIELD_WORKER',
  };

  const mockTasks = [
    {
      id: 101,
      taskTitle: '[CỐ ĐỊNH HÀNG NGÀY] Tưới nước nhỏ giọt nhà màng A1',
      taskType: 'PLANTING',
      priority: 'HIGH',
      status: 'TODO',
      assignedToEmployeeId: 10,
      zoneName: 'Khu Nhà Màng Công Nghệ Cao',
      locationName: 'Nhà màng A1',
      startTime: '07:00:00',
      endTime: '09:00:00',
      completionNotes: 'Kiểm tra lưu lượng nước và van tưới',
    },
    {
      id: 102,
      taskTitle: '[PHÁT SINH] Bón phân vi sinh cho luống dâu tây',
      taskType: 'FERTILIZING',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      assignedToEmployeeId: 10,
      zoneName: 'Khu Dâu Tây Canh Tác Hữu Cơ',
      locationName: 'Luống 3',
      startTime: '09:30:00',
      endTime: '11:30:00',
      materialName: 'Phân vi sinh Tricoderma',
      standardQuantity: 25,
      unit: 'kg',
    },
    {
      id: 103,
      taskTitle: 'Thu hoạch cà chua cherry chín',
      taskType: 'HARVESTING',
      priority: 'MEDIUM',
      status: 'PENDING_REVIEW',
      assignedToEmployeeId: 10,
      zoneName: 'Khu Cà Chua',
      photosJson: JSON.stringify(['https://example.com/photo1.jpg']),
      completionNotes: 'Đã thu hoạch 120kg cà chua',
    },
    {
      id: 104,
      taskTitle: 'Vệ sinh chuồng gà giống',
      taskType: 'SANITATION',
      priority: 'LOW',
      status: 'DONE',
      assignedToEmployeeId: 10,
      zoneName: 'Khu Chăn Nuôi',
      photosJson: JSON.stringify(['https://example.com/photo2.jpg']),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Render đầy đủ 4 cột điều phối Kanban chuẩn quy trình hiện trường', () => {
    render(
      <WorkerDailyTasksView
        tasks={mockTasks}
        currentEmployee={mockCurrentEmployee}
        onRefresh={vi.fn()}
      />
    );

    // Tiêu đề & Bảng điều phối
    expect(screen.getByText(/Bảng Điều Phối Kanban Hiện Trường/i)).toBeInTheDocument();
    expect(screen.getByText(/Tiếp Nhận & Điều Phối Công Việc Của Tôi/i)).toBeInTheDocument();

    // 4 Cột Kanban
    expect(screen.getByRole('heading', { name: /Chờ Tiếp Nhận \/ Cần Làm/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Đang Thực Hiện/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Chờ Nghiệm Thu/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Đã Hoàn Thành/i })).toBeInTheDocument();
  });

  it('2. Phân loại chính xác các thẻ nhiệm vụ vào từng cột tương ứng', () => {
    render(
      <WorkerDailyTasksView
        tasks={mockTasks}
        currentEmployee={mockCurrentEmployee}
        onRefresh={vi.fn()}
      />
    );

    // Nhiệm vụ TODO
    expect(screen.getByText(/Tưới nước nhỏ giọt nhà màng A1/i)).toBeInTheDocument();
    // Nhiệm vụ IN_PROGRESS
    expect(screen.getByText(/Bón phân vi sinh cho luống dâu tây/i)).toBeInTheDocument();
    // Nhiệm vụ PENDING_REVIEW
    expect(screen.getByText(/Thu hoạch cà chua cherry chín/i)).toBeInTheDocument();
    // Nhiệm vụ DONE
    expect(screen.getByText(/Vệ sinh chuồng gà giống/i)).toBeInTheDocument();

    // Huy hiệu CỐ ĐỊNH vs PHÁT SINH
    expect(screen.getAllByText('CỐ ĐỊNH').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PHÁT SINH').length).toBeGreaterThan(0);
  });

  it('3. Nhấn "TIẾP NHẬN & BẮT ĐẦU" gọi API hrService.updateTaskStatus chuyển sang IN_PROGRESS', async () => {
    const mockRefresh = vi.fn();
    render(
      <WorkerDailyTasksView
        tasks={mockTasks}
        currentEmployee={mockCurrentEmployee}
        onRefresh={mockRefresh}
      />
    );

    const startButton = screen.getByRole('button', { name: /TIẾP NHẬN & BẮT ĐẦU/i });
    expect(startButton).toBeInTheDocument();

    fireEvent.click(startButton);

    await waitFor(() => {
      expect(hrService.updateTaskStatus).toHaveBeenCalledWith(
        101,
        expect.objectContaining({ status: 'IN_PROGRESS' })
      );
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('4. Tìm kiếm lọc nhanh các thẻ công việc theo từ khóa', () => {
    render(
      <WorkerDailyTasksView
        tasks={mockTasks}
        currentEmployee={mockCurrentEmployee}
        onRefresh={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm theo tên việc/i);
    fireEvent.change(searchInput, { target: { value: 'dâu tây' } });

    // Chỉ còn việc liên quan đến dâu tây
    expect(screen.getByText(/Bón phân vi sinh cho luống dâu tây/i)).toBeInTheDocument();
    expect(screen.queryByText(/Tưới nước nhỏ giọt nhà màng A1/i)).not.toBeInTheDocument();
  });

  it('5. Mở Modal xem chi tiết nhiệm vụ hiện trường khi bấm vào tiêu đề hoặc icon con mắt', async () => {
    render(
      <WorkerDailyTasksView
        tasks={mockTasks}
        currentEmployee={mockCurrentEmployee}
        onRefresh={vi.fn()}
      />
    );

    const taskTitle = screen.getByText(/Tưới nước nhỏ giọt nhà màng A1/i);
    fireEvent.click(taskTitle);

    expect(screen.getByText('Chi Tiết Nhiệm Vụ Hiện Trường')).toBeInTheDocument();
    expect(screen.getByText(/Địa Điểm & Phân Khu/i)).toBeInTheDocument();
    expect(screen.getAllByText('Khu Nhà Màng Công Nghệ Cao').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Nhà màng A1/i).length).toBeGreaterThanOrEqual(2);
  });

  it('6. Lọc theo nguồn gốc việc Cố Định vs Việc Phát Sinh hoạt động chính xác', () => {
    render(
      <WorkerDailyTasksView
        tasks={mockTasks}
        currentEmployee={mockCurrentEmployee}
        onRefresh={vi.fn()}
      />
    );

    const routineFilterBtn = screen.getByRole('button', { name: /Cố Định/i });
    fireEvent.click(routineFilterBtn);

    // Nhiệm vụ cố định hiển thị, việc phát sinh bị ẩn
    expect(screen.getByText(/Tưới nước nhỏ giọt nhà màng A1/i)).toBeInTheDocument();
    expect(screen.queryByText(/Bón phân vi sinh cho luống dâu tây/i)).not.toBeInTheDocument();

    const adhocFilterBtn = screen.getByRole('button', { name: /Phát Sinh/i });
    fireEvent.click(adhocFilterBtn);

    // Nhiệm vụ phát sinh hiển thị, việc cố định bị ẩn
    expect(screen.getByText(/Bón phân vi sinh cho luống dâu tây/i)).toBeInTheDocument();
    expect(screen.queryByText(/Tưới nước nhỏ giọt nhà màng A1/i)).not.toBeInTheDocument();
  });

  it('7. Hàm isShiftCoveringTask kiểm tra chính xác ca làm việc bao trọn khung giờ của task', () => {
    // A đi làm ca 06:00 - 14:00, việc cho heo ăn 07:30 - 09:00 -> TRUE
    expect(isShiftCoveringTask('06:00:00', '14:00:00', '07:30:00', '09:00:00')).toBe(true);

    // B đi làm ca 13:00 - 17:00, việc cho heo ăn 07:30 - 09:00 -> FALSE (Lúc 07:30 B chưa đi làm)
    expect(isShiftCoveringTask('13:00:00', '17:00:00', '07:30:00', '09:00:00')).toBe(false);

    // Ca đêm: 22:00 - 06:00, việc trực đêm 23:00 - 01:00 -> TRUE
    expect(isShiftCoveringTask('22:00:00', '06:00:00', '23:00:00', '01:00:00')).toBe(true);
  });

  it('8. Hiển thị cảnh báo QUÁ HẠN màu đỏ và nút hành động khẩn cấp khi việc đã trễ giờ', () => {
    const overdueTasksList = [
      {
        id: 999,
        taskTitle: 'Cho heo ăn sáng khẩn cấp',
        taskType: 'FEEDING',
        priority: 'URGENT',
        status: 'TODO',
        assignedToEmployeeId: 10,
        deadline: new Date(Date.now() - 3600000).toISOString(), // Quá hạn 1 tiếng trước
      },
    ];

    render(
      <WorkerDailyTasksView
        tasks={overdueTasksList}
        currentEmployee={mockCurrentEmployee}
        onRefresh={vi.fn()}
      />
    );

    // Banner cảnh báo quá hạn
    expect(screen.getByText(/CẢNH BÁO TIẾN ĐỘ: CÓ 1 NHIỆM VỤ ĐÃ QUÁ HẠN!/i)).toBeInTheDocument();

    // Cả banner cảnh báo và thẻ nhiệm vụ đều có chữ ĐÃ QUÁ HẠN
    expect(screen.getAllByText(/ĐÃ QUÁ HẠN/i).length).toBeGreaterThanOrEqual(2);

    // Nút hành động khẩn cấp
    expect(screen.getByRole('button', { name: /TIẾP NHẬN NGAY \(QUÁ HẠN\)/i })).toBeInTheDocument();
  });
});
