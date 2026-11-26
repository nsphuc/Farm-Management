package com.farm.saas.modules.workforce.controller;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.security.FarmSecurityEvaluator;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.FarmMember;
import com.farm.saas.modules.auth.repository.FarmMemberRepository;
import com.farm.saas.modules.finance.entity.FarmExpense;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import com.farm.saas.modules.workforce.dto.request.CreateEmployeeRequest;
import com.farm.saas.modules.workforce.dto.request.UpdateEmployeeRequest;
import com.farm.saas.modules.workforce.dto.response.EmployeeDetailResponse;
import com.farm.saas.modules.workforce.entity.Employee;
import com.farm.saas.modules.workforce.repository.EmployeeRepository;
import com.farm.saas.modules.workforce.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping({"/api/v1/workforce", "/api/v1/farms/{farmId}/workforce"})
@RequiredArgsConstructor
@Tag(name = "Workforce Management", description = "Quản lý nhân công cố định, công khoán theo lứa nuôi, tạm ứng và chốt lương tự động sinh Phiếu Chi")
public class WorkforceController {

    private final EmployeeService employeeService;
    private final EmployeeRepository employeeRepository;
    private final FarmExpenseRepository farmExpenseRepository;
    private final FarmMemberRepository farmMemberRepository;
    private final FarmSecurityEvaluator farmSecurity;

    // Cache tạm ứng và công khoán thời vụ trong runtime
    private static final Map<Long, BigDecimal> ADVANCE_MAP = new ConcurrentHashMap<>();
    private static final List<PieceworkResponse> PIECEWORK_LIST = Collections.synchronizedList(new ArrayList<>());

