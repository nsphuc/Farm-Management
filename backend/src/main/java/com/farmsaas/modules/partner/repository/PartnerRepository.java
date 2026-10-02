package com.farmsaas.modules.partner.repository;

import com.farmsaas.modules.partner.entity.Partner;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PartnerRepository extends JpaRepository<Partner, Long> {

    Optional<Partner> findByIdAndTenantId(Long id, Long tenantId);

    boolean existsByTenantIdAndCode(Long tenantId, String code);

    boolean existsByTenantIdAndCodeAndIdNot(Long tenantId, String code, Long id);

    @Query("SELECT p FROM Partner p WHERE p.tenantId = :tenantId AND (:partnerType IS NULL OR p.partnerType = :partnerType) AND (:status IS NULL OR p.status = :status) AND (:creditRating IS NULL OR p.creditRating = :creditRating) AND (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.phone) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Partner> searchPartners(
            @Param("tenantId") Long tenantId,
            @Param("keyword") String keyword,
            @Param("partnerType") String partnerType,
            @Param("status") String status,
            @Param("creditRating") String creditRating,
            Pageable pageable
    );
}
