package com.farm.saas.modules.platform.service;

import com.farm.saas.modules.platform.dto.request.CreateSubscriptionRequest;
import com.farm.saas.modules.platform.dto.request.CreateTenantRequest;
import com.farm.saas.modules.platform.dto.request.UpdateTenantStatusRequest;
import com.farm.saas.modules.platform.dto.response.TenantDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PlatformTenantService {

    TenantDetailResponse createTenant(CreateTenantRequest request);

    Page<TenantDetailResponse> getTenants(String status, String keyword, Pageable pageable);

    TenantDetailResponse getTenantById(Long id);

    TenantDetailResponse updateTenantStatus(Long id, UpdateTenantStatusRequest request);

    TenantDetailResponse addSubscription(Long id, CreateSubscriptionRequest request);
}
