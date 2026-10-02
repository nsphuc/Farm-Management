package com.farmsaas.modules.crop.repository;

import com.farmsaas.modules.crop.entity.CropSeason;
import com.farmsaas.modules.crop.entity.enums.SeasonStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CropSeasonRepository extends JpaRepository<CropSeason, Long> {

    List<CropSeason> findByTenantIdAndFarmId(Long tenantId, Long farmId);

    Optional<CropSeason> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    Optional<CropSeason> findByIdAndTenantId(Long id, Long tenantId);

    boolean existsByTenantIdAndFarmIdAndSeasonCode(Long tenantId, Long farmId, String seasonCode);

    @Query("SELECT s FROM CropSeason s WHERE s.tenantId = :tenantId AND s.farmId = :farmId " +
           "AND (:zoneId IS NULL OR s.zoneId = :zoneId) " +
           "AND (:cropTypeId IS NULL OR s.cropTypeId = :cropTypeId) " +
           "AND (:status IS NULL OR s.status = :status) " +
           "ORDER BY s.startDate DESC")
    Page<CropSeason> searchSeasons(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("zoneId") Long zoneId,
            @Param("cropTypeId") Long cropTypeId,
            @Param("status") SeasonStatus status,
            Pageable pageable
    );
}
