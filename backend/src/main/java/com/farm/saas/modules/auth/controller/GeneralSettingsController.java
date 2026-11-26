package com.farm.saas.modules.auth.controller;

import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.dto.request.CreateCustomRoleRequest;
import com.farm.saas.modules.auth.dto.request.CreateSubscriptionOrderRequest;
import com.farm.saas.modules.auth.dto.request.FarmMemberRequest;
import com.farm.saas.modules.auth.dto.request.UpdateCustomRoleRequest;
import com.farm.saas.modules.auth.dto.response.FarmMemberResponse;
import com.farm.saas.modules.auth.dto.response.RoleMatrixResponse;
import com.farm.saas.modules.auth.dto.response.SubscriptionOrderDetailResponse;
import com.farm.saas.modules.auth.entity.FarmAddOnSubscription;
import com.farm.saas.modules.auth.entity.Role;
import com.farm.saas.modules.auth.repository.FarmAddOnSubscriptionRepository;
import com.farm.saas.modules.auth.repository.RoleRepository;
import com.farm.saas.modules.auth.service.SubscriptionOrderService;
import com.farm.saas.modules.auth.service.UserService;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.platform.entity.PlatformPackage;
import com.farm.saas.modules.platform.repository.PlatformPackageRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "General Settings & Subscriptions", description = "Quản lý 6 mục Thiết lập chung, Vai trò SCRUD và Gói cước VNPAY")
public class GeneralSettingsController {

    private final FarmRepository farmRepository;
    private final FarmAddOnSubscriptionRepository addonRepository;
    private final SubscriptionOrderService subscriptionOrderService;
    private final PlatformPackageRepository platformPackageRepository;
    private final UserService userService;
    private final RoleRepository roleRepository;

    // =========================================================================
    // MỤC 1: THÔNG TIN DỊCH VỤ & KHO ỨNG DỤNG ADD-ONS
    // =========================================================================