    static {
        ADVANCE_MAP.put(1L, new BigDecimal("3000000"));
        ADVANCE_MAP.put(2L, new BigDecimal("2000000"));
        ADVANCE_MAP.put(3L, new BigDecimal("1500000"));

        PIECEWORK_LIST.add(PieceworkResponse.builder()
                .id(1L)
                .contractCode("KHOAN-2026-001")
                .workerName("Tổ Bốc Vác & Rải Trấu Chú Bảy (4 người)")
                .phone("0988 123 789")
                .barnName("Chuồng Gà A2")
                .batchName("Lứa Gà Thịt T10 (Chuẩn bị thả)")
                .workDate(LocalDate.now().minusDays(5))
                .taskType("Dọn chuồng & Rải trấu lót nền sinh học")
                .quantity(1)
                .unit("Chuồng (2.000m²)")
                .unitPrice(new BigDecimal("3200000"))
                .totalAmount(new BigDecimal("3200000"))
                .paymentStatus("PAID")
                .notes("Đã nghiệm thu nền trấu dày 10cm, phun sát trùng xong")
                .build());
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FixedWorkerResponse {
        private Long id;
        private String code;
        private String fullName;
        private String phone;
        private String idCard;
        private String jobTitle;
        private String department;
        private LocalDate startDate;
        private BigDecimal baseSalary;
        private BigDecimal allowance;
        private BigDecimal totalMonthlySalary;
        private BigDecimal advancePaid;
        private BigDecimal remainingSalary;
        private String paymentStatus;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PieceworkResponse {
        private Long id;
        private String contractCode;
        private String workerName;
        private String phone;
        private Long barnId;
        private String barnName;
        private Long batchId;
        private String batchName;
        private LocalDate workDate;
        private String taskType;
        private Integer quantity;
        private String unit;
        private BigDecimal unitPrice;
        private BigDecimal totalAmount;
        private String paymentStatus;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreatePieceworkRequest {
        private String workerName;
        private String phone;
        private Long barnId;
        private String barnName;
        private Long batchId;
        private String batchName;
        private LocalDate workDate;
        private String taskType;
        private Integer quantity;
        private String unit;
        private BigDecimal unitPrice;
        private String notes;
        private Boolean payNow;
        private String paymentMethod;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PayrollHistoryResponse {
        private Long id;
        private String refCashSlip;
        private LocalDate date;
        private String workerName;
        private String payoutType; // ADVANCE, PAYROLL_FULL, SEASONAL
        private BigDecimal amount;
        private String fundSource; // CASH, BANK
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdvanceRequest {
        private Long workerId;
        private BigDecimal amount;
        private LocalDate advanceDate;
        private String reason;
        private String paymentMethod;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaySalaryRequest {
        private Long workerId;
        private BigDecimal amount;
        private LocalDate payDate;
        private String paymentMethod;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkforceOverviewResponse {
        private BigDecimal totalMonthlySalaryFund;
        private BigDecimal totalAdvancePaid;
        private BigDecimal totalRemainingSalary;
        private BigDecimal totalPieceworkCost;
        private List<FixedWorkerResponse> fixedWorkers;
        private List<PieceworkResponse> pieceworkContracts;
        private List<PayrollHistoryResponse> payrollHistory;
    }

    @GetMapping("/overview")
    @PreAuthorize("(hasAnyAuthority('workforce.view', 'PERM_HR_EMPLOYEE_MANAGE', 'PERM_FINANCE_EXPENSE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    @Operation(summary = "Lấy dữ liệu tổng hợp nhân sự: nhân công cố định, công khoán, tạm ứng và quỹ lương")
    public ResponseEntity<WorkforceOverviewResponse> getOverview(
            @PathVariable(required = false) Long farmId,
            @RequestParam(required = false) Long branchId) {

        Long targetFarmId = (farmId != null && farmId > 0) ? farmId : 1L;
        Long effectiveBranchId = farmSecurity.resolveEffectiveBranchId(targetFarmId, branchId);

        Map<Long, Long> branchByUserId = new HashMap<>();
        for (FarmMember fm : farmMemberRepository.findByFarmId(targetFarmId)) {
            if (fm.getUserId() != null && fm.getBranchId() != null) {
                branchByUserId.put(fm.getUserId(), fm.getBranchId());
            }
        }

        List<Employee> allEmployees = employeeRepository.findAll().stream()
                .filter(e -> e.getFarmId() == null || targetFarmId.equals(e.getFarmId()))
                .filter(e -> {
                    if (effectiveBranchId == null) return true;
                    Long empBranchId = (e.getUserId() != null && branchByUserId.containsKey(e.getUserId()))
                            ? branchByUserId.get(e.getUserId())
                            : 1L;
                    return effectiveBranchId.equals(empBranchId);
                })
                .collect(java.util.stream.Collectors.toList());

        List<FarmExpense> farmExpenses = farmExpenseRepository.findByFarmId(targetFarmId).stream()
                .filter(e -> {
                    if (effectiveBranchId == null) return true;
                    Long expBranchId = e.getBranchId() != null ? e.getBranchId() : 1L;
                    return effectiveBranchId.equals(expBranchId);
                })
                .collect(java.util.stream.Collectors.toList());
        LocalDate now = LocalDate.now();

        // Tính tạm ứng và lịch sử chi trả lương từ database (farm_expenses)
        Map<Long, Long> latestPayoutIdByEmp = new HashMap<>();
        Map<Long, LocalDate> latestPayoutDateByEmp = new HashMap<>();
        List<PayrollHistoryResponse> historyList = new ArrayList<>();

        for (FarmExpense exp : farmExpenses) {
            String src = exp.getExpenseSource() != null ? exp.getExpenseSource().toUpperCase() : "";
            if ("SALARY_PAYOUT".equals(src) && exp.getReferenceId() != null) {
                Long prevId = latestPayoutIdByEmp.getOrDefault(exp.getReferenceId(), 0L);
                if (exp.getId() != null && exp.getId() > prevId) {
                    latestPayoutIdByEmp.put(exp.getReferenceId(), exp.getId());
                    latestPayoutDateByEmp.put(exp.getReferenceId(), exp.getExpenseDate());
                }
            }
            if ("SALARY_ADVANCE".equals(src) || "SALARY_PAYOUT".equals(src) || "PAYROLL".equals(src) || "PIECEWORK".equals(src)) {
                String payoutType = "SALARY_ADVANCE".equals(src) ? "ADVANCE"
                        : ("PIECEWORK".equals(src) ? "SEASONAL" : "PAYROLL_FULL");
                String pm = exp.getPaymentMethod() != null ? exp.getPaymentMethod().toUpperCase() : "";
                String fundSource = ("TIEN_MAT".equals(pm) || "CASH".equals(pm)) ? "CASH" : "BANK";
                historyList.add(PayrollHistoryResponse.builder()
                        .id(exp.getId())
                        .refCashSlip(StringUtils.hasText(exp.getExpenseCode()) ? exp.getExpenseCode() : "PC-" + exp.getId())
                        .date(exp.getExpenseDate())
                        .workerName(StringUtils.hasText(exp.getRecipientName()) ? exp.getRecipientName() : "Nhân công trang trại")
                        .payoutType(payoutType)
                        .amount(exp.getAmount() != null ? exp.getAmount() : BigDecimal.ZERO)
                        .fundSource(fundSource)
                        .notes(exp.getNotes())
                        .build());
            }
        }
        historyList.sort((a, b) -> Long.compare(b.getId() != null ? b.getId() : 0L, a.getId() != null ? a.getId() : 0L));

        Map<Long, BigDecimal> dbAdvanceByEmp = new HashMap<>();
        for (FarmExpense exp : farmExpenses) {
            if ("SALARY_ADVANCE".equalsIgnoreCase(exp.getExpenseSource()) && exp.getReferenceId() != null) {
                Long empId = exp.getReferenceId();
                Long latestPayoutId = latestPayoutIdByEmp.getOrDefault(empId, 0L);
                if (exp.getId() != null && exp.getId() > latestPayoutId) {
                    BigDecimal amt = exp.getAmount() != null ? exp.getAmount() : BigDecimal.ZERO;
                    dbAdvanceByEmp.merge(empId, amt, BigDecimal::add);
                }
            }
        }

        List<FixedWorkerResponse> fixedList = new ArrayList<>();
        BigDecimal totalFund = BigDecimal.ZERO;
        BigDecimal totalAdvance = BigDecimal.ZERO;

        for (Employee emp : allEmployees) {
            BigDecimal base = emp.getBaseSalary() != null ? emp.getBaseSalary() : new BigDecimal("7000000");
            BigDecimal allow = new BigDecimal("1000000");
            BigDecimal totalMonth = base.add(allow);
            BigDecimal adv = dbAdvanceByEmp.getOrDefault(emp.getId(), BigDecimal.ZERO);

            LocalDate lastPaidDate = latestPayoutDateByEmp.get(emp.getId());
            boolean paidThisMonth = lastPaidDate != null
                    && lastPaidDate.getYear() == now.getYear()
                    && lastPaidDate.getMonth() == now.getMonth()
                    && adv.compareTo(BigDecimal.ZERO) == 0;

            BigDecimal rem = paidThisMonth ? BigDecimal.ZERO : totalMonth.subtract(adv).max(BigDecimal.ZERO);

            totalFund = totalFund.add(totalMonth);
            totalAdvance = totalAdvance.add(adv);

            fixedList.add(FixedWorkerResponse.builder()
                    .id(emp.getId())
                    .code(emp.getEmployeeCode())
                    .fullName(emp.getFullName())
                    .phone(emp.getPhone())
                    .idCard(emp.getIdCardNumber())
                    .jobTitle(emp.getPosition() != null ? emp.getPosition() : "Nhân viên chăn nuôi")
                    .department(emp.getDepartment() != null ? emp.getDepartment() : "Khu nuôi")
                    .startDate(emp.getJoinedDate())
                    .baseSalary(base)
                    .allowance(allow)
                    .totalMonthlySalary(totalMonth)
                    .advancePaid(adv)
                    .remainingSalary(rem)
                    .paymentStatus(rem.compareTo(BigDecimal.ZERO) == 0 ? "PAID" : (adv.compareTo(BigDecimal.ZERO) > 0 ? "PARTIAL" : "UNPAID"))
                    .build());
        }

        List<PieceworkResponse> filteredPiecework = (effectiveBranchId == null || Long.valueOf(1L).equals(effectiveBranchId))
                ? new ArrayList<>(PIECEWORK_LIST)
                : new ArrayList<>();

        BigDecimal totalPiecework = filteredPiecework.stream()
                .map(PieceworkResponse::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        WorkforceOverviewResponse overview = WorkforceOverviewResponse.builder()
                .totalMonthlySalaryFund(totalFund)
                .totalAdvancePaid(totalAdvance)
                .totalRemainingSalary(totalFund.subtract(totalAdvance).max(BigDecimal.ZERO))
                .totalPieceworkCost(totalPiecework)
                .fixedWorkers(fixedList)
                .pieceworkContracts(filteredPiecework)
                .payrollHistory(historyList)
                .build();

        return ResponseEntity.ok(overview);
    }

    @PostMapping("/workers")
    @PreAuthorize("hasAnyAuthority('workforce.create', 'PERM_HR_EMPLOYEE_MANAGE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    @Operation(summary = "Tạo mới hồ sơ nhân công cố định")
    public ResponseEntity<EmployeeDetailResponse> createWorker(@Valid @RequestBody CreateEmployeeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.createEmployee(request));
    }

    @PutMapping("/workers/{id}")
    @PreAuthorize("hasAnyAuthority('workforce.create', 'PERM_HR_EMPLOYEE_MANAGE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')")
    @Operation(summary = "Cập nhật hồ sơ nhân công cố định")
    public ResponseEntity<EmployeeDetailResponse> updateWorker(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, request));
    }

    @PostMapping("/piecework")
    @Transactional
    @PreAuthorize("hasAnyAuthority('workforce.create', 'PERM_HR_EMPLOYEE_MANAGE', 'PERM_FINANCE_EXPENSE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')")
    @Operation(summary = "Ghi nhận công khoán / thời vụ gắn lứa nuôi")
    public ResponseEntity<PieceworkResponse> createPiecework(
            @PathVariable(required = false) Long farmId,
            @RequestBody CreatePieceworkRequest request) {

        BigDecimal qty = BigDecimal.valueOf(request.getQuantity() != null ? request.getQuantity() : 1);
        BigDecimal price = request.getUnitPrice() != null ? request.getUnitPrice() : BigDecimal.ZERO;
        BigDecimal total = qty.multiply(price);

        String code = "KHOAN-" + LocalDate.now().toString().replace("-", "").substring(2) + "-" + (System.currentTimeMillis() % 1000);

        boolean isPaidNow = Boolean.TRUE.equals(request.getPayNow());
        PieceworkResponse p = PieceworkResponse.builder()
                .id(System.currentTimeMillis())
                .contractCode(code)
                .workerName(request.getWorkerName())
                .phone(request.getPhone())
                .barnId(request.getBarnId())
                .barnName(request.getBarnName())
                .batchId(request.getBatchId())
                .batchName(request.getBatchName())
                .workDate(request.getWorkDate() != null ? request.getWorkDate() : LocalDate.now())
                .taskType(request.getTaskType())
                .quantity(request.getQuantity() != null ? request.getQuantity() : 1)
                .unit(request.getUnit() != null ? request.getUnit() : "Công")
                .unitPrice(price)
                .totalAmount(total)
                .paymentStatus(isPaidNow ? "PAID" : "UNPAID")
                .notes(request.getNotes())
                .build();

        PIECEWORK_LIST.add(0, p);

        if (isPaidNow && total.compareTo(BigDecimal.ZERO) > 0) {
            Long targetFarmId = (farmId != null && farmId > 0) ? farmId : 1L;
            Long tenantId = SecurityUtils.getCurrentTenantId() != null ? SecurityUtils.getCurrentTenantId() : 1L;
            FarmExpense expense = FarmExpense.builder()
                    .tenantId(tenantId)
                    .farmId(targetFarmId)
                    .costCategoryId(5L)
                    .expenseCode("PC-" + code)
                    .expenseSource("PIECEWORK")
                    .livestockGroupId(request.getBatchId())
                    .expenseDate(p.getWorkDate())
                    .amount(total)
                    .unitCostEligible(request.getBatchId() != null)
                    .paymentMethod(StringUtils.hasText(request.getPaymentMethod()) ? request.getPaymentMethod() : "TIEN_MAT")
                    .recipientName(request.getWorkerName())
                    .notes(String.format("Chi công khoán: %s (%s)", request.getTaskType(), request.getBarnName() != null ? request.getBarnName() : "Trang trại"))
                    .status("CONFIRMED")
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();
            farmExpenseRepository.save(expense);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(p);
    }

    @PostMapping("/advance")
    @Transactional
    @PreAuthorize("hasAnyAuthority('workforce.create', 'PERM_FINANCE_EXPENSE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')")
    @Operation(summary = "Ghi nhận tạm ứng lương nhân công và tự động sinh Phiếu Chi trên Sổ quỹ")
    public ResponseEntity<Map<String, Object>> advanceSalary(
            @PathVariable(required = false) Long farmId,
            @RequestBody AdvanceRequest request) {

        Long targetFarmId = (farmId != null && farmId > 0) ? farmId : 1L;
        Long tenantId = SecurityUtils.getCurrentTenantId() != null ? SecurityUtils.getCurrentTenantId() : 1L;

        if (request.getWorkerId() == null) {
            throw new BusinessException("INVALID_WORKER", "Vui lòng chọn nhân công cần tạm ứng");
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("INVALID_AMOUNT", "Số tiền tạm ứng phải lớn hơn 0");
        }

        Employee emp = employeeRepository.findById(request.getWorkerId())
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Không tìm thấy nhân viên #" + request.getWorkerId()));

        BigDecimal base = emp.getBaseSalary() != null ? emp.getBaseSalary() : new BigDecimal("7000000");
        BigDecimal totalMonthSalary = base.add(new BigDecimal("1000000"));
        List<FarmExpense> empExpenses = farmExpenseRepository.findByFarmId(targetFarmId);
        long latestPayoutId = empExpenses.stream()
                .filter(e -> "SALARY_PAYOUT".equalsIgnoreCase(e.getExpenseSource()) && emp.getId().equals(e.getReferenceId()) && e.getId() != null)
                .mapToLong(FarmExpense::getId)
                .max().orElse(0L);
        BigDecimal alreadyAdvanced = empExpenses.stream()
                .filter(e -> "SALARY_ADVANCE".equalsIgnoreCase(e.getExpenseSource()) && emp.getId().equals(e.getReferenceId()) && e.getId() != null && e.getId() > latestPayoutId)
                .map(e -> e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal remainingSalary = totalMonthSalary.subtract(alreadyAdvanced).max(BigDecimal.ZERO);
        if (request.getAmount().compareTo(remainingSalary) > 0) {
            throw new BusinessException("ADVANCE_EXCEEDS_SALARY",
                    String.format("Số tiền tạm ứng (%,.0f đ) vượt quá lương còn lại trong tháng của %s (%,.0f đ)",
                            request.getAmount(), emp.getFullName(), remainingSalary));
        }

        BigDecimal currentAdv = ADVANCE_MAP.getOrDefault(emp.getId(), BigDecimal.ZERO);
        ADVANCE_MAP.put(emp.getId(), currentAdv.add(request.getAmount()));

        // Tự động sinh Phiếu Chi Sổ quỹ
        FarmExpense expense = FarmExpense.builder()
                .tenantId(tenantId)
                .farmId(targetFarmId)
                .costCategoryId(5L) // LABOR
                .expenseCode("PC-UNG-" + emp.getId() + "-" + (System.currentTimeMillis() % 10000))
                .expenseSource("SALARY_ADVANCE")
                .referenceId(emp.getId())
                .expenseDate(request.getAdvanceDate() != null ? request.getAdvanceDate() : LocalDate.now())
                .amount(request.getAmount())
                .unitCostEligible(false)
                .paymentMethod(StringUtils.hasText(request.getPaymentMethod()) ? request.getPaymentMethod() : "TIEN_MAT")
                .recipientName(emp.getFullName())
                .notes(String.format("Tạm ứng lương tháng cho nhân viên %s (%s). Lý do: %s", emp.getFullName(), emp.getEmployeeCode(), request.getReason()))
                .status("CONFIRMED")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();
        farmExpenseRepository.save(expense);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("workerId", emp.getId());
        res.put("workerName", emp.getFullName());
        res.put("advanceAmount", request.getAmount());
        res.put("totalAdvance", ADVANCE_MAP.get(emp.getId()));
        res.put("expenseCode", expense.getExpenseCode());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/pay-salary")
    @Transactional
    @PreAuthorize("hasAnyAuthority('workforce.create', 'PERM_FINANCE_EXPENSE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')")
    @Operation(summary = "Chốt chi trả lương nhân công và tự động sinh Phiếu Chi trên Sổ quỹ")
    public ResponseEntity<Map<String, Object>> paySalary(
            @PathVariable(required = false) Long farmId,
            @RequestBody PaySalaryRequest request) {

        Long targetFarmId = (farmId != null && farmId > 0) ? farmId : 1L;
        Long tenantId = SecurityUtils.getCurrentTenantId() != null ? SecurityUtils.getCurrentTenantId() : 1L;

        if (request.getWorkerId() == null) {
            throw new BusinessException("INVALID_WORKER", "Vui lòng chọn nhân công cần chi trả lương");
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("INVALID_AMOUNT", "Số tiền chi trả lương phải lớn hơn 0");
        }

        Employee emp = employeeRepository.findById(request.getWorkerId())
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Không tìm thấy nhân viên #" + request.getWorkerId()));

        ADVANCE_MAP.remove(emp.getId()); // Đã quyết toán hết

        // Tự động sinh Phiếu Chi Sổ quỹ
        FarmExpense expense = FarmExpense.builder()
                .tenantId(tenantId)
                .farmId(targetFarmId)
                .costCategoryId(5L) // LABOR
                .expenseCode("PC-LUONG-" + emp.getId() + "-" + LocalDate.now().toString().replace("-", "").substring(2))
                .expenseSource("SALARY_PAYOUT")
                .referenceId(emp.getId())
                .expenseDate(request.getPayDate() != null ? request.getPayDate() : LocalDate.now())
                .amount(request.getAmount())
                .unitCostEligible(false)
                .paymentMethod(StringUtils.hasText(request.getPaymentMethod()) ? request.getPaymentMethod() : "BANK_TRANSFER")
                .recipientName(emp.getFullName())
                .notes(String.format("Chi trả quyết toán lương tháng cho %s (%s). %s", emp.getFullName(), emp.getEmployeeCode(), request.getNotes() != null ? request.getNotes() : ""))
                .status("CONFIRMED")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();
        farmExpenseRepository.save(expense);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("workerId", emp.getId());
        res.put("workerName", emp.getFullName());
        res.put("paidAmount", request.getAmount());
        res.put("expenseCode", expense.getExpenseCode());
        return ResponseEntity.ok(res);
    }
}
