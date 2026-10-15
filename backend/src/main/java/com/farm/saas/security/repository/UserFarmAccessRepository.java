package com.farm.saas.security.repository;

import com.farm.saas.security.entity.UserFarmAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserFarmAccessRepository extends JpaRepository<UserFarmAccess, UserFarmAccess.UserFarmAccessId> {

    List<UserFarmAccess> findByUserId(Long userId);

    @Query("SELECT ufa.farmId FROM UserFarmAccess ufa WHERE ufa.userId = :userId")
    List<Long> findFarmIdsByUserId(@Param("userId") Long userId);

    boolean existsByUserIdAndFarmId(Long userId, Long farmId);
}
