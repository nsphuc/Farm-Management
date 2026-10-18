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
public class RoleMatrixResponse {

    private Long id;
    private String code;
    private String name;
    private String scopeLevel;
    private String description;
    private List<PermissionDto> permissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionDto {
        private Long id;
        private String code;
        private String name;
        private String module;
        private String description;
    }
}
