package com.farm.saas.modules.platform.repository;

import com.farm.saas.modules.platform.entity.Tenant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long>, JpaSpecificationExecutor<Tenant> {

    boolean existsByCode(String code);

    boolean existsBySubdomain(String subdomain);

    Optional<Tenant> findByCode(String code);

    Optional<Tenant> findBySubdomain(String subdomain);

    @Query("SELECT t FROM Tenant t WHERE " +
            "(:status IS NULL OR t.status = :status) AND " +
            "(:keyword IS NULL OR LOWER(t.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(t.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(t.subdomain) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Tenant> searchTenants(@Param("status") String status, @Param("keyword") String keyword, Pageable pageable);
}
