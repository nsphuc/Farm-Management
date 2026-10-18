package com.farm.saas.modules.crop.repository;

import com.farm.saas.modules.crop.entity.FarmingLogSupply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmingLogSupplyRepository extends JpaRepository<FarmingLogSupply, Long>, JpaSpecificationExecutor<FarmingLogSupply> {
    java.util.List<FarmingLogSupply> findByFarmingLogId(Long farmingLogId);
}
