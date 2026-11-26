package com.farm.saas.modules.platform.controller;

import com.farm.saas.modules.auth.dto.response.SubscriptionOrderDetailResponse;
import com.farm.saas.modules.auth.service.SubscriptionOrderService;
import com.farm.saas.modules.platform.vnpay.VnPayService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping({"/api/webhooks", "/api/v1/webhooks"})
@RequiredArgsConstructor
@Tag(name = "Payment Webhooks", description = "Tiếp nhận thông báo thanh toán ngầm VNPAY IPN & Giả lập Mock Success")
public class VnPayWebhookController {

    private final VnPayService vnPayService;
    private final SubscriptionOrderService subscriptionOrderService;

    @RequestMapping(value = "/vnpay-ipn", method = {RequestMethod.GET, RequestMethod.POST})
    @Operation(summary = "VNPAY IPN Webhook", description = "Endpoint tiếp nhận tín hiệu IPN từ cổng thanh toán VNPAY")
    public ResponseEntity<Map<String, String>> handleVnPayIpn(
            @RequestParam(required = false) Map<String, String> allParams,
            HttpServletRequest request) {

        Map<String, String> params = new HashMap<>();
        if (allParams != null && !allParams.isEmpty()) {
            params.putAll(allParams);
        } else {
            request.getParameterMap().forEach((k, v) -> {
                if (v != null && v.length > 0) {
                    params.put(k, v[0]);
                }
            });
        }

        log.info("Received VNPAY IPN callback with params: {}", params);

        Map<String, String> response = new HashMap<>();

        if (!vnPayService.verifyIpn(params)) {
            log.warn("Invalid VNPAY IPN checksum");
            response.put("RspCode", "97");
            response.put("Message", "Invalid Checksum");
            return ResponseEntity.ok(response);
        }

        String vnp_TxnRef = params.get("vnp_TxnRef");
        String vnp_ResponseCode = params.get("vnp_ResponseCode");
        String vnp_TransactionNo = params.get("vnp_TransactionNo");
        String vnp_BankCode = params.get("vnp_BankCode");
        String vnp_PayDate = params.get("vnp_PayDate");
        String vnp_SecureHash = params.get("vnp_SecureHash");

        try {
            if ("00".equals(vnp_ResponseCode)) {
                subscriptionOrderService.markOrderPaid(vnp_TxnRef, vnp_TransactionNo, vnp_BankCode, vnp_PayDate, vnp_SecureHash);
                response.put("RspCode", "00");
                response.put("Message", "Confirm Success");
            } else {
                log.warn("VNPAY payment not successful, response code={}", vnp_ResponseCode);
                response.put("RspCode", "00");
                response.put("Message", "Transaction Failed Noted");
            }
        } catch (Exception ex) {
            log.error("Error processing VNPAY IPN for order {}: {}", vnp_TxnRef, ex.getMessage());
            response.put("RspCode", "01");
            response.put("Message", "Order Not Found or Internal Error");
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/mock-success")
    @Operation(summary = "Giả lập thanh toán thành công (Dev/Demo Offline)",
            description = "Dành riêng cho môi trường demo không có internet hoặc khi cần kích hoạt ngay đơn hàng dịch vụ Add-on")
    public ResponseEntity<SubscriptionOrderDetailResponse> handleMockSuccess(
            @RequestBody Map<String, String> body) {
        String orderCode = body != null ? body.get("orderCode") : null;
        if (orderCode == null || orderCode.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        log.info("Triggering mock payment success for orderCode: {}", orderCode);
        SubscriptionOrderDetailResponse response = subscriptionOrderService.mockSuccess(orderCode.trim());
        return ResponseEntity.ok(response);
    }
}
