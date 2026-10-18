package com.farm.saas.modules.platform.repository;

import com.farm.saas.modules.platform.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    Page<AuditLog> findByTenantId(Long tenantId, Pageable pageable);

    Page<AuditLog> findByTenantIdAndModule(Long tenantId, String module, Pageable pageable);

    Page<AuditLog> findByTenantIdAndAction(Long tenantId, String action, Pageable pageable);

    Page<AuditLog> findByTenantIdAndUserId(Long tenantId, Long userId, Pageable pageable);
}
