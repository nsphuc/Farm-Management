package com.farmsaas.modules.enterprise.entity;

import com.farmsaas.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Enterprise Profile / Legal Cooperative entity associated with a Tenant.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "enterprises")
public class Enterprise extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "tax_number", nullable = false, length = 50)
    private String taxNumber;

    @Column(name = "legal_representative", nullable = false, length = 100)
    private String legalRepresentative;

    @Column(name = "headquarter_address", nullable = false, length = 500)
    private String headquarterAddress;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "website", length = 255)
    private String website;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "established_date")
    private LocalDate establishedDate;

    /**
     * Stored as JSON: Certifications such as VietGAP, GlobalGAP, certNumber, issuedBy, expiryDate, etc.
     */
    @Column(name = "certifications_json", columnDefinition = "JSON")
    private String certificationsJson;
}
