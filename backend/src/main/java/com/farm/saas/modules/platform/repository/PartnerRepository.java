package com.farm.saas.modules.platform.repository;

import com.farm.saas.modules.platform.entity.Partner;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PartnerRepository extends JpaRepository<Partner, Long>, JpaSpecificationExecutor<Partner> {

    boolean existsByTenantIdAndCode(Long tenantId, String code);

    Optional<Partner> findByTenantIdAndCode(Long tenantId, String code);

    Optional<Partner> findByTenantIdAndId(Long tenantId, Long id);

    @Query("SELECT p FROM Partner p WHERE p.tenantId = :tenantId AND " +
            "(:farmId IS NULL OR p.farmId = :farmId) AND " +
            "(:partnerType IS NULL OR p.partnerType = :partnerType) AND " +
            "(:status IS NULL OR p.status = :status) AND " +
            "(:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.phone) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Partner> searchPartners(@Param("tenantId") Long tenantId,
                                 @Param("farmId") Long farmId,
                                 @Param("partnerType") String partnerType,
                                 @Param("status") String status,
                                 @Param("keyword") String keyword,
                                 Pageable pageable);
}
