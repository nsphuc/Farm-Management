package com.farm.saas.modules.addons.controller;

import com.farm.saas.common.security.FarmSecurityEvaluator;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.addons.dto.AddonsDto.*;
import com.farm.saas.modules.addons.entity.*;
import com.farm.saas.modules.addons.service.AddonsOperationsService;
import com.farm.saas.modules.auth.dto.request.CreateCustomRoleRequest;
import com.farm.saas.modules.auth.dto.request.UpdateCustomRoleRequest;
import com.farm.saas.modules.auth.dto.response.RoleMatrixResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/addons")
@RequiredArgsConstructor
@Tag(name = "Addon Modules", description = "Các phân hệ mở rộng SaaS: Lương KPI, Vai trò tùy chỉnh, Nái sinh sản, Ấp nở trứng, Sản xuất cám")
public class AddonsOperationsController {

    private final AddonsOperationsService addonsService;
    private final FarmSecurityEvaluator farmSecurity;

    private Long resolveFarmId(Long farmId) {
        Long resolved = (farmId != null && farmId > 0)
                ? farmId
                : (SecurityUtils.getCurrentTenantId() != null && SecurityUtils.getCurrentTenantId() > 0
                        ? SecurityUtils.getCurrentTenantId() : 1L);
        farmSecurity.assertFarmAccess(resolved);
        return resolved;
    }

    // =========================================================================
    // 1. LƯƠNG & CHẤM CÔNG KPI (/api/v1/addons/payroll/*)
    // =========================================================================

