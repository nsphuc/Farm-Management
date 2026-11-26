package com.farm.saas.modules.geography.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchResponse {
    private Long id;
    private Long farmId;
    private String code;
    private String name;
    private String livestockType;
    private String address;
    private String phone;
    private Boolean isDefault;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
