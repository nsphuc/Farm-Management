package com.farmsaas.modules.farm.dto;

import com.farmsaas.modules.farm.entity.Farm;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmSummaryResponse {

    private Long id;
    private String code;
    private String name;
    private String farmType;
    private String status;

    public static FarmSummaryResponse fromEntity(Farm farm) {
        if (farm == null) return null;
        return FarmSummaryResponse.builder()
                .id(farm.getId())
                .code(farm.getCode())
                .name(farm.getName())
                .farmType(farm.getFarmType())
                .status(farm.getStatus())
                .build();
    }
}
