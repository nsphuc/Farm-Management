package com.farmsaas.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Enable Spring Data JPA Auditing for automatic createdAt, updatedAt, createdBy, updatedBy injection.
 */
@Configuration
@EnableJpaAuditing
public class AuditingConfig {
}
