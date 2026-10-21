package com.farm.saas.modules.platform.service;

import com.farm.saas.modules.platform.dto.request.CreatePartnerRequest;
import com.farm.saas.modules.platform.dto.request.UpdatePartnerRequest;
import com.farm.saas.modules.platform.dto.request.UpdatePartnerStatusRequest;
import com.farm.saas.modules.platform.dto.response.PartnerResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PartnerService {

    Page<PartnerResponse> getPartners(Long farmId, String partnerType, String status, String keyword, Pageable pageable);

    default Page<PartnerResponse> getPartners(String partnerType, String status, String keyword, Pageable pageable) {
        return getPartners(null, partnerType, status, keyword, pageable);
    }

    PartnerResponse getPartnerById(Long id);

    PartnerResponse createPartner(CreatePartnerRequest request);

    PartnerResponse updatePartner(Long id, UpdatePartnerRequest request);

    PartnerResponse updatePartnerStatus(Long id, UpdatePartnerStatusRequest request);
}
