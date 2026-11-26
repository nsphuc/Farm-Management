package com.farm.saas.modules.addons.repository;

import com.farm.saas.modules.addons.entity.PayrollSheet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayrollSheetRepository extends JpaRepository<PayrollSheet, Long> {

    List<PayrollSheet> findByFarmIdAndPeriodMonth(Long farmId, String periodMonth);

    List<PayrollSheet> findByFarmIdAndBranchIdAndPeriodMonth(Long farmId, Long branchId, String periodMonth);

    List<PayrollSheet> findByFarmIdOrderByPeriodMonthDesc(Long farmId);
}
