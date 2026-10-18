package com.farm.saas.modules.platform.repository;

import com.farm.saas.modules.platform.entity.Enterprise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EnterpriseRepository extends JpaRepository<Enterprise, Long>, JpaSpecificationExecutor<Enterprise> {

    Optional<Enterprise> findByTenantId(Long tenantId);
}
