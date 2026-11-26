package com.farm.saas.modules.finance.repository;

import com.farm.saas.modules.finance.entity.FarmFinancialSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FarmFinancialSettingRepository extends JpaRepository<FarmFinancialSetting, Long> {

    Optional<FarmFinancialSetting> findByFarmId(Long farmId);
}
