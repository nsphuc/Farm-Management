package com.farmsaas.modules.farm.repository;

import com.farmsaas.modules.farm.entity.Farm;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FarmRepository extends JpaRepository<Farm, Long> {

    List<Farm> findByTenantId(Long tenantId);

    Page<Farm> findByTenantId(Long tenantId, Pageable pageable);

    Optional<Farm> findByIdAndTenantId(Long id, Long tenantId);

    boolean existsByIdAndTenantId(Long id, Long tenantId);

    boolean existsByTenantIdAndCode(Long tenantId, String code);

    boolean existsByTenantIdAndCodeAndIdNot(Long tenantId, String code, Long id);

    @Query("SELECT f FROM Farm f WHERE f.tenantId = :tenantId " +
           "AND (:status IS NULL OR :status = '' OR f.status = :status) " +
           "AND (:farmType IS NULL OR :farmType = '' OR f.farmType = :farmType) " +
           "AND (:keyword IS NULL OR :keyword = '' OR LOWER(f.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(f.code) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Farm> searchFarms(
            @Param("tenantId") Long tenantId,
            @Param("keyword") String keyword,
            @Param("status") String status,
            @Param("farmType") String farmType,
            Pageable pageable
    );

    @Query("SELECT f FROM Farm f WHERE f.tenantId = :tenantId AND (f.id IN :accessibleFarmIds OR :isSuperAdmin = true)")
    List<Farm> findAccessibleFarms(
            @Param("tenantId") Long tenantId,
            @Param("accessibleFarmIds") List<Long> accessibleFarmIds,
            @Param("isSuperAdmin") boolean isSuperAdmin
    );
}
