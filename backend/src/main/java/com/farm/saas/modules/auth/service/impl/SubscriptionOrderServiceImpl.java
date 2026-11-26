package com.farm.saas.modules.auth.service.impl;

import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.dto.request.CreateSubscriptionOrderRequest;
import com.farm.saas.modules.auth.dto.response.SubscriptionOrderDetailResponse;
import com.farm.saas.modules.auth.entity.FarmAddOnSubscription;
import com.farm.saas.modules.auth.entity.SubscriptionOrder;
import com.farm.saas.modules.auth.repository.FarmAddOnSubscriptionRepository;
import com.farm.saas.modules.auth.repository.SubscriptionOrderRepository;
import com.farm.saas.modules.auth.service.SubscriptionOrderService;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.platform.vnpay.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionOrderServiceImpl implements SubscriptionOrderService {

    private final SubscriptionOrderRepository subscriptionOrderRepository;
    private final FarmAddOnSubscriptionRepository farmAddOnSubscriptionRepository;
    private final FarmRepository farmRepository;
    private final VnPayService vnPayService;

    private static final Map<String, BigDecimal> MONTHLY_PRICES = Map.of(
            "BRANCHES", new BigDecimal("500000"),
            "PAYROLL", new BigDecimal("350000"),
            "CUSTOM_ROLES", new BigDecimal("250000"),
            "BREEDING", new BigDecimal("600000"),
            "POULTRY_HATCHERY", new BigDecimal("600000"),
            "FEED_MILL", new BigDecimal("450000")
    );

    @Override
    @Transactional
    public SubscriptionOrderDetailResponse createCheckoutOrder(Long farmId, CreateSubscriptionOrderRequest request, HttpServletRequest httpRequest) {
        if (!farmRepository.existsById(farmId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "FARM_NOT_FOUND", "Trang trại không tồn tại.");
        }

        String addonCode = request.getAddonCode().trim().toUpperCase();
        if (!MONTHLY_PRICES.containsKey(addonCode)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ADDON", "Gói Add-on không hợp lệ: " + addonCode);
        }

        String plan = "YEARLY".equalsIgnoreCase(request.getPackagePlan()) ? "YEARLY" : "MONTHLY";
        int months = "YEARLY".equals(plan) ? 12 : 1;
        BigDecimal monthlyPrice = MONTHLY_PRICES.get(addonCode);
        BigDecimal amount = "YEARLY".equals(plan)
                ? monthlyPrice.multiply(BigDecimal.valueOf(10)) // Ưu đãi năm đóng 10 tháng dùng 12 tháng
                : monthlyPrice;

        String orderCode = "SUB" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        String clientIp = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        String orderInfo = "Thanh toan goi FarmGo Addon " + addonCode + " (" + plan + ")";
        String paymentUrl = vnPayService.createPaymentUrl(orderCode, amount.longValue(), orderInfo, clientIp, request.getReturnUrl());

        SubscriptionOrder order = SubscriptionOrder.builder()
                .farmId(farmId)
                .orderCode(orderCode)
                .addonCode(addonCode)
                .packagePlan(plan)
                .durationMonths(months)
                .amount(amount)
                .status("PENDING")
                .paymentGateway("VNPAY")
                .vnpTxnRef(orderCode)
                .paymentUrl(paymentUrl)
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        SubscriptionOrder saved = subscriptionOrderRepository.save(order);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public SubscriptionOrder markOrderPaid(String orderCode, String transactionNo, String bankCode, String payDate, String secureHash) {
        SubscriptionOrder order = subscriptionOrderRepository.findByOrderCode(orderCode)
                .or(() -> subscriptionOrderRepository.findByVnpTxnRef(orderCode))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Không tìm thấy đơn hàng: " + orderCode));

        if ("PAID".equalsIgnoreCase(order.getStatus())) {
            log.info("Subscription order [{}] is already marked PAID", orderCode);
            return order;
        }

        order.setStatus("PAID");
        order.setVnpTransactionNo(transactionNo);
        order.setVnpBankCode(bankCode);
        order.setVnpPayDate(payDate);
        order.setVnpSecureHash(secureHash);
        order.setPaidAt(Instant.now());
        order.setUpdatedAt(Instant.now());
        subscriptionOrderRepository.save(order);

        // Kích hoạt hoặc gia hạn FarmAddOnSubscription
        enableOrExtendAddon(order.getFarmId(), order.getAddonCode(), order.getDurationMonths());

        log.info("Subscription order [{}] completed successfully for farmId={}, addon={}", orderCode, order.getFarmId(), order.getAddonCode());
        return order;
    }

    @Override
    @Transactional
    public SubscriptionOrderDetailResponse mockSuccess(String orderCode) {
        SubscriptionOrder order = subscriptionOrderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Không tìm thấy đơn hàng: " + orderCode));

        order.setPaymentGateway("MOCK");
        order.setStatus("PAID");
        order.setVnpBankCode("NCB");
        order.setVnpTransactionNo("MOCK_TXN_" + System.currentTimeMillis());
        order.setVnpPayDate(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
                .withZone(java.time.ZoneOffset.UTC)
                .format(Instant.now()));
        order.setPaidAt(Instant.now());
        order.setUpdatedAt(Instant.now());
        subscriptionOrderRepository.save(order);

        enableOrExtendAddon(order.getFarmId(), order.getAddonCode(), order.getDurationMonths());
        return toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionOrderDetailResponse> getOrdersByFarm(Long farmId) {
        return subscriptionOrderRepository.findByFarmIdOrderByCreatedAtDesc(farmId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private void enableOrExtendAddon(Long farmId, String addonCode, int durationMonths) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        FarmAddOnSubscription sub = farmAddOnSubscriptionRepository.findByFarmIdAndAddonCode(farmId, addonCode)
                .orElseGet(() -> FarmAddOnSubscription.builder()
                        .tenantId(tenantId != null ? tenantId : 1L)
                        .farmId(farmId)
                        .addonCode(addonCode)
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build());

        Instant baseTime = (sub.getExpiresAt() != null && sub.getExpiresAt().isAfter(Instant.now()))
                ? sub.getExpiresAt()
                : Instant.now();

        sub.setStatus("ACTIVE");
        sub.setExpiresAt(baseTime.plusSeconds(durationMonths * 30L * 86400L));
        sub.setUpdatedAt(Instant.now());
        farmAddOnSubscriptionRepository.save(sub);
    }

    private SubscriptionOrderDetailResponse toResponse(SubscriptionOrder o) {
        return SubscriptionOrderDetailResponse.builder()
                .id(o.getId())
                .orderCode(o.getOrderCode())
                .farmId(o.getFarmId())
                .addonCode(o.getAddonCode())
                .packagePlan(o.getPackagePlan())
                .durationMonths(o.getDurationMonths())
                .amount(o.getAmount())
                .status(o.getStatus())
                .paymentGateway(o.getPaymentGateway())
                .paymentUrl(o.getPaymentUrl())
                .paidAt(o.getPaidAt())
                .createdAt(o.getCreatedAt())
                .build();
    }
}
