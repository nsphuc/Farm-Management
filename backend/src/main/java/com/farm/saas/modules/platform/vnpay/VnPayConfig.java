package com.farm.saas.modules.platform.vnpay;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "vnpay")
public class VnPayConfig {

    private String tmnCode = "2QXUI4J4";
    private String hashSecret = "RAOCTPXZKWSJLBYZTANXISNEWIFJQDGR";
    private String payUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    private String returnUrl = "http://localhost:5173/app/general-settings?tab=marketplace";
    private String apiUrl = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";
}
