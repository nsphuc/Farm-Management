package com.farmsaas.modules.tenant.repository;

import com.farmsaas.modules.tenant.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {

    Optional<Tenant> findByCode(String code);

    Optional<Tenant> findBySubdomain(String subdomain);
}
