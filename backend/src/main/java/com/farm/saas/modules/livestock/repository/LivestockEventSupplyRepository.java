package com.farm.saas.modules.livestock.repository;

import com.farm.saas.modules.livestock.entity.LivestockEventSupply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface LivestockEventSupplyRepository extends JpaRepository<LivestockEventSupply, Long>, JpaSpecificationExecutor<LivestockEventSupply> {
    java.util.List<LivestockEventSupply> findByLivestockEventId(Long eventId);
}
