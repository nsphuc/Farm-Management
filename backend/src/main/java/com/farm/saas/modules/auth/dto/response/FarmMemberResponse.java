package com.farm.saas.modules.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmMemberResponse {

    private Long id;
    private Long farmId;
    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private Long roleId;
    private String roleCode;
    private String roleName;
    private Boolean isSystemRole;
    private Long branchId;
    private Boolean allBarns;
    private List<Long> barnIds;
    private Instant createdAt;
    private Instant updatedAt;
}
