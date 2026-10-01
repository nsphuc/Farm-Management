package com.farmsaas.modules.user.service;

import com.farmsaas.modules.user.dto.PermissionResponse;
import com.farmsaas.modules.user.dto.RoleResponse;

import java.util.List;

public interface RoleService {

    List<RoleResponse> getAllRoles();

    List<PermissionResponse> getAllPermissions();
}
