package com.farm.saas.modules.geography.repository;

import com.farm.saas.modules.geography.entity.UserFarmAccess;
import com.farm.saas.modules.geography.entity.UserFarmAccessId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface UserFarmAccessRepository extends JpaRepository<UserFarmAccess, UserFarmAccessId>, JpaSpecificationExecutor<UserFarmAccess> {
    java.util.List<UserFarmAccess> findByUserId(Long userId);
    java.util.List<UserFarmAccess> findByUserIdIn(java.util.Collection<Long> userIds);
    void deleteByUserId(Long userId);
    boolean existsByUserIdAndFarmId(Long userId, Long farmId);
}
