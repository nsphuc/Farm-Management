package com.farm.saas.modules.geography.dto.response;

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
public class FarmDetailResponse {

    private Long id;
    private Long tenantId;
    private String code;
    private String name;
    private String farmType;
    private BigDecimal totalAreaM2;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer geofenceRadiusM;
    private String address;
    private Long managerUserId;
    private String managerFullName;
    private String managerEmployeeCode;
    private String managerPhone;
    private String status;
    private Long activeZonesCount;
    private Long activeEmployeesCount;
    private Long operationalCyclesCount;
    private Object settings;
    private Instant createdAt;
}
