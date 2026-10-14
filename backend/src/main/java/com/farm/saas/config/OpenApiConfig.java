package com.farm.saas.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI farmSaasOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Farm SaaS API - Hệ thống quản lý đa trang trại")
                        .description("REST API nền tảng Modular Monolith cho quản lý nông nghiệp số, đa tenant và đa trang trại.")
                        .version("0.0.1-SNAPSHOT")
                        .contact(new Contact().name("Farm SaaS Engineering Team"))
                        .license(new License().name("Proprietary")));
    }
}
