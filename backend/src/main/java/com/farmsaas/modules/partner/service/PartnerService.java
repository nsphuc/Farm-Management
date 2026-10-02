package com.farmsaas.modules.partner.service;

import com.farmsaas.common.dto.PageResponse;
import com.farmsaas.modules.partner.dto.PartnerRequest;
import com.farmsaas.modules.partner.dto.PartnerResponse;
import org.springframework.data.domain.Pageable;

public interface PartnerService {

    PageResponse<PartnerResponse> getPartners(
            String keyword,
            String partnerType,
            String status,
            String creditRating,
            Pageable pageable
    );

    PartnerResponse getPartnerById(Long id);

    PartnerResponse createPartner(PartnerRequest request);

    PartnerResponse updatePartner(Long id, PartnerRequest request);

    void deletePartner(Long id);
}
