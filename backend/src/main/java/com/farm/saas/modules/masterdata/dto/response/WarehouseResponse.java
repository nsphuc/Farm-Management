package com.farm.saas.modules.masterdata.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String farmName;
    private String code;
    private String name;
    private String warehouseType;
    private BigDecimal capacityM3;
    private BigDecimal floorAreaM2;
    private BigDecimal standardTempC;
    private BigDecimal standardHumidityPct;
    private String locationDesc;
    private Long managerUserId;
    private String managerFullName;
    private String status;
    private Long currentInventoryLotsCount;
    private Instant createdAt;
}
