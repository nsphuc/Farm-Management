package com.farm.saas.modules.platform.service;

import com.farm.saas.modules.platform.dto.request.UpdateEnterpriseProfileRequest;
import com.farm.saas.modules.platform.dto.response.EnterpriseProfileResponse;

public interface EnterpriseProfileService {

    EnterpriseProfileResponse getProfile();

    EnterpriseProfileResponse updateProfile(UpdateEnterpriseProfileRequest request);
}
