package com.farm.saas.modules.addons.repository;

import com.farm.saas.modules.addons.entity.HatcheryBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HatcheryBatchRepository extends JpaRepository<HatcheryBatch, Long> {

    List<HatcheryBatch> findByFarmIdOrderBySetDateDesc(Long farmId);

    List<HatcheryBatch> findByFarmIdAndBranchIdOrderBySetDateDesc(Long farmId, Long branchId);

    long countByFarmIdAndStatus(Long farmId, String status);
}