    @GetMapping("/payroll/sheets")
    @PreAuthorize("hasAnyAuthority('payroll.view', 'payroll.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Lấy danh sách bảng tính lương nhân viên theo kỳ và chi nhánh")
    public ResponseEntity<List<PayrollSheet>> getPayrollSheets(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false, defaultValue = "2026-11") String periodMonth) {
        return ResponseEntity.ok(addonsService.getPayrollSheets(resolveFarmId(farmId), branchId, periodMonth));
    }

    @PutMapping("/payroll/sheets/{id}")
    @PreAuthorize("hasAuthority('payroll.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Cập nhật ngày công thực tế, thưởng KPI, phụ cấp, tạm ứng")
    public ResponseEntity<PayrollSheet> updatePayrollSheet(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id,
            @RequestBody UpdatePayrollRequest request) {
        return ResponseEntity.ok(addonsService.updatePayrollSheet(resolveFarmId(farmId), id, request));
    }

    @PostMapping("/payroll/close-and-pay")
    @PreAuthorize("hasAuthority('payroll.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Chốt bảng lương & chi trả (tự động tạo Phiếu chi sổ quỹ)")
    public ResponseEntity<Void> closeAndPayPayroll(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false, defaultValue = "2026-11") String periodMonth,
            @RequestBody(required = false) ClosePayrollRequest request) {
        addonsService.closeAndPayPayroll(resolveFarmId(farmId), branchId, periodMonth,
                request != null ? request : new ClosePayrollRequest());
        return ResponseEntity.ok().build();
    }

    // =========================================================================
    // 2. MỞ RỘNG VAI TRÒ TÙY CHỈNH (/api/v1/addons/custom-roles/*)
    // =========================================================================

    @GetMapping("/custom-roles")
    @PreAuthorize("hasAnyAuthority('roles.view', 'roles.manage', 'general_settings.view', 'general_settings.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Lấy danh sách các vai trò tùy chỉnh kèm ma trận quyền")
    public ResponseEntity<List<RoleMatrixResponse>> getCustomRoles(
            @RequestParam(required = false) Long farmId) {
        return ResponseEntity.ok(addonsService.getCustomRoles(resolveFarmId(farmId)));
    }

    @GetMapping("/custom-roles/permissions")
    @PreAuthorize("hasAnyAuthority('roles.view', 'roles.manage', 'general_settings.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Lấy danh sách toàn bộ quyền hạn hệ thống để gán cho vai trò tùy chỉnh")
    public ResponseEntity<List<RoleMatrixResponse.PermissionDto>> getCustomRolePermissions(
            @RequestParam(required = false) Long farmId) {
        return ResponseEntity.ok(addonsService.getAllPermissions(resolveFarmId(farmId)));
    }

    @PostMapping("/custom-roles")
    @PreAuthorize("hasAuthority('roles.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Tạo mới vai trò tùy chỉnh")
    public ResponseEntity<RoleMatrixResponse> createCustomRole(
            @RequestParam(required = false) Long farmId,
            @Valid @RequestBody CreateCustomRoleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(addonsService.createCustomRole(resolveFarmId(farmId), request));
    }

    @PutMapping("/custom-roles/{id}")
    @PreAuthorize("hasAuthority('roles.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Cập nhật vai trò tùy chỉnh")
    public ResponseEntity<RoleMatrixResponse> updateCustomRole(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomRoleRequest request) {
        return ResponseEntity.ok(addonsService.updateCustomRole(resolveFarmId(farmId), id, request));
    }

    @DeleteMapping("/custom-roles/{id}")
    @PreAuthorize("hasAuthority('roles.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Xóa vai trò tùy chỉnh")
    public ResponseEntity<Void> deleteCustomRole(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id) {
        addonsService.deleteCustomRole(resolveFarmId(farmId), id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // 3. GIA SÚC SINH SẢN THEO THẺ TAI (/api/v1/addons/breeding/*)
    // =========================================================================

    @GetMapping("/breeding/summary")
    @PreAuthorize("hasAnyAuthority('breeding.view', 'breeding.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Chỉ số tổng quan đàn nái sinh sản")
    public ResponseEntity<BreedingSummaryResponse> getBreedingSummary(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(addonsService.getBreedingSummary(resolveFarmId(farmId), branchId));
    }

    @GetMapping("/breeding/animals")
    @PreAuthorize("hasAnyAuthority('breeding.view', 'breeding.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Danh sách cá thể nái theo thẻ tai")
    public ResponseEntity<List<BreedingAnimal>> getBreedingAnimals(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(addonsService.getBreedingAnimals(resolveFarmId(farmId), branchId, status, keyword));
    }

    @PostMapping("/breeding/animals")
    @PreAuthorize("hasAuthority('breeding.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Thêm mới cá thể nái / bò giống")
    public ResponseEntity<BreedingAnimal> createBreedingAnimal(
            @RequestParam(required = false) Long farmId,
            @RequestBody BreedingAnimalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(addonsService.createBreedingAnimal(resolveFarmId(farmId), request));
    }

    @PutMapping("/breeding/animals/{id}")
    @PreAuthorize("hasAuthority('breeding.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Cập nhật thông tin cá thể")
    public ResponseEntity<BreedingAnimal> updateBreedingAnimal(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id,
            @RequestBody BreedingAnimalRequest request) {
        return ResponseEntity.ok(addonsService.updateBreedingAnimal(resolveFarmId(farmId), id, request));
    }

    @PostMapping("/breeding/animals/{id}/record-event")
    @PreAuthorize("hasAuthority('breeding.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Ghi nhận sự kiện phối giống hoặc đẻ con")
    public ResponseEntity<BreedingAnimal> recordBreedingEvent(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id,
            @RequestBody BreedingEventRequest request) {
        return ResponseEntity.ok(addonsService.recordBreedingEvent(resolveFarmId(farmId), id, request));
    }

    @DeleteMapping("/breeding/animals/{id}")
    @PreAuthorize("hasAuthority('breeding.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Xóa cá thể")
    public ResponseEntity<Void> deleteBreedingAnimal(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id) {
        addonsService.deleteBreedingAnimal(resolveFarmId(farmId), id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // 4. ẤP NỞ & TRỨNG GIỐNG (/api/v1/addons/hatchery/*)
    // =========================================================================

    @GetMapping("/hatchery/summary")
    @PreAuthorize("hasAnyAuthority('poultry_hatchery.view', 'poultry_hatchery.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Chỉ số tổng quan trạm ấp trứng")
    public ResponseEntity<HatcherySummaryResponse> getHatcherySummary(
            @RequestParam(required = false) Long farmId) {
        return ResponseEntity.ok(addonsService.getHatcherySummary(resolveFarmId(farmId)));
    }

    @GetMapping("/hatchery/batches")
    @PreAuthorize("hasAnyAuthority('poultry_hatchery.view', 'poultry_hatchery.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Danh sách các mẻ ấp trứng")
    public ResponseEntity<List<HatcheryBatch>> getHatcheryBatches(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String eggType) {
        return ResponseEntity.ok(addonsService.getHatcheryBatches(resolveFarmId(farmId), branchId, status, eggType));
    }

    @PostMapping("/hatchery/batches")
    @PreAuthorize("hasAuthority('poultry_hatchery.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Tạo mẻ ấp mới")
    public ResponseEntity<HatcheryBatch> createHatcheryBatch(
            @RequestParam(required = false) Long farmId,
            @RequestBody CreateHatcheryBatchRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(addonsService.createHatcheryBatch(resolveFarmId(farmId), request));
    }

    @PutMapping("/hatchery/batches/{id}/candling")
    @PreAuthorize("hasAuthority('poultry_hatchery.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Cập nhật kết quả soi trứng có phôi")
    public ResponseEntity<HatcheryBatch> updateCandling(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id,
            @RequestParam Integer fertileEggs) {
        return ResponseEntity.ok(addonsService.updateCandling(resolveFarmId(farmId), id, fertileEggs));
    }

    @PostMapping("/hatchery/batches/{id}/finalize")
    @PreAuthorize("hasAuthority('poultry_hatchery.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Chốt nở và chuyển con giống sang chuồng nuôi")
    public ResponseEntity<HatcheryBatch> finalizeHatch(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id,
            @RequestBody FinalizeHatchRequest request) {
        return ResponseEntity.ok(addonsService.finalizeHatch(resolveFarmId(farmId), id, request));
    }

    @DeleteMapping("/hatchery/batches/{id}")
    @PreAuthorize("hasAuthority('poultry_hatchery.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Xóa mẻ ấp")
    public ResponseEntity<Void> deleteHatcheryBatch(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id) {
        addonsService.deleteHatcheryBatch(resolveFarmId(farmId), id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // 5. SẢN XUẤT CÁM TỰ TRỘN (/api/v1/addons/feed-production/*)
    // =========================================================================

    @GetMapping("/feed-production/boms")
    @PreAuthorize("hasAnyAuthority('feed_mill.view', 'feed_mill.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Danh sách công thức phối trộn thức ăn (BOM)")
    public ResponseEntity<List<FeedProductionBom>> getBoms(
            @RequestParam(required = false) Long farmId) {
        return ResponseEntity.ok(addonsService.getBoms(resolveFarmId(farmId)));
    }

    @PostMapping("/feed-production/boms")
    @PreAuthorize("hasAuthority('feed_mill.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Tạo công thức phối trộn mới")
    public ResponseEntity<FeedProductionBom> createBom(
            @RequestParam(required = false) Long farmId,
            @RequestBody CreateFeedBomRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(addonsService.createBom(resolveFarmId(farmId), request));
    }

    @PutMapping("/feed-production/boms/{id}")
    @PreAuthorize("hasAuthority('feed_mill.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Cập nhật công thức BOM")
    public ResponseEntity<FeedProductionBom> updateBom(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id,
            @RequestBody CreateFeedBomRequest request) {
        return ResponseEntity.ok(addonsService.updateBom(resolveFarmId(farmId), id, request));
    }

    @DeleteMapping("/feed-production/boms/{id}")
    @PreAuthorize("hasAuthority('feed_mill.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Xóa công thức BOM")
    public ResponseEntity<Void> deleteBom(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long id) {
        addonsService.deleteBom(resolveFarmId(farmId), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/feed-production/orders")
    @PreAuthorize("hasAnyAuthority('feed_mill.view', 'feed_mill.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Lịch sử các lệnh trộn cám đã thực hiện")
    public ResponseEntity<List<FeedProductionOrder>> getFeedOrders(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(addonsService.getFeedOrders(resolveFarmId(farmId), branchId));
    }

    @PostMapping("/feed-production/orders")
    @PreAuthorize("hasAuthority('feed_mill.manage') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Thực hiện lệnh trộn cám (tự động cộng kho cám thành phẩm)")
    public ResponseEntity<FeedProductionOrder> executeFeedOrder(
            @RequestParam(required = false) Long farmId,
            @RequestBody ExecuteFeedOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(addonsService.executeFeedOrder(resolveFarmId(farmId), request));
    }
}
