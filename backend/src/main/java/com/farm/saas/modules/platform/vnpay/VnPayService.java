package com.farm.saas.modules.platform.vnpay;

import java.util.Map;

public interface VnPayService {

    String createPaymentUrl(String orderCode, long amountVnd, String orderInfo, String ipAddress, String returnUrlOverride);

    boolean verifyIpn(Map<String, String> vnpParams);

    String hmacSHA512(String key, String data);
}
