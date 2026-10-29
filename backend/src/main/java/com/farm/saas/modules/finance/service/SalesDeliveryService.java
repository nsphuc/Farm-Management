package com.farm.saas.modules.finance.service;

import com.farm.saas.modules.finance.dto.request.CreateSalesDeliveryRequest;
import com.farm.saas.modules.finance.dto.request.UpdateDeliveryPodRequest;
import com.farm.saas.modules.finance.dto.response.SalesDeliveryDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SalesDeliveryService {

    Page<SalesDeliveryDetailResponse> getDeliveries(Long farmId, Pageable pageable);

    SalesDeliveryDetailResponse getDeliveryById(Long farmId, Long id);

    SalesDeliveryDetailResponse createDelivery(Long farmId, CreateSalesDeliveryRequest request);

    SalesDeliveryDetailResponse dispatchDelivery(Long farmId, Long id);

    SalesDeliveryDetailResponse updatePod(Long farmId, Long id, UpdateDeliveryPodRequest request);

    SalesDeliveryDetailResponse cancelDelivery(Long farmId, Long id, String reason);
}
