package com.farm.saas.modules.platform.service;

import com.farm.saas.modules.platform.dto.request.BroadcastNotificationRequest;
import com.farm.saas.modules.platform.dto.response.BroadcastNotificationResponse;

public interface PlatformNotificationService {

    BroadcastNotificationResponse broadcast(BroadcastNotificationRequest request);
}

