package com.farm.saas.modules.hr.repository;

import com.farm.saas.modules.hr.entity.FarmTaskAssignee;
import com.farm.saas.modules.hr.entity.FarmTaskAssigneeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmTaskAssigneeRepository extends JpaRepository<FarmTaskAssignee, FarmTaskAssigneeId>, JpaSpecificationExecutor<FarmTaskAssignee> {
}
