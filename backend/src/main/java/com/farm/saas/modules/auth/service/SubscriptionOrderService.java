package com.farm.saas.modules.auth.service;

import com.farm.saas.modules.auth.dto.request.CreateSubscriptionOrderRequest;
import com.farm.saas.modules.auth.dto.response.SubscriptionOrderDetailResponse;
import com.farm.saas.modules.auth.entity.SubscriptionOrder;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

public interface SubscriptionOrderService {

    SubscriptionOrderDetailResponse createCheckoutOrder(Long farmId, CreateSubscriptionOrderRequest request, HttpServletRequest httpRequest);

    SubscriptionOrder markOrderPaid(String orderCode, String transactionNo, String bankCode, String payDate, String secureHash);

    SubscriptionOrderDetailResponse mockSuccess(String orderCode);

    List<SubscriptionOrderDetailResponse> getOrdersByFarm(Long farmId);
}
