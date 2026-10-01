package com.farmsaas.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Enable Spring Boot background task scheduling.
 */
@Configuration
@EnableScheduling
public class SchedulerConfig {
}
