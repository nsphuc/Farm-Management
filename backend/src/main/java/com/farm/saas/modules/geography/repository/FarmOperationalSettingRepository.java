package com.farm.saas.modules.geography.repository;

import com.farm.saas.modules.geography.entity.FarmOperationalSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmOperationalSettingRepository extends JpaRepository<FarmOperationalSetting, Long>, JpaSpecificationExecutor<FarmOperationalSetting> {
    java.util.Optional<FarmOperationalSetting> findByFarmId(Long farmId);
}
