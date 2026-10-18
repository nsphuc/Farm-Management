package com.farm.saas.modules.auth.repository;

import com.farm.saas.modules.auth.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long>, JpaSpecificationExecutor<UserRole> {
    java.util.List<UserRole> findByUserId(Long userId);
    java.util.List<UserRole> findByUserIdIn(java.util.Collection<Long> userIds);
    void deleteByUserId(Long userId);
}
