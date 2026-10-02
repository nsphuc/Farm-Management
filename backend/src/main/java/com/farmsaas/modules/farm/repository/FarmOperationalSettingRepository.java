package com.farmsaas.modules.farm.repository;

import com.farmsaas.modules.farm.entity.FarmOperationalSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FarmOperationalSettingRepository extends JpaRepository<FarmOperationalSetting, Long> {

    Optional<FarmOperationalSetting> findByFarmIdAndTenantId(Long farmId, Long tenantId);
}
