package com.farm.saas.modules.auth.repository;

import com.farm.saas.modules.auth.entity.Role;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long>, JpaSpecificationExecutor<Role> {
    Optional<Role> findByCode(String code);

    List<Role> findByFarmIdIsNull();

    List<Role> findByFarmId(Long farmId);

    @Query("SELECT r FROM Role r WHERE r.farmId IS NULL OR r.farmId = :farmId ORDER BY r.id ASC")
    List<Role> findAvailableRolesForFarm(@Param("farmId") Long farmId);
}
