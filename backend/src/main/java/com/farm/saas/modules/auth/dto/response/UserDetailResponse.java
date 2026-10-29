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
public class UserDetailResponse {

    private Long id;
    private Long tenantId;
    private String tenantName;
    private String tenantCode;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String status;
    private Boolean mustChangePassword;
    private List<UserInfoDto.RoleDto> roles;
    private List<UserInfoDto.AccessibleFarmDto> accessibleFarms;
    private List<UserInfoDto.FarmAssignmentDto> farmAssignments;
    private String operationalRole;
    private Instant createdAt;
}
