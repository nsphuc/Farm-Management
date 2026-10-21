package com.farm.saas;

import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.hr.dto.request.CreateFarmTaskRequest;
import com.farm.saas.modules.hr.dto.response.FarmTaskDetailResponse;
import com.farm.saas.modules.hr.entity.Employee;
import com.farm.saas.modules.hr.entity.FarmTask;
import com.farm.saas.modules.hr.entity.FarmTaskAssignee;
import com.farm.saas.modules.hr.repository.EmployeeRepository;
import com.farm.saas.modules.hr.repository.FarmTaskAssigneeRepository;
import com.farm.saas.modules.hr.repository.FarmTaskRepository;
import com.farm.saas.modules.hr.service.impl.FarmTaskServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class FarmDailyRoutineTaskTest {

    private FarmTaskRepository farmTaskRepository;
    private FarmTaskAssigneeRepository farmTaskAssigneeRepository;
    private EmployeeRepository employeeRepository;
    private FarmRepository farmRepository;
    private ProductionZoneRepository zoneRepository;
    private UserRepository userRepository;
    private FarmTaskServiceImpl farmTaskService;

    private Farm farm;
    private Employee workerWithAccount;
    private Employee workerWithoutAccount;

    @BeforeEach
    void setUp() {
        farmTaskRepository = Mockito.mock(FarmTaskRepository.class);
        farmTaskAssigneeRepository = Mockito.mock(FarmTaskAssigneeRepository.class);
        employeeRepository = Mockito.mock(EmployeeRepository.class);
        farmRepository = Mockito.mock(FarmRepository.class);
        zoneRepository = Mockito.mock(ProductionZoneRepository.class);
        userRepository = Mockito.mock(UserRepository.class);

        farmTaskService = new FarmTaskServiceImpl(
                farmTaskRepository,
                farmTaskAssigneeRepository,
                employeeRepository,
                farmRepository,
                zoneRepository,
                userRepository
        );

        farm = Farm.builder()
                .id(1L)
                .tenantId(10L)
                .name("Trang Trại Đà Lạt")
                .build();
        when(farmRepository.findById(1L)).thenReturn(Optional.of(farm));

        workerWithAccount = Employee.builder()
                .id(101L)
                .tenantId(10L)
                .farmId(1L)
                .fullName("Nguyễn Kỹ Thuật (Role 6A)")
                .userId(501L)
                .build();

        workerWithoutAccount = Employee.builder()
                .id(102L)
                .tenantId(10L)
                .farmId(1L)
                .fullName("Trần Lao Động Thời Vụ (Role 6B)")
                .userId(null)
                .build();

        when(employeeRepository.findById(101L)).thenReturn(Optional.of(workerWithAccount));
        when(employeeRepository.findById(102L)).thenReturn(Optional.of(workerWithoutAccount));

        CustomUserDetails userDetails = CustomUserDetails.builder()
                .id(500L)
                .tenantId(10L)
                .username("tech_lead")
                .roles(Set.of("ROLE_TECHNICAL_STAFF"))
                .permissions(Set.of("PERM_TASK_ASSIGN"))
                .accessibleFarmIds(Set.of(1L))
                .build();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Tự động sinh nhiệm vụ cố định hôm nay từ routine template hôm qua")
    void testGenerateDailyRoutines() {
        Instant yesterday = LocalDate.now().minusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        FarmTask yesterdayFeedingTask = FarmTask.builder()
                .id(10L)
                .tenantId(10L)
                .farmId(1L)
                .zoneId(5L)
                .taskTitle("[CỐ ĐỊNH HÀNG NGÀY] Cho vật nuôi ăn sáng/chiều (FEEDING)")
                .taskType("FEEDING")
                .priority("HIGH")
                .assignedToEmployeeId(101L)
                .status("DONE")
                .createdAt(yesterday)
                .deadline(yesterday.plusSeconds(3600 * 10))
                .build();

        when(farmTaskRepository.findByFarmIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(yesterdayFeedingTask));

        when(farmTaskRepository.save(any(FarmTask.class))).thenAnswer(invocation -> {
            FarmTask t = invocation.getArgument(0);
            if (t.getId() == null) {
                t.setId(20L);
            }
            return t;
        });

        FarmTaskAssignee templateAssignee = FarmTaskAssignee.builder()
                .taskId(10L)
                .tenantId(10L)
                .employeeId(101L)
                .roleInTask("LEADER")
                .build();
        when(farmTaskAssigneeRepository.findByTaskId(10L)).thenReturn(List.of(templateAssignee));
        when(farmTaskAssigneeRepository.findByTaskId(20L)).thenReturn(List.of(
                FarmTaskAssignee.builder().taskId(20L).tenantId(10L).employeeId(101L).roleInTask("LEADER").build()
        ));

        List<FarmTaskDetailResponse> generated = farmTaskService.generateDailyRoutines(1L);

        assertNotNull(generated);
        assertEquals(1, generated.size());
        FarmTaskDetailResponse todayTask = generated.get(0);
        assertEquals("[CỐ ĐỊNH HÀNG NGÀY] Cho vật nuôi ăn sáng/chiều (FEEDING)", todayTask.getTaskTitle());
        assertEquals("TODO", todayTask.getStatus());
        assertEquals(5L, todayTask.getZoneId());
        assertTrue(todayTask.getAssignedToHasAccount());
        verify(farmTaskRepository, atLeastOnce()).save(any(FarmTask.class));
    }

    @Test
    @DisplayName("Tự động hủy các việc cố định đang TODO khi vụ mùa đóng hoặc xuất chuồng")
    void testCancelPendingRoutineTasksForZone() {
        FarmTask pendingRoutineTask = FarmTask.builder()
                .id(30L)
                .tenantId(10L)
                .farmId(1L)
                .zoneId(5L)
                .taskTitle("[CỐ ĐỊNH HÀNG NGÀY] Cho vật nuôi ăn sáng/chiều (FEEDING)")
                .taskType("FEEDING")
                .priority("MEDIUM")
                .status("TODO")
                .build();

        FarmTask inProgressTask = FarmTask.builder()
                .id(31L)
                .tenantId(10L)
                .farmId(1L)
                .zoneId(5L)
                .taskTitle("[CỐ ĐỊNH HÀNG NGÀY] Quét dọn chuồng")
                .taskType("SANITATION")
                .priority("MEDIUM")
                .status("IN_PROGRESS")
                .build();

        FarmTask otherZoneTask = FarmTask.builder()
                .id(32L)
                .tenantId(10L)
                .farmId(1L)
                .zoneId(99L)
                .taskTitle("[CỐ ĐỊNH HÀNG NGÀY] Tưới cây vườn A")
                .taskType("PLANTING")
                .priority("MEDIUM")
                .status("TODO")
                .build();

        when(farmTaskRepository.findByFarmId(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(pendingRoutineTask, inProgressTask, otherZoneTask)));

        int cancelled = farmTaskService.cancelPendingRoutineTasksForZone(1L, 5L, "Tự động kết thúc do đã thu hoạch / xuất chuồng");

        assertEquals(1, cancelled);
        assertEquals("CANCELLED", pendingRoutineTask.getStatus());
        assertEquals("Tự động kết thúc do đã thu hoạch / xuất chuồng", pendingRoutineTask.getCompletionNotes());
        assertEquals("IN_PROGRESS", inProgressTask.getStatus());
        assertEquals("TODO", otherZoneTask.getStatus());
        verify(farmTaskRepository, times(1)).save(pendingRoutineTask);
    }

    @Test
    @DisplayName("Tạo nhiệm vụ giao cho cả nhân viên có tài khoản và không có tài khoản (Role 6B)")
    void testCreateTaskWithNoAccountWorker() {
        CreateFarmTaskRequest request = CreateFarmTaskRequest.builder()
                .zoneId(5L)
                .taskTitle("Quét dọn khu vực kho thóc")
                .taskType("SANITATION")
                .priority("LOW")
                .assignedToEmployeeId(102L) // Worker without account
                .assignees(List.of(
                        CreateFarmTaskRequest.TaskAssigneeItemRequest.builder()
                                .employeeId(102L)
                                .roleInTask("MEMBER")
                                .build()
                ))
                .build();

        when(farmTaskRepository.save(any(FarmTask.class))).thenAnswer(invocation -> {
            FarmTask t = invocation.getArgument(0);
            t.setId(40L);
            return t;
        });

        FarmTaskAssignee savedAssignee = FarmTaskAssignee.builder()
                .taskId(40L)
                .tenantId(10L)
                .employeeId(102L)
                .roleInTask("MEMBER")
                .build();
        when(farmTaskAssigneeRepository.findByTaskId(40L)).thenReturn(List.of(savedAssignee));

        FarmTaskDetailResponse res = farmTaskService.createTask(1L, request);

        assertNotNull(res);
        assertEquals("Quét dọn khu vực kho thóc", res.getTaskTitle());
        assertEquals("Trần Lao Động Thời Vụ (Role 6B)", res.getAssignedToEmployeeName());
        assertFalse(res.getAssignedToHasAccount());
        assertNull(res.getAssignedToUserId());
        assertEquals(1, res.getAssignees().size());
        assertFalse(res.getAssignees().get(0).getHasUserAccount());
    }
}