    @GetMapping("/settings/service")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy hồ sơ cơ sở và danh sách dịch vụ mở rộng (Add-ons)")
    public ResponseEntity<Map<String, Object>> getServiceSettings(
            @RequestParam(required = false) Long farmId) {
        Long targetFarmId = resolveFarmId(farmId);
        Farm farm = farmRepository.findById(targetFarmId).orElse(null);

        List<FarmAddOnSubscription> subs = addonRepository.findByFarmId(targetFarmId);
        Map<String, FarmAddOnSubscription> subMap = new HashMap<>();
        for (FarmAddOnSubscription s : subs) {
            subMap.put(s.getAddonCode().toUpperCase(), s);
        }

        List<PlatformPackage> packages = platformPackageRepository.findAll();
        Map<String, PlatformPackage> pkgMap = new HashMap<>();
        for (PlatformPackage p : packages) {
            pkgMap.put(p.getPackageCode().toUpperCase(), p);
        }

        List<String> coreAddonCodes = List.of("BRANCHES", "CUSTOM_ROLES", "PAYROLL", "BREEDING", "POULTRY_HATCHERY", "FEED_MILL");
        List<Map<String, Object>> addonList = new ArrayList<>();

        for (String code : coreAddonCodes) {
            FarmAddOnSubscription sub = subMap.get(code);
            PlatformPackage pkg = pkgMap.get(code);

            boolean isEnabled = sub != null && "ACTIVE".equalsIgnoreCase(sub.getStatus());
            Instant expiresAt = sub != null ? sub.getExpiresAt() : null;

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("addonCode", code);
            item.put("name", pkg != null ? pkg.getName() : code);
            item.put("category", pkg != null ? pkg.getCategory() : "Mở rộng");
            item.put("isEnabled", isEnabled);
            item.put("status", isEnabled ? "ACTIVE" : "INACTIVE");
            item.put("expiresAt", expiresAt);
            item.put("halfYearPrice", pkg != null ? pkg.getHalfYearPrice() : new BigDecimal("2800000"));
            item.put("yearlyPrice", pkg != null ? pkg.getYearlyPrice() : new BigDecimal("5000000"));
            item.put("description", pkg != null ? pkg.getDescription() : "");

            addonList.add(item);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("farmId", targetFarmId);
        result.put("facilityName", farm != null ? farm.getName() : "Trang trại FarmGo");
        result.put("businessName", farm != null && farm.getBusinessName() != null ? farm.getBusinessName() : "Hộ kinh doanh FarmGo");
        result.put("businessType", farm != null && farm.getFarmType() != null ? farm.getFarmType() : "INDIVIDUAL");
        result.put("taxCode", farm != null ? farm.getTaxCode() : "0318999888");
        result.put("phone", farm != null && farm.getPhone() != null ? farm.getPhone() : "0912 345 678");
        result.put("address", farm != null && farm.getAddress() != null ? farm.getAddress() : "Khu nông nghiệp công nghệ cao");
        result.put("veterinaryCode", farm != null && farm.getVeterinaryCode() != null ? farm.getVeterinaryCode() : "VN-TY-2026-088");
        result.put("managerName", farm != null && farm.getManagerName() != null ? farm.getManagerName() : "Nguyễn Sĩ Phúc");
        result.put("addons", addonList);

        return ResponseEntity.ok(result);
    }

    @PutMapping("/settings/service")
    @PreAuthorize("hasAuthority('general_settings.manage') or hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')")
    @Operation(summary = "Cập nhật hồ sơ trang trại (tên cơ sở, mã vùng nuôi, SĐT...)")
    public ResponseEntity<Map<String, Object>> updateServiceSettings(
            @RequestParam(required = false) Long farmId,
            @RequestBody Map<String, Object> body) {
        Long targetFarmId = resolveFarmId(farmId);
        Farm farm = farmRepository.findById(targetFarmId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FARM_NOT_FOUND", "Không tìm thấy trang trại ID: " + targetFarmId));

        if (body.containsKey("facilityName") && body.get("facilityName") != null) farm.setName(body.get("facilityName").toString().trim());
        if (body.containsKey("businessName") && body.get("businessName") != null) farm.setBusinessName(body.get("businessName").toString().trim());
        if (body.containsKey("phone") && body.get("phone") != null) farm.setPhone(body.get("phone").toString().trim());
        if (body.containsKey("address") && body.get("address") != null) farm.setAddress(body.get("address").toString().trim());
        if (body.containsKey("veterinaryCode") && body.get("veterinaryCode") != null) farm.setVeterinaryCode(body.get("veterinaryCode").toString().trim());
        if (body.containsKey("managerName") && body.get("managerName") != null) farm.setManagerName(body.get("managerName").toString().trim());
        if (body.containsKey("taxCode") && body.get("taxCode") != null) farm.setTaxCode(body.get("taxCode").toString().trim());
        if (body.containsKey("businessType") && body.get("businessType") != null) farm.setFarmType(body.get("businessType").toString().trim());

        farm.setUpdatedAt(Instant.now());
        farmRepository.save(farm);

        return getServiceSettings(targetFarmId);
    }

    @GetMapping("/subscriptions/add-ons")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy trạng thái danh sách 6 dịch vụ mở rộng Add-on")
    public ResponseEntity<List<FarmAddOnSubscription>> getAddons(
            @RequestParam(required = false) Long farmId) {
        Long targetFarmId = resolveFarmId(farmId);
        return ResponseEntity.ok(addonRepository.findByFarmId(targetFarmId));
    }

    @PostMapping("/subscriptions/checkout")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Tạo đơn hàng thanh toán VNPAY Sandbox cho gói Add-on")
    public ResponseEntity<SubscriptionOrderDetailResponse> checkoutSubscription(
            @RequestParam(required = false) Long farmId,
            @Valid @RequestBody CreateSubscriptionOrderRequest request,
            HttpServletRequest httpRequest) {
        Long targetFarmId = resolveFarmId(farmId);
        return ResponseEntity.ok(subscriptionOrderService.createCheckoutOrder(targetFarmId, request, httpRequest));
    }

    @PostMapping("/subscriptions/{orderNo}/simulate-webhook")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER')")
    @Operation(summary = "Giả lập tín hiệu Webhook VNPAY thành công (Hỗ trợ demo offline)")
    public ResponseEntity<SubscriptionOrderDetailResponse> simulateWebhook(
            @PathVariable String orderNo) {
        return ResponseEntity.ok(subscriptionOrderService.mockSuccess(orderNo.trim()));
    }

    // =========================================================================
    // MỤC 2: QUYỀN HẠN NGƯỜI DÙNG (MEMBERS)
    // =========================================================================

    @GetMapping("/settings/members")
    @PreAuthorize("hasAuthority('general_settings.view') or hasAuthority('general_settings.manage') or hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')")
    @Operation(summary = "Danh sách thành viên trang trại kèm vai trò và phạm vi chuồng")
    public ResponseEntity<List<FarmMemberResponse>> getMembers(
            @RequestParam(required = false) Long farmId) {
        Long targetFarmId = resolveFarmId(farmId);
        return ResponseEntity.ok(userService.getFarmMembers(targetFarmId));
    }

    @PostMapping("/settings/members")
    @PreAuthorize("hasAuthority('general_settings.manage') or hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')")
    @Operation(summary = "Mời hoặc tạo tài khoản nhân sự mới, gán vai trò và chuồng nuôi")
    public ResponseEntity<FarmMemberResponse> upsertMember(
            @RequestParam(required = false) Long farmId,
            @Valid @RequestBody FarmMemberRequest request) {
        Long targetFarmId = resolveFarmId(farmId);
        return ResponseEntity.ok(userService.upsertFarmMember(targetFarmId, request));
    }

    @DeleteMapping("/settings/members/{userId}")
    @PreAuthorize("hasAuthority('general_settings.manage') or hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')")
    @Operation(summary = "Gỡ nhân sự khỏi trang trại")
    public ResponseEntity<Void> removeMember(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long userId) {
        Long targetFarmId = resolveFarmId(farmId);
        userService.removeFarmMember(targetFarmId, userId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // MỤC 3, 4, 5: KHO VAI TRÒ CHUYÊN MÔN (ROLES & SCRUD MATRIX)
    // =========================================================================

    @GetMapping("/settings/roles")
    @PreAuthorize("hasAuthority('general_settings.view') or hasAuthority('general_settings.manage') or hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')")
    @Operation(summary = "Lấy danh sách các nhóm vai trò kèm ma trận quyền SCRUD")
    public ResponseEntity<List<RoleMatrixResponse>> getRoles(
            @RequestParam(required = false) Long farmId) {
        Long targetFarmId = resolveFarmId(farmId);
        return ResponseEntity.ok(userService.getRolesForFarm(targetFarmId));
    }

    @PostMapping("/settings/roles")
    @PreAuthorize("hasAuthority('general_settings.manage') or hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')")
    @Operation(summary = "Tạo vai trò tùy chỉnh mới")
    public ResponseEntity<RoleMatrixResponse> createRole(
            @RequestParam(required = false) Long farmId,
            @Valid @RequestBody CreateCustomRoleRequest request) {
        Long targetFarmId = resolveFarmId(farmId);
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createCustomRole(targetFarmId, request));
    }

    @PutMapping("/settings/roles/{roleId}")
    @PreAuthorize("hasAuthority('general_settings.manage') or hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')")
    @Operation(summary = "Chỉnh sửa ma trận quyền của vai trò")
    public ResponseEntity<RoleMatrixResponse> updateRole(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long roleId,
            @Valid @RequestBody UpdateCustomRoleRequest request) {
        Long targetFarmId = resolveFarmId(farmId);
        Role r = roleRepository.findById(roleId).orElse(null);
        if (r != null && ("ROLE_FARM_OWNER".equalsIgnoreCase(r.getCode()) || "ROLE_FARM_OWNER".equalsIgnoreCase(r.getName()) || Boolean.TRUE.equals(r.getIsSystem()))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "CANNOT_MODIFY_OWNER", "Không được phép thay đổi ma trận quyền của vai trò hệ thống hoặc Chủ trang trại.");
        }
        return ResponseEntity.ok(userService.updateCustomRole(targetFarmId, roleId, request));
    }

    @DeleteMapping("/settings/roles/{roleId}")
    @PreAuthorize("hasAuthority('general_settings.manage') or hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_FARM_OWNER')")
    @Operation(summary = "Xóa vai trò tùy chỉnh")
    public ResponseEntity<Void> deleteRole(
            @RequestParam(required = false) Long farmId,
            @PathVariable Long roleId) {
        Long targetFarmId = resolveFarmId(farmId);
        Role r = roleRepository.findById(roleId).orElse(null);
        if (r != null && ("ROLE_FARM_OWNER".equalsIgnoreCase(r.getName()) || "ROLE_SUPER_ADMIN".equalsIgnoreCase(r.getName()))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "CANNOT_DELETE_SYSTEM_ROLE", "Không thể xóa vai trò mặc định của hệ thống.");
        }
        userService.deleteCustomRole(targetFarmId, roleId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // HELPER
    // =========================================================================
    private Long resolveFarmId(Long farmId) {
        if (farmId != null && farmId > 0) return farmId;
        Long tid = SecurityUtils.getCurrentTenantId();
        return (tid != null && tid > 0) ? tid : 1L;
    }
}
