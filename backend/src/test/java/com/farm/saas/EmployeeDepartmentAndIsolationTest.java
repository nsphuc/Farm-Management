package com.farm.saas;

import com.farm.saas.modules.hr.service.impl.EmployeeServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class EmployeeDepartmentAndIsolationTest {

    @Test
    @DisplayName("Kiểm thử tự động suy diễn phòng ban từ chức vụ (Auto-infer Department)")
    void testDepartmentInferenceFromPosition() {
        // 1. FARM_MANAGER -> "Ban Quản Lý Trang Trại"
        assertEquals("Ban Quản Lý Trang Trại", EmployeeServiceImpl.inferDepartmentFromPosition("FARM_MANAGER"));
        assertEquals("Ban Quản Lý Trang Trại", EmployeeServiceImpl.inferDepartmentFromPosition("Giám đốc trang trại"));
        assertEquals("Ban Quản Lý Trang Trại", EmployeeServiceImpl.inferDepartmentFromPosition("Trưởng trại"));
        assertEquals("Ban Quản Lý Trang Trại", EmployeeServiceImpl.inferDepartmentFromPosition("Deputy_Manager"));

        // 2. ZONE_MANAGER, TECHNICAL_STAFF -> "Bộ Phận Kỹ Thuật & Sản Xuất"
        assertEquals("Bộ Phận Kỹ Thuật & Sản Xuất", EmployeeServiceImpl.inferDepartmentFromPosition("ZONE_MANAGER"));
        assertEquals("Bộ Phận Kỹ Thuật & Sản Xuất", EmployeeServiceImpl.inferDepartmentFromPosition("TECHNICAL_STAFF"));
        assertEquals("Bộ Phận Kỹ Thuật & Sản Xuất", EmployeeServiceImpl.inferDepartmentFromPosition("TECHNICAL_LEAD"));
        assertEquals("Bộ Phận Kỹ Thuật & Sản Xuất", EmployeeServiceImpl.inferDepartmentFromPosition("AGRONOMIST"));
        assertEquals("Bộ Phận Kỹ Thuật & Sản Xuất", EmployeeServiceImpl.inferDepartmentFromPosition("VETERINARIAN"));
        assertEquals("Bộ Phận Kỹ Thuật & Sản Xuất", EmployeeServiceImpl.inferDepartmentFromPosition("Kỹ sư nông học"));
        assertEquals("Bộ Phận Kỹ Thuật & Sản Xuất", EmployeeServiceImpl.inferDepartmentFromPosition("Bác sĩ thú y"));
        assertEquals("Bộ Phận Kỹ Thuật & Sản Xuất", EmployeeServiceImpl.inferDepartmentFromPosition("KCS"));

        // 3. WAREHOUSE_STAFF -> "Bộ Phận Kho Vận"
        assertEquals("Bộ Phận Kho Vận", EmployeeServiceImpl.inferDepartmentFromPosition("WAREHOUSE_STAFF"));
        assertEquals("Bộ Phận Kho Vận", EmployeeServiceImpl.inferDepartmentFromPosition("WAREHOUSE_KEEPER"));
        assertEquals("Bộ Phận Kho Vận", EmployeeServiceImpl.inferDepartmentFromPosition("Thủ kho"));
        assertEquals("Bộ Phận Kho Vận", EmployeeServiceImpl.inferDepartmentFromPosition("Nhân viên bốc xếp kho"));

        // 4. ACCOUNTANT -> "Bộ Phận Kế Toán Trang Trại"
        assertEquals("Bộ Phận Kế Toán Trang Trại", EmployeeServiceImpl.inferDepartmentFromPosition("ACCOUNTANT"));
        assertEquals("Bộ Phận Kế Toán Trang Trại", EmployeeServiceImpl.inferDepartmentFromPosition("Kế toán trang trại"));
        assertEquals("Bộ Phận Kế Toán Trang Trại", EmployeeServiceImpl.inferDepartmentFromPosition("Thủ quỹ"));

        // 5. FIELD_STAFF_ACCOUNT, SEASONAL_NO_ACCOUNT (hoặc các vị trí công nhân) -> "Tổ Sản Xuất Hiện Trường"
        assertEquals("Tổ Sản Xuất Hiện Trường", EmployeeServiceImpl.inferDepartmentFromPosition("FIELD_STAFF_ACCOUNT"));
        assertEquals("Tổ Sản Xuất Hiện Trường", EmployeeServiceImpl.inferDepartmentFromPosition("SEASONAL_NO_ACCOUNT"));
        assertEquals("Tổ Sản Xuất Hiện Trường", EmployeeServiceImpl.inferDepartmentFromPosition("FIELD_WORKER"));
        assertEquals("Tổ Sản Xuất Hiện Trường", EmployeeServiceImpl.inferDepartmentFromPosition("Công nhân hiện trường"));
        assertEquals("Tổ Sản Xuất Hiện Trường", EmployeeServiceImpl.inferDepartmentFromPosition("Công nhân chăm sóc dưa lưới"));
        assertEquals("Tổ Sản Xuất Hiện Trường", EmployeeServiceImpl.inferDepartmentFromPosition(""));
        assertEquals("Tổ Sản Xuất Hiện Trường", EmployeeServiceImpl.inferDepartmentFromPosition(null));
    }

    @Test
    @DisplayName("Kiểm thử cô lập nhân sự: Phân công nhân viên trang trại khác ném EMPLOYEE_BELONGS_TO_ANOTHER_FARM")
    void testCrossFarmAssignmentThrowsBusinessException() {
        var farmRepository = org.mockito.Mockito.mock(com.farm.saas.modules.geography.repository.FarmRepository.class);
        var productionZoneRepository = org.mockito.Mockito.mock(com.farm.saas.modules.geography.repository.ProductionZoneRepository.class);
        var farmAssignmentRepository = org.mockito.Mockito.mock(com.farm.saas.modules.geography.repository.FarmAssignmentRepository.class);
        var operationalCycleRepository = org.mockito.Mockito.mock(com.farm.saas.modules.geography.repository.OperationalCycleRepository.class);
        var farmOperationalSettingRepository = org.mockito.Mockito.mock(com.farm.saas.modules.geography.repository.FarmOperationalSettingRepository.class);
        var userFarmAccessRepository = org.mockito.Mockito.mock(com.farm.saas.modules.geography.repository.UserFarmAccessRepository.class);
        var userRepository = org.mockito.Mockito.mock(com.farm.saas.modules.auth.repository.UserRepository.class);
        var employeeRepository = org.mockito.Mockito.mock(com.farm.saas.modules.hr.repository.EmployeeRepository.class);
        var eventPublisher = org.mockito.Mockito.mock(org.springframework.context.ApplicationEventPublisher.class);

        var cropSeasonRepository = org.mockito.Mockito.mock(com.farm.saas.modules.crop.repository.CropSeasonRepository.class);
        var livestockGroupRepository = org.mockito.Mockito.mock(com.farm.saas.modules.livestock.repository.LivestockGroupRepository.class);
        var budgetRepository = org.mockito.Mockito.mock(com.farm.saas.modules.finance.repository.BudgetRepository.class);

        var farmOpsService = new com.farm.saas.modules.geography.service.impl.FarmOperationsServiceImpl(
                farmRepository,
                productionZoneRepository,
                farmAssignmentRepository,
                operationalCycleRepository,
                farmOperationalSettingRepository,
                userFarmAccessRepository,
                userRepository,
                employeeRepository,
                cropSeasonRepository,
                livestockGroupRepository,
                budgetRepository,
                eventPublisher
        );

        // Giả lập Farm 2 (Đà Lạt)
        com.farm.saas.modules.geography.entity.Farm farm2 = com.farm.saas.modules.geography.entity.Farm.builder()
                .id(2L)
                .tenantId(1L)
                .name("Trang Trại Đà Lạt")
                .status("ACTIVE")
                .build();
        org.mockito.Mockito.when(farmRepository.findById(2L)).thenReturn(java.util.Optional.of(farm2));

        // Giả lập Nhân viên 100 thuộc Farm 1 (Bắc Ninh)
        com.farm.saas.modules.hr.entity.Employee empFarm1 = com.farm.saas.modules.hr.entity.Employee.builder()
                .id(100L)
                .tenantId(1L)
                .farmId(1L) // Thuộc Farm 1
                .employeeCode("EMP-BACNINH-01")
                .fullName("Nguyễn Văn Bắc Ninh")
                .build();
        org.mockito.Mockito.when(userRepository.findById(100L)).thenReturn(java.util.Optional.empty());
        org.mockito.Mockito.when(employeeRepository.findById(100L)).thenReturn(java.util.Optional.of(empFarm1));

        com.farm.saas.modules.geography.dto.request.CreateFarmAssignmentRequest request = new com.farm.saas.modules.geography.dto.request.CreateFarmAssignmentRequest();
        request.setUserId(100L);
        request.setRoleInFarm("FIELD_WORKER");
        request.setAssignedFrom(java.time.LocalDate.now());

        // Phân công nhân viên Farm 1 vào Farm 2 -> BẮT BUỘC ném BusinessException với code EMPLOYEE_BELONGS_TO_ANOTHER_FARM
        com.farm.saas.common.exception.BusinessException ex = org.junit.jupiter.api.Assertions.assertThrows(
                com.farm.saas.common.exception.BusinessException.class,
                () -> farmOpsService.createAssignment(2L, request)
        );

        assertEquals("EMPLOYEE_BELONGS_TO_ANOTHER_FARM", ex.getErrorCode());
    }

    @Test
    @DisplayName("Kiểm thử Jakarta Bean Validation trên CreateEmployeeRequest: CCCD, SĐT, Email, Department ngầm")
    void testCreateEmployeeRequestValidation() {
        jakarta.validation.ValidatorFactory factory = jakarta.validation.Validation.buildDefaultValidatorFactory();
        jakarta.validation.Validator validator = factory.getValidator();

        // 1. Request hợp lệ (department để trống/null vẫn hợp lệ)
        com.farm.saas.modules.hr.dto.request.CreateEmployeeRequest validReq = com.farm.saas.modules.hr.dto.request.CreateEmployeeRequest.builder()
                .employeeCode("EMP-VALID-01")
                .fullName("Lê Văn Chuẩn")
                .phone("0912345678")
                .email("chuan.le@greenfarm.vn")
                .idCardNumber("001096001234") // 12 số
                .dateOfBirth(java.time.LocalDate.of(2000, 1, 1))
                .joinedDate(java.time.LocalDate.now())
                .position("ACCOUNTANT")
                .department(null) // Để null -> không bị lỗi validation
                .contractType("FULL_TIME")
                .build();

        var violations = validator.validate(validReq);
        org.junit.jupiter.api.Assertions.assertTrue(violations.isEmpty(), "Request hợp lệ không được có lỗi validation");

        // 2. Request sai định dạng phone, idCardNumber, email
        com.farm.saas.modules.hr.dto.request.CreateEmployeeRequest invalidReq = com.farm.saas.modules.hr.dto.request.CreateEmployeeRequest.builder()
                .employeeCode("EMP-INVALID-01")
                .fullName("Trần Sai Định Dạng")
                .phone("0123456") // Sai số điện thoại
                .email("khong-phai-email") // Sai email
                .idCardNumber("12345") // Chỉ có 5 số (phải là 9 hoặc 12)
                .dateOfBirth(java.time.LocalDate.of(2000, 1, 1))
                .joinedDate(java.time.LocalDate.now())
                .position("FIELD_WORKER")
                .contractType("FULL_TIME")
                .build();

        var invalidViolations = validator.validate(invalidReq);
        org.junit.jupiter.api.Assertions.assertTrue(invalidViolations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("phone")));
        org.junit.jupiter.api.Assertions.assertTrue(invalidViolations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("idCardNumber")));
        org.junit.jupiter.api.Assertions.assertTrue(invalidViolations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("email")));
    }

    @Test
    @DisplayName("Kiểm thử One-step Provisioning & Bổ nhiệm FARM_MANAGER cho trang trại")
    void testOneStepFarmManagerProvisioningAndAppointment() {
        var empRepo = org.mockito.Mockito.mock(com.farm.saas.modules.hr.repository.EmployeeRepository.class);
        var farmRepo = org.mockito.Mockito.mock(com.farm.saas.modules.geography.repository.FarmRepository.class);
        var productionZoneRepo = org.mockito.Mockito.mock(com.farm.saas.modules.geography.repository.ProductionZoneRepository.class);
        var userRepo = org.mockito.Mockito.mock(com.farm.saas.modules.auth.repository.UserRepository.class);
        var roleRepo = org.mockito.Mockito.mock(com.farm.saas.modules.auth.repository.RoleRepository.class);
        var userRoleRepo = org.mockito.Mockito.mock(com.farm.saas.modules.auth.repository.UserRoleRepository.class);
        var userFarmAccessRepo = org.mockito.Mockito.mock(com.farm.saas.modules.geography.repository.UserFarmAccessRepository.class);
        var farmAssignmentRepo = org.mockito.Mockito.mock(com.farm.saas.modules.geography.repository.FarmAssignmentRepository.class);
        var subRepo = org.mockito.Mockito.mock(com.farm.saas.modules.platform.repository.TenantSubscriptionRepository.class);
        var passwordEncoder = org.mockito.Mockito.mock(org.springframework.security.crypto.password.PasswordEncoder.class);

        var service = new com.farm.saas.modules.hr.service.impl.EmployeeServiceImpl(
                empRepo, farmRepo, productionZoneRepo, userRepo, roleRepo, userRoleRepo, userFarmAccessRepo, farmAssignmentRepo, subRepo, passwordEncoder
        );

        // Giả lập Security Context cho Owner
        var auth = org.mockito.Mockito.mock(org.springframework.security.core.Authentication.class);
        var userDetails = org.mockito.Mockito.mock(com.farm.saas.common.security.CustomUserDetails.class);
        org.mockito.Mockito.when(userDetails.getTenantId()).thenReturn(1L);
        org.mockito.Mockito.when(userDetails.getId()).thenReturn(2L);
        org.mockito.Mockito.when(userDetails.isSuperAdmin()).thenReturn(false);
        org.mockito.Mockito.when(userDetails.hasAnyRole("ROLE_SUPER_ADMIN", "ROLE_FARM_OWNER", "ROLE_ACCOUNTANT")).thenReturn(true);
        org.mockito.Mockito.when(auth.getPrincipal()).thenReturn(userDetails);
        org.mockito.Mockito.when(auth.isAuthenticated()).thenReturn(true);

        var secContext = org.mockito.Mockito.mock(org.springframework.security.core.context.SecurityContext.class);
        org.mockito.Mockito.when(secContext.getAuthentication()).thenReturn(auth);
        org.springframework.security.core.context.SecurityContextHolder.setContext(secContext);

        try {
            // Giả lập Farm 10
            com.farm.saas.modules.geography.entity.Farm farm10 = com.farm.saas.modules.geography.entity.Farm.builder()
                    .id(10L)
                    .tenantId(1L)
                    .name("Trang Trại Bắc Ninh")
                    .status("ACTIVE")
                    .build();
            org.mockito.Mockito.when(farmRepo.findById(10L)).thenReturn(java.util.Optional.of(farm10));

            // Giả lập save employee
            org.mockito.Mockito.when(empRepo.save(org.mockito.Mockito.any(com.farm.saas.modules.hr.entity.Employee.class)))
                    .thenAnswer(inv -> {
                        com.farm.saas.modules.hr.entity.Employee e = inv.getArgument(0);
                        if (e.getId() == null) e.setId(51L);
                        return e;
                    });

            // Giả lập save user
            org.mockito.Mockito.when(userRepo.existsByUsername("fm_bacninh")).thenReturn(false);
            org.mockito.Mockito.when(passwordEncoder.encode(org.mockito.Mockito.anyString())).thenReturn("hashed_pass");
            org.mockito.Mockito.when(userRepo.save(org.mockito.Mockito.any(com.farm.saas.modules.auth.entity.User.class)))
                    .thenAnswer(inv -> {
                        com.farm.saas.modules.auth.entity.User u = inv.getArgument(0);
                        if (u.getId() == null) u.setId(5L);
                        return u;
                    });

            // Giả lập role
            com.farm.saas.modules.auth.entity.Role fmRole = com.farm.saas.modules.auth.entity.Role.builder()
                    .id(8L)
                    .code("ROLE_TECHNICAL_STAFF")
                    .build();
            org.mockito.Mockito.when(roleRepo.findByCode(org.mockito.Mockito.anyString())).thenReturn(java.util.Optional.of(fmRole));

            com.farm.saas.modules.hr.dto.request.CreateEmployeeRequest req = com.farm.saas.modules.hr.dto.request.CreateEmployeeRequest.builder()
                    .farmId(10L)
                    .employeeCode("EMP-FM-01")
                    .fullName("Trần Trưởng Trại")
                    .phone("0912345678")
                    .email("manager@farm.vn")
                    .idCardNumber("001096001234")
                    .position("FARM_MANAGER")
                    .dateOfBirth(java.time.LocalDate.of(1990, 1, 1))
                    .joinedDate(java.time.LocalDate.now())
                    .contractType("FULL_TIME")
                    .createAccount(true)
                    .username("fm_bacninh")
                    .initialPassword("Password@123")
                    .build();

            com.farm.saas.modules.hr.dto.response.EmployeeDetailResponse res = service.createEmployee(req);

            org.junit.jupiter.api.Assertions.assertNotNull(res);
            assertEquals("EMP-FM-01", res.getEmployeeCode());
            assertEquals("Ban Quản Lý Trang Trại", res.getDepartment());

            // Xác minh Farm được cập nhật managerUserId = 5L
            org.mockito.Mockito.verify(farmRepo, org.mockito.Mockito.atLeastOnce())
                    .save(org.mockito.Mockito.argThat(f -> Long.valueOf(5L).equals(f.getManagerUserId())));

            // Xác minh farm_assignments được tạo với role_in_farm = 'FARM_MANAGER'
            org.mockito.Mockito.verify(farmAssignmentRepo, org.mockito.Mockito.times(1))
                    .save(org.mockito.Mockito.argThat(a -> "FARM_MANAGER".equals(a.getRoleInFarm()) && Long.valueOf(5L).equals(a.getUserId()) && Long.valueOf(10L).equals(a.getFarmId())));

            // Xác minh user_farm_access được cấp
            org.mockito.Mockito.verify(userFarmAccessRepo, org.mockito.Mockito.times(1))
                    .save(org.mockito.Mockito.argThat(ufa -> Long.valueOf(5L).equals(ufa.getUserId()) && Long.valueOf(10L).equals(ufa.getFarmId())));

        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }

    @Test
    @DisplayName("Kiểm thử WS-B thôi việc (RESIGNED/TERMINATED): Vô hiệu hóa toàn bộ phân công WS-A và gỡ bỏ Quản lý trang trại")
    void testEmployeeResignationClearsAssignmentsAndManagerRole() {
        var empRepo = org.mockito.Mockito.mock(com.farm.saas.modules.hr.repository.EmployeeRepository.class);
        var farmRepo = org.mockito.Mockito.mock(com.farm.saas.modules.geography.repository.FarmRepository.class);
        var productionZoneRepo = org.mockito.Mockito.mock(com.farm.saas.modules.geography.repository.ProductionZoneRepository.class);
        var userRepo = org.mockito.Mockito.mock(com.farm.saas.modules.auth.repository.UserRepository.class);
        var roleRepo = org.mockito.Mockito.mock(com.farm.saas.modules.auth.repository.RoleRepository.class);
        var userRoleRepo = org.mockito.Mockito.mock(com.farm.saas.modules.auth.repository.UserRoleRepository.class);
        var userFarmAccessRepo = org.mockito.Mockito.mock(com.farm.saas.modules.geography.repository.UserFarmAccessRepository.class);
        var farmAssignmentRepo = org.mockito.Mockito.mock(com.farm.saas.modules.geography.repository.FarmAssignmentRepository.class);
        var subRepo = org.mockito.Mockito.mock(com.farm.saas.modules.platform.repository.TenantSubscriptionRepository.class);
        var passwordEncoder = org.mockito.Mockito.mock(org.springframework.security.crypto.password.PasswordEncoder.class);

        var service = new com.farm.saas.modules.hr.service.impl.EmployeeServiceImpl(
                empRepo, farmRepo, productionZoneRepo, userRepo, roleRepo, userRoleRepo, userFarmAccessRepo, farmAssignmentRepo, subRepo, passwordEncoder
        );

        var auth = org.mockito.Mockito.mock(org.springframework.security.core.Authentication.class);
        var userDetails = org.mockito.Mockito.mock(com.farm.saas.common.security.CustomUserDetails.class);
        org.mockito.Mockito.when(userDetails.getTenantId()).thenReturn(1L);
        org.mockito.Mockito.when(userDetails.getId()).thenReturn(2L);
        org.mockito.Mockito.when(userDetails.isSuperAdmin()).thenReturn(false);
        org.mockito.Mockito.when(userDetails.hasAnyRole("ROLE_SUPER_ADMIN", "ROLE_FARM_OWNER", "ROLE_ACCOUNTANT")).thenReturn(true);
        org.mockito.Mockito.when(auth.getPrincipal()).thenReturn(userDetails);
        org.mockito.Mockito.when(auth.isAuthenticated()).thenReturn(true);

        var secContext = org.mockito.Mockito.mock(org.springframework.security.core.context.SecurityContext.class);
        org.mockito.Mockito.when(secContext.getAuthentication()).thenReturn(auth);
        org.springframework.security.core.context.SecurityContextHolder.setContext(secContext);

        try {
            // Nhân viên ID 50, User ID 70 đang làm Giám đốc tại Farm 10
            com.farm.saas.modules.hr.entity.Employee emp = com.farm.saas.modules.hr.entity.Employee.builder()
                    .id(50L)
                    .tenantId(1L)
                    .farmId(10L)
                    .userId(70L)
                    .employeeCode("EMP-RESIGN-01")
                    .fullName("Nguyễn Thôi Việc")
                    .position("FARM_MANAGER")
                    .department("Ban Quản Lý Trang Trại")
                    .status("ACTIVE")
                    .joinedDate(java.time.LocalDate.now().minusYears(1))
                    .dateOfBirth(java.time.LocalDate.of(1990, 1, 1))
                    .contractType("FULL_TIME")
                    .baseSalary(new java.math.BigDecimal("15000000"))
                    .hourlyRate(new java.math.BigDecimal("75000"))
                    .annualLeaveQuota(new java.math.BigDecimal("12"))
                    .build();
            org.mockito.Mockito.when(empRepo.findById(50L)).thenReturn(java.util.Optional.of(emp));
            org.mockito.Mockito.when(empRepo.save(org.mockito.Mockito.any(com.farm.saas.modules.hr.entity.Employee.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // Farm 10 có manager_user_id = 70
            com.farm.saas.modules.geography.entity.Farm farm10 = com.farm.saas.modules.geography.entity.Farm.builder()
                    .id(10L)
                    .tenantId(1L)
                    .name("Trang Trại Thử Nghiệm")
                    .managerUserId(70L)
                    .status("ACTIVE")
                    .build();
            org.mockito.Mockito.when(farmRepo.findById(10L)).thenReturn(java.util.Optional.of(farm10));
            org.mockito.Mockito.when(farmRepo.findAll()).thenReturn(java.util.List.of(farm10));

            // Phân công đang hoạt động trong WS-A
            com.farm.saas.modules.geography.entity.FarmAssignment fa = com.farm.saas.modules.geography.entity.FarmAssignment.builder()
                    .id(101L)
                    .tenantId(1L)
                    .farmId(10L)
                    .userId(70L)
                    .roleInFarm("FARM_MANAGER")
                    .assignedFrom(java.time.LocalDate.now().minusMonths(6))
                    .isActive(true)
                    .build();
            org.mockito.Mockito.when(farmAssignmentRepo.findByUserIdAndIsActiveTrue(70L)).thenReturn(java.util.List.of(fa));
            org.mockito.Mockito.when(farmAssignmentRepo.findByUserIdAndIsActiveTrue(50L)).thenReturn(java.util.Collections.emptyList());

            // Yêu cầu thôi việc (RESIGNED)
            com.farm.saas.modules.hr.dto.request.UpdateEmployeeRequest req = com.farm.saas.modules.hr.dto.request.UpdateEmployeeRequest.builder()
                    .fullName("Nguyễn Thôi Việc")
                    .position("FARM_MANAGER")
                    .status("RESIGNED")
                    .contractType("FULL_TIME")
                    .build();

            service.updateEmployee(50L, req);

            // 1. Trạng thái nhân viên chuyển thành RESIGNED
            assertEquals("RESIGNED", emp.getStatus());

            // 2. ManagerUserId tại Farm 10 được giải phóng về null
            assertEquals(null, farm10.getManagerUserId());
            org.mockito.Mockito.verify(farmRepo, org.mockito.Mockito.atLeastOnce())
                    .save(org.mockito.Mockito.argThat(f -> f.getManagerUserId() == null));

            // 3. Phân công trong WS-A (farm_assignments) bị vô hiệu hóa isActive = false
            assertEquals(false, fa.getIsActive());
            org.mockito.Mockito.verify(farmAssignmentRepo, org.mockito.Mockito.atLeastOnce())
                    .save(org.mockito.Mockito.argThat(a -> Boolean.FALSE.equals(a.getIsActive())));

        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }
}
