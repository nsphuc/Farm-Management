package com.farm.saas.modules.auth.controller;

import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.entity.FarmAddOnSubscription;
import com.farm.saas.modules.auth.repository.FarmAddOnSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/farms/{farmId}/addons")
@RequiredArgsConstructor
public class FarmAddOnController {

    private final FarmAddOnSubscriptionRepository addonRepository;
    private final com.farm.saas.modules.auth.service.SubscriptionOrderService subscriptionOrderService;

    @GetMapping
    @PreAuthorize("@farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<List<FarmAddOnSubscription>> getFarmAddons(@PathVariable Long farmId) {
        return ResponseEntity.ok(addonRepository.findByFarmId(farmId));
    }

    @PostMapping("/checkout")
    @PreAuthorize("(hasRole('ROLE_FARM_OWNER') or hasRole('ROLE_SUPER_ADMIN')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<com.farm.saas.modules.auth.dto.response.SubscriptionOrderDetailResponse> checkoutAddon(
            @PathVariable Long farmId,
            @jakarta.validation.Valid @RequestBody com.farm.saas.modules.auth.dto.request.CreateSubscriptionOrderRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        return ResponseEntity.ok(subscriptionOrderService.createCheckoutOrder(farmId, request, httpRequest));
    }

    @GetMapping("/orders")
    @PreAuthorize("(hasRole('ROLE_FARM_OWNER') or hasRole('ROLE_SUPER_ADMIN') or hasRole('ROLE_ACCOUNTANT')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<List<com.farm.saas.modules.auth.dto.response.SubscriptionOrderDetailResponse>> getSubscriptionOrders(
            @PathVariable Long farmId) {
        return ResponseEntity.ok(subscriptionOrderService.getOrdersByFarm(farmId));
    }

    @PostMapping("/{addonCode}/toggle")
    @PreAuthorize("(hasRole('ROLE_FARM_OWNER') or hasRole('ROLE_SUPER_ADMIN')) and @farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<FarmAddOnSubscription> toggleAddon(
            @PathVariable Long farmId,
            @PathVariable String addonCode) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        String code = addonCode.trim().toUpperCase();
        FarmAddOnSubscription sub = addonRepository.findByFarmIdAndAddonCode(farmId, code)
                .orElse(FarmAddOnSubscription.builder()
                        .tenantId(tenantId != null ? tenantId : 1L)
                        .farmId(farmId)
                        .addonCode(code)
                        .status("INACTIVE")
                        .createdAt(Instant.now())
                        .build());

        String newStatus = "ACTIVE".equalsIgnoreCase(sub.getStatus()) ? "INACTIVE" : "ACTIVE";
        sub.setStatus(newStatus);
        sub.setUpdatedAt(Instant.now());
        return ResponseEntity.ok(addonRepository.save(sub));
    }
}
