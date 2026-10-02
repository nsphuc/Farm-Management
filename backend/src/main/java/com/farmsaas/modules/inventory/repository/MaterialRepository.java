package com.farmsaas.modules.inventory.repository;

import com.farmsaas.modules.inventory.entity.Material;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    List<Material> findByTenantId(Long tenantId);

    Optional<Material> findByIdAndTenantId(Long id, Long tenantId);

    Optional<Material> findByTenantIdAndSkuCode(Long tenantId, String skuCode);

    boolean existsByTenantIdAndSkuCode(Long tenantId, String skuCode);

    @Query("SELECT m FROM Material m WHERE m.tenantId = :tenantId " +
           "AND (:categoryId IS NULL OR m.categoryId = :categoryId) " +
           "AND (:status IS NULL OR :status = '' OR m.status = :status) " +
           "AND (:keyword IS NULL OR :keyword = '' OR LOWER(m.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(m.skuCode) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Material> searchMaterials(
            @Param("tenantId") Long tenantId,
            @Param("categoryId") Long categoryId,
            @Param("status") String status,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
