package com.farmsaas.modules.finance.service;

import com.farmsaas.modules.finance.dto.SalesOrderRequest;
import com.farmsaas.modules.finance.dto.SalesOrderResponse;
import com.farmsaas.modules.finance.entity.enums.DeliveryStatus;
import com.farmsaas.modules.finance.entity.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface SalesOrderService {

    SalesOrderResponse createOrder(Long farmId, SalesOrderRequest request);

    SalesOrderResponse updateOrder(Long farmId, Long id, SalesOrderRequest request);

    SalesOrderResponse updateDeliveryStatus(Long farmId, Long id, DeliveryStatus status);

    SalesOrderResponse getOrderById(Long farmId, Long id);

    Page<SalesOrderResponse> searchOrders(Long farmId, Long partnerId, PaymentStatus paymentStatus, DeliveryStatus deliveryStatus, LocalDate fromDate, LocalDate toDate, String keyword, Pageable pageable);

    void deleteOrder(Long farmId, Long id);
}
