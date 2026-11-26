package com.farm.saas.modules.addons.repository;

import com.farm.saas.modules.addons.entity.FeedProductionOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedProductionOrderRepository extends JpaRepository<FeedProductionOrder, Long> {

    List<FeedProductionOrder> findByFarmIdOrderByExecutedDateDesc(Long farmId);

    List<FeedProductionOrder> findByFarmIdAndBranchIdOrderByExecutedDateDesc(Long farmId, Long branchId);
}
