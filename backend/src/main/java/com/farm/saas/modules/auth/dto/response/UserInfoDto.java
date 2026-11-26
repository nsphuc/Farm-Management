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
    private Integer highestTier;
    private String primaryScope;
    private Integer maxFarms;
    private String planType;
    private Long employeeId;

    // Phân quyền động Barn Scope & Chi nhánh & Add-on subscriptions
    private Long assignedBranchId;
    private Boolean allBarns;
    private List<Long> allowedBarnIds;
    private List<BranchDto> branches;
    private List<FarmAddOnDto> farmAddOnSubscriptions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleDto {
        private Long id;
        private String code;
        private String name;
        private String scopeLevel;
        private Long assignedFarmId;
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
        private Boolean allBarns;
        private List<Long> barnIds;
        private List<Long> allowedBarnIds;
        private List<BranchDto> branches;
        private List<FarmAddOnDto> farmAddOnSubscriptions;
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

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BranchDto {
        private Long id;
        private Long farmId;
        private String code;
        private String name;
        private String livestockType;
        private String address;
        private String phone;
        private Boolean isDefault;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FarmAddOnDto {
        private Long id;
        private Long farmId;
        private String addonCode;
        private String status;
        private Boolean isEnabled;
        private Instant expiresAt;
    }
}
