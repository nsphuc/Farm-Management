package com.farm.saas.modules.geography.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLivestockFacilityRequest {

    private String province;
    private String ward;

    @NotBlank(message = "Loại hình chăn nuôi không được để trống")
    private String facilityType; // INDIVIDUAL, BUSINESS, COOPERATIVE, HOUSEHOLD

    @NotBlank(message = "Tên cơ sở không được để trống")
    private String businessName;

    private String taxCode;
    private String managementDomain;

    @NotBlank(message = "Lĩnh vực chăn nuôi không được để trống")
    private String livestockSector; // LIVESTOCK, POULTRY

    @NotBlank(message = "Loại vật nuôi không được để trống")
    private String livestockType; // PIG_MEAT, POULTRY_MEAT

    private String subscriptionTier; // STANDARD, CUSTOM
    private Integer managerAccountsCount;
    private Integer subscriptionDurationYears;
    private Boolean isDemo;
}
