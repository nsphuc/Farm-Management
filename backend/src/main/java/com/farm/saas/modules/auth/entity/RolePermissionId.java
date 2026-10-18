package com.farm.saas.modules.auth.entity;

import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RolePermissionId implements Serializable {
    private Long roleId;
    private Long permissionId;
}
