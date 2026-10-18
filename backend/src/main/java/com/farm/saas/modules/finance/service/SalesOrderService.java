package com.farm.saas.modules.finance.service;

import com.farm.saas.modules.finance.dto.request.CreateSalesOrderRequest;
import com.farm.saas.modules.finance.dto.response.SalesOrderDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SalesOrderService {

    Page<SalesOrderDetailResponse> getOrders(Long farmId, Pageable pageable);

    SalesOrderDetailResponse getOrderById(Long farmId, Long id);

    SalesOrderDetailResponse createOrder(Long farmId, CreateSalesOrderRequest request);

    SalesOrderDetailResponse confirmOrder(Long farmId, Long id);

    SalesOrderDetailResponse cancelOrder(Long farmId, Long id);
}
