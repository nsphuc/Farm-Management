package com.farm.saas.modules.platform.controller;

import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.FarmAddOnSubscription;
import com.farm.saas.modules.auth.entity.SubscriptionOrder;
import com.farm.saas.modules.auth.repository.FarmAddOnSubscriptionRepository;
import com.farm.saas.modules.auth.repository.SubscriptionOrderRepository;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.ZoneLocationRepository;
import com.farm.saas.modules.platform.entity.PlatformPackage;
import com.farm.saas.modules.platform.repository.PlatformPackageRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/platform")
@RequiredArgsConstructor
@Tag(name = "Super Admin Platform Portal", description = "Cổng Quản trị Super Admin điều hành nền tảng SaaS")
public class SuperAdminPortalController {

    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final SubscriptionOrderRepository subscriptionOrderRepository;
    private final FarmAddOnSubscriptionRepository addonRepository;
    private final PlatformPackageRepository platformPackageRepository;
    private final ZoneLocationRepository zoneLocationRepository;

    // =========================================================================
    // 1. DASHBOARD OVERVIEW
    // =========================================================================

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN') or hasAuthority('PERM_TENANT_MANAGE')")
    @Operation(summary = "Thống kê tổng quan nền tảng SaaS dành cho Super Admin")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        List<Farm> allFarms = farmRepository.findAll();
        long totalFarms = allFarms.size();
        long totalUsers = userRepository.count();

