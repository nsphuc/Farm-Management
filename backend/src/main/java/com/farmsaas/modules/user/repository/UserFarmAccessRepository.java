package com.farmsaas.modules.user.repository;

import com.farmsaas.modules.user.entity.UserFarmAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserFarmAccessRepository extends JpaRepository<UserFarmAccess, Long> {

    List<UserFarmAccess> findByUserIdAndTenantId(Long userId, Long tenantId);

    List<UserFarmAccess> findByFarmIdAndTenantId(Long farmId, Long tenantId);

    boolean existsByUserIdAndFarmId(Long userId, Long farmId);

    Optional<UserFarmAccess> findByUserIdAndFarmId(Long userId, Long farmId);

    void deleteByUserIdAndFarmId(Long userId, Long farmId);
}
