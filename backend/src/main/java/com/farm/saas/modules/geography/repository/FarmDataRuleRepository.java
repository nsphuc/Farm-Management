package com.farm.saas.modules.geography.repository;

import com.farm.saas.modules.geography.entity.FarmDataRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FarmDataRuleRepository extends JpaRepository<FarmDataRule, Long> {

    Optional<FarmDataRule> findByFarmId(Long farmId);
}