        List<SubscriptionOrder> allOrders = subscriptionOrderRepository.findAll();
        BigDecimal totalRevenue = allOrders.stream()
                .filter(o -> "PAID".equalsIgnoreCase(o.getStatus()))
                .map(o -> o.getAmount() != null ? o.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingOrders = allOrders.stream().filter(o -> "PENDING".equalsIgnoreCase(o.getStatus())).count();
        long failedOrders = allOrders.stream().filter(o -> "FAILED".equalsIgnoreCase(o.getStatus())).count();
        long activeSubscriptions = allOrders.stream().filter(o -> "PAID".equalsIgnoreCase(o.getStatus())).count();

        List<Map<String, Object>> revenueChart = List.of(
                Map.of("month", "Tháng 6", "revenue", 26500000, "display", "26.5M"),
                Map.of("month", "Tháng 7", "revenue", 34200000, "display", "34.2M"),
                Map.of("month", "Tháng 8", "revenue", 48900000, "display", "48.9M"),
                Map.of("month", "Tháng 9", "revenue", 61500000, "display", "61.5M"),
                Map.of("month", "Tháng 10", "revenue", 74000000, "display", "74.0M"),
                Map.of("month", "Tháng 11", "revenue", totalRevenue.longValue(), "display", String.format("%.1fM", totalRevenue.doubleValue() / 1_000_000.0))
        );

        long indCount = allFarms.stream().filter(f -> f.getFarmType() == null || "INDIVIDUAL".equalsIgnoreCase(f.getFarmType())).count();
        long entCount = allFarms.stream().filter(f -> "ENTERPRISE".equalsIgnoreCase(f.getFarmType())).count();
        long hhCount = allFarms.stream().filter(f -> "HOUSEHOLD".equalsIgnoreCase(f.getFarmType())).count();
        long denom = Math.max(1L, totalFarms);

        List<Map<String, Object>> farmTypeData = List.of(
                Map.of("name", "Cá nhân kinh doanh", "value", Math.round(indCount * 100.0 / denom), "color", "#10B981", "count", indCount + " trại"),
                Map.of("name", "Doanh nghiệp / HTX", "value", Math.round(entCount * 100.0 / denom), "color", "#3B82F6", "count", entCount + " trại"),
                Map.of("name", "Hộ kinh doanh", "value", Math.round(hhCount * 100.0 / denom), "color", "#F59E0B", "count", hhCount + " trại")
        );

        Map<Long, Farm> farmMap = new HashMap<>();
        for (Farm f : allFarms) {
            farmMap.put(f.getId(), f);
        }

        List<Map<String, Object>> recentActivities = allOrders.stream()
                .sorted(Comparator.comparing(SubscriptionOrder::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .map(o -> {
                    Farm f = o.getFarmId() != null ? farmMap.get(o.getFarmId()) : null;
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", o.getId());
                    m.put("farmName", f != null ? f.getName() : ("Trang trại #" + o.getFarmId()));
                    m.put("farmCode", f != null && f.getCode() != null ? f.getCode() : o.getOrderCode());
                    m.put("action", (o.getAddonCode() != null ? o.getAddonCode() : "Dịch vụ") + " (" + (o.getDurationMonths() != null ? o.getDurationMonths() : 12) + " tháng)");
                    m.put("amount", o.getAmount() != null ? o.getAmount() : BigDecimal.ZERO);
                    m.put("gateway", o.getPaymentGateway() != null ? o.getPaymentGateway() : "VNPAY");
                    m.put("status", o.getStatus() != null ? o.getStatus() : "PENDING");
                    m.put("time", o.getPaidAt() != null ? o.getPaidAt().toString().substring(0, 10) : (o.getCreatedAt() != null ? o.getCreatedAt().toString().substring(0, 10) : ""));
                    return m;
                })
                .toList();

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("totalFarms", totalFarms);
        res.put("totalUsers", totalUsers);
        res.put("totalRevenue", totalRevenue);
        res.put("pendingOrders", pendingOrders);
        res.put("failedOrders", failedOrders);
        res.put("activeSubscriptions", activeSubscriptions);
        res.put("growthRate", 18.5);
        res.put("revenueChart", revenueChart);
        res.put("farmTypeDistribution", farmTypeData);
        res.put("recentActivities", recentActivities);

        return ResponseEntity.ok(res);
    }

    // =========================================================================
    // 2. TENANTS MANAGEMENT
    // =========================================================================

    @GetMapping("/tenants")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN') or hasAuthority('PERM_TENANT_MANAGE')")
    @Operation(summary = "Danh sách trang trại đăng ký trên nền tảng")
    public ResponseEntity<List<Map<String, Object>>> getTenants() {
        List<Farm> farms = farmRepository.findAll();
        List<Map<String, Object>> list = new ArrayList<>();

        for (Farm f : farms) {
            long barnCount = zoneLocationRepository.findAll().stream()
                    .filter(b -> b.getZoneId() != null)
                    .count();

            Instant exp = f.getDemoExpiresAt() != null ? f.getDemoExpiresAt() : Instant.now().plus(120, ChronoUnit.DAYS);

            List<String> enabledAddons = addonRepository.findByFarmId(f.getId()).stream()
                    .filter(a -> "ACTIVE".equalsIgnoreCase(a.getStatus()))
                    .map(FarmAddOnSubscription::getAddonCode)
                    .toList();

            String formattedCode = f.getCode() != null ? f.getCode() : ("FARM-" + String.format("%03d", f.getId()));
            String subdomain = formattedCode.toLowerCase().replace("-", "") + ".farmgo.vn";
            String busType = f.getBusinessName() != null && !f.getBusinessName().isBlank() ? f.getBusinessName() :
                    ("ENTERPRISE".equalsIgnoreCase(f.getFarmType()) ? "Doanh nghiệp chuỗi" :
                            ("HOUSEHOLD".equalsIgnoreCase(f.getFarmType()) ? "Hộ kinh doanh" : "Cá nhân kinh doanh"));

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", f.getId());
            map.put("code", formattedCode);
            map.put("name", f.getName());
            map.put("subdomain", subdomain);
            map.put("ownerName", f.getManagerName() != null ? f.getManagerName() : "Nguyễn Sĩ Phúc");
            map.put("ownerPhone", f.getPhone() != null ? f.getPhone() : "0912 888 999");
            map.put("phone", f.getPhone() != null ? f.getPhone() : "0912 888 999");
            map.put("ownerEmail", "owner" + f.getId() + "@farmgo.vn");
            map.put("businessType", busType);
            map.put("scale", "1 Chi nhánh / " + (barnCount > 0 ? barnCount : 6) + " Chuồng");
            map.put("planType", f.getSubscriptionTier() != null ? f.getSubscriptionTier() : "Gói Cá nhân Tiêu chuẩn");
            map.put("address", f.getAddress() != null ? f.getAddress() : "Việt Nam");
            map.put("type", f.getFarmType() != null ? f.getFarmType() : "INDIVIDUAL");
            map.put("tier", f.getSubscriptionTier() != null ? f.getSubscriptionTier() : "Tiêu chuẩn (Starter)");
            map.put("enabledAddons", enabledAddons);
            map.put("status", "INACTIVE".equalsIgnoreCase(f.getStatus()) ? "LOCKED" : "ACTIVE");
            map.put("barnsCount", barnCount > 0 ? barnCount : 6);
            map.put("usersCount", 3);
            map.put("expiresAt", exp);
            map.put("expiredAt", exp.toString().length() >= 10 ? exp.toString().substring(0, 10) : exp.toString());
            map.put("createdAt", f.getCreatedAt() != null ? f.getCreatedAt() : Instant.now());
            list.add(map);
        }

        return ResponseEntity.ok(list);
    }

    @PutMapping("/tenants/{id}/status")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN') or hasAuthority('PERM_TENANT_MANAGE')")
    @Operation(summary = "Khóa hoặc mở khóa hoạt động trang trại")
    public ResponseEntity<Map<String, Object>> updateTenantStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Farm farm = farmRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FARM_NOT_FOUND", "Không tìm thấy trang trại ID: " + id));

        String status = body.get("status") != null ? body.get("status").toString().trim().toUpperCase() : "ACTIVE";
        String normalizedStatus = ("LOCKED".equals(status) || "INACTIVE".equals(status)) ? "INACTIVE" : "ACTIVE";
        farm.setStatus(normalizedStatus);
        farm.setUpdatedAt(Instant.now());
        farmRepository.save(farm);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", farm.getId());
        res.put("status", "INACTIVE".equals(normalizedStatus) ? "LOCKED" : "ACTIVE");
        res.put("message", "Cập nhật trạng thái trang trại thành công.");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/tenants/{id}/renew")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN') or hasAuthority('PERM_TENANT_MANAGE')")
    @Operation(summary = "Gia hạn thủ công gói cước cho trang trại")
    public ResponseEntity<Map<String, Object>> renewTenant(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Farm farm = farmRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FARM_NOT_FOUND", "Không tìm thấy trang trại ID: " + id));

        int months = 6;
        if (body.containsKey("months") && body.get("months") != null) {
            try {
                months = Integer.parseInt(body.get("months").toString());
            } catch (Exception ignored) {}
        }

        Instant currentExp = farm.getDemoExpiresAt() != null ? farm.getDemoExpiresAt() : Instant.now();
        if (currentExp.isBefore(Instant.now())) {
            currentExp = Instant.now();
        }
        Instant newExp = currentExp.plus(months * 30L, ChronoUnit.DAYS);
        farm.setDemoExpiresAt(newExp);
        farm.setUpdatedAt(Instant.now());
        farmRepository.save(farm);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", farm.getId());
        res.put("newExpiresAt", newExp);
        res.put("addedMonths", months);
        res.put("message", "Đã gia hạn thành công thêm " + months + " tháng.");
        return ResponseEntity.ok(res);
    }

    // =========================================================================
    // 3. PACKAGES PRICING & STATUS
    // =========================================================================

    @GetMapping("/packages")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN') or hasAuthority('PERM_TENANT_MANAGE') or isAuthenticated()")
    @Operation(summary = "Danh sách gói niêm yết và 6 Add-ons")
    public ResponseEntity<List<PlatformPackage>> getPackages() {
        List<PlatformPackage> list = platformPackageRepository.findAll();
        return ResponseEntity.ok(list);
    }

    @PutMapping("/packages/{code}")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN') or hasAuthority('PERM_TENANT_MANAGE')")
    @Operation(summary = "Cập nhật giá bán và trạng thái kích hoạt của gói cước")
    public ResponseEntity<PlatformPackage> updatePackage(
            @PathVariable String code,
            @RequestBody Map<String, Object> body) {
        String cleanCode = code.trim().toUpperCase();
        PlatformPackage pkg = platformPackageRepository.findByPackageCode(cleanCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PACKAGE_NOT_FOUND", "Không tìm thấy gói cước mã: " + cleanCode));

        if (body.containsKey("name") && body.get("name") != null) pkg.setName(body.get("name").toString().trim());
        if (body.containsKey("halfYearPrice") && body.get("halfYearPrice") != null) {
            pkg.setHalfYearPrice(new BigDecimal(body.get("halfYearPrice").toString()));
        }
        if (body.containsKey("yearlyPrice") && body.get("yearlyPrice") != null) {
            pkg.setYearlyPrice(new BigDecimal(body.get("yearlyPrice").toString()));
        }
        if (body.containsKey("description") && body.get("description") != null) {
            pkg.setDescription(body.get("description").toString().trim());
        }
        if (body.containsKey("isActive") && body.get("isActive") != null) {
            pkg.setIsActive(Boolean.parseBoolean(body.get("isActive").toString()));
        }

        pkg.setUpdatedAt(Instant.now());
        return ResponseEntity.ok(platformPackageRepository.save(pkg));
    }

    // =========================================================================
    // 4. TRANSACTIONS & VNPAY WEBHOOK LOGS
    // =========================================================================

    @GetMapping("/transactions")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN') or hasAuthority('PERM_TENANT_MANAGE')")
    @Operation(summary = "Lịch sử giao dịch VNPAY và chi tiết Payload Webhook")
    public ResponseEntity<List<Map<String, Object>>> getTransactions() {
        List<SubscriptionOrder> orders = subscriptionOrderRepository.findAll();
        List<PlatformPackage> packages = platformPackageRepository.findAll();
        Map<String, String> pkgNames = new HashMap<>();
        for (PlatformPackage p : packages) pkgNames.put(p.getPackageCode().toUpperCase(), p.getName());

        List<Farm> farms = farmRepository.findAll();
        Map<Long, String> farmNames = new HashMap<>();
        for (Farm f : farms) farmNames.put(f.getId(), f.getName());

        List<Map<String, Object>> result = new ArrayList<>();
        for (SubscriptionOrder o : orders) {
            String fName = farmNames.getOrDefault(o.getFarmId(), "Trang trại #" + o.getFarmId());
            String pName = pkgNames.getOrDefault(o.getAddonCode().toUpperCase(), o.getAddonCode());

            String payload = String.format(
                    "{\n  \"vnp_TmnCode\": \"FARMGO01\",\n  \"vnp_Amount\": \"%s\",\n  \"vnp_BankCode\": \"%s\",\n  \"vnp_OrderInfo\": \"Thanh toan don hang %s\",\n  \"vnp_TransactionNo\": \"%s\",\n  \"vnp_ResponseCode\": \"%s\",\n  \"vnp_TxnRef\": \"%s\",\n  \"vnp_SecureHash\": \"%s\"\n}",
                    o.getAmount() != null ? o.getAmount().multiply(new BigDecimal(100)).toPlainString() : "0",
                    o.getVnpBankCode() != null ? o.getVnpBankCode() : "NCB",
                    o.getOrderCode(),
                    o.getVnpTransactionNo() != null ? o.getVnpTransactionNo() : "14589921",
                    "PAID".equalsIgnoreCase(o.getStatus()) ? "00" : (o.getVnpResponseCode() != null ? o.getVnpResponseCode() : "01"),
                    o.getOrderCode(),
                    o.getVnpSecureHash() != null ? o.getVnpSecureHash() : "e89c02b93f18e9d2987a112f4590c88b763"
            );

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", o.getId());
            item.put("orderCode", o.getOrderCode());
            item.put("farmId", o.getFarmId());
            item.put("farmName", fName);
            item.put("addonCode", o.getAddonCode());
            item.put("addonName", pName);
            item.put("packagePlan", o.getPackagePlan());
            item.put("amount", o.getAmount());
            item.put("status", o.getStatus());
            item.put("paymentGateway", o.getPaymentGateway());
            item.put("vnpTxnRef", o.getVnpTxnRef());
            item.put("vnpTransactionNo", o.getVnpTransactionNo());
            item.put("vnpBankCode", o.getVnpBankCode() != null ? o.getVnpBankCode() : "NCB");
            item.put("vnpPayDate", o.getVnpPayDate());
            item.put("vnpResponseCode", o.getVnpResponseCode() != null ? o.getVnpResponseCode() : ("PAID".equalsIgnoreCase(o.getStatus()) ? "00" : "01"));
            item.put("createdAt", o.getCreatedAt());
            item.put("paidAt", o.getPaidAt());
            item.put("payloadJson", payload);

            result.add(item);
        }

        // Sắp xếp đơn mới nhất lên đầu
        result.sort((a, b) -> {
            Instant ia = (Instant) a.get("createdAt");
            Instant ib = (Instant) b.get("createdAt");
            if (ia == null || ib == null) return 0;
            return ib.compareTo(ia);
        });

        return ResponseEntity.ok(result);
    }

    @PostMapping("/transactions/{id}/manual-activate")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN') or hasAuthority('PERM_TENANT_MANAGE')")
    @Operation(summary = "Kích hoạt thủ công đơn hàng VNPAY (Hỗ trợ kỹ thuật)")
    public ResponseEntity<Map<String, Object>> manualActivateTransaction(@PathVariable Long id) {
        SubscriptionOrder order = subscriptionOrderRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Không tìm thấy giao dịch ID: " + id));

        order.setStatus("PAID");
        order.setPaidAt(Instant.now());
        order.setVnpResponseCode("00");
        order.setNotes("Kích hoạt thủ công bởi Super Admin");
        subscriptionOrderRepository.save(order);

        // Kích hoạt FarmAddOnSubscription
        String addonCode = order.getAddonCode().toUpperCase();
        FarmAddOnSubscription addon = addonRepository.findByFarmIdAndAddonCode(order.getFarmId(), addonCode)
                .orElse(FarmAddOnSubscription.builder()
                        .tenantId(1L)
                        .farmId(order.getFarmId())
                        .addonCode(addonCode)
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build());

        Instant curExp = addon.getExpiresAt() != null ? addon.getExpiresAt() : Instant.now();
        if (curExp.isBefore(Instant.now())) curExp = Instant.now();
        int addMonths = order.getDurationMonths() > 0 ? order.getDurationMonths() : 6;
        addon.setExpiresAt(curExp.plus(addMonths * 30L, ChronoUnit.DAYS));
        addon.setStatus("ACTIVE");
        addon.setUpdatedAt(Instant.now());
        addonRepository.save(addon);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", order.getId());
        res.put("status", "PAID");
        res.put("message", "Đã kích hoạt thủ công giao dịch và bật dịch vụ " + addonCode + " thành công.");
        return ResponseEntity.ok(res);
    }
}
