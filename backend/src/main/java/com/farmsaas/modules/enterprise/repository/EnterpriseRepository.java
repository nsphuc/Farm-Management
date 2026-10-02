package com.farmsaas.modules.enterprise.repository;

import com.farmsaas.modules.enterprise.entity.Enterprise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EnterpriseRepository extends JpaRepository<Enterprise, Long> {

    Optional<Enterprise> findByTenantId(Long tenantId);

    boolean existsByTenantId(Long tenantId);
}
