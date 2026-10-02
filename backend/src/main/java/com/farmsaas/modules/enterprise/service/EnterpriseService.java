package com.farmsaas.modules.enterprise.service;

import com.farmsaas.modules.enterprise.dto.EnterpriseRequest;
import com.farmsaas.modules.enterprise.dto.EnterpriseResponse;

public interface EnterpriseService {

    EnterpriseResponse getMyEnterprise();

    EnterpriseResponse updateMyEnterprise(EnterpriseRequest request);
}
