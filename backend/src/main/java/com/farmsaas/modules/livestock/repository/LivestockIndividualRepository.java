package com.farmsaas.modules.livestock.repository;

import com.farmsaas.modules.livestock.entity.LivestockIndividual;
import com.farmsaas.modules.livestock.entity.enums.Gender;
import com.farmsaas.modules.livestock.entity.enums.HealthStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LivestockIndividualRepository extends JpaRepository<LivestockIndividual, Long> {

    List<LivestockIndividual> findByTenantIdAndFarmId(Long tenantId, Long farmId);

    Optional<LivestockIndividual> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    Optional<LivestockIndividual> findByTenantIdAndRfidTagCode(Long tenantId, String rfidTagCode);

    boolean existsByTenantIdAndRfidTagCode(Long tenantId, String rfidTagCode);

    long countByTenantIdAndRfidTagCodeStartingWith(Long tenantId, String prefix);

    @Query("SELECT i FROM LivestockIndividual i WHERE i.tenantId = :tenantId AND i.farmId = :farmId " +
           "AND (:zoneId IS NULL OR i.zoneId = :zoneId) " +
           "AND (:groupId IS NULL OR i.groupId = :groupId) " +
           "AND (:healthStatus IS NULL OR i.healthStatus = :healthStatus) " +
           "AND (:gender IS NULL OR i.gender = :gender) " +
           "AND (:keyword IS NULL OR LOWER(i.rfidTagCode) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(i.motherTagCode) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(i.fatherTagCode) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY i.createdAt DESC")
    Page<LivestockIndividual> searchIndividuals(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("zoneId") Long zoneId,
            @Param("groupId") Long groupId,
            @Param("healthStatus") HealthStatus healthStatus,
            @Param("gender") Gender gender,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
