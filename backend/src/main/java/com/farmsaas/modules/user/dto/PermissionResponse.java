package com.farmsaas.modules.user.dto;

import com.farmsaas.modules.user.entity.Permission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionResponse {

    private Long id;
    private String code;
    private String module;
    private String action;
    private String resource;
    private String description;

    public static PermissionResponse fromEntity(Permission permission) {
        return PermissionResponse.builder()
                .id(permission.getId())
                .code(permission.getCode())
                .module(permission.getModule())
                .action(permission.getAction())
                .resource(permission.getResource())
                .description(permission.getDescription())
                .build();
    }
}
