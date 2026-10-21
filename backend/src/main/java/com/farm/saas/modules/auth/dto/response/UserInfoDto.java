package com.farm.saas.modules.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoDto {

    private Long id;
    private Long tenantId;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private Boolean isSuperAdmin;
    private Boolean mustChangePassword;
    private List<RoleDto> roles;
    private List<String> permissions;
    private List<AccessibleFarmDto> accessibleFarms;
    private List<FarmAssignmentDto> farmAssignments;
    private String operationalRole;
    private Integer maxFarms;
    private String planType;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleDto {
        private Long id;
        private String code;
        private String name;
        private String scopeLevel;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccessibleFarmDto {
        private Long farmId;
        private String farmCode;
        private String farmName;
        private String farmType;
        private String assignedRole;
        private Boolean isManager;
        private Long managerUserId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FarmAssignmentDto {
        private Long id;
        private Long farmId;
        private String farmName;
        private Long zoneId;
        private String roleInFarm;
        private Boolean isActive;
    }
}
