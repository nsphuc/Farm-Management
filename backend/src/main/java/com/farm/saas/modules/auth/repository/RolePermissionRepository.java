package com.farm.saas.modules.auth.repository;

import com.farm.saas.modules.auth.entity.RolePermission;
import com.farm.saas.modules.auth.entity.RolePermissionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, RolePermissionId>, JpaSpecificationExecutor<RolePermission> {
    java.util.List<RolePermission> findByRoleId(Long roleId);
    java.util.List<RolePermission> findByRoleIdIn(java.util.Collection<Long> roleIds);
}
