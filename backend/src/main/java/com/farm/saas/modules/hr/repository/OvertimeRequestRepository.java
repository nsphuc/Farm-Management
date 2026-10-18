package com.farm.saas.modules.hr.repository;

import com.farm.saas.modules.hr.entity.OvertimeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface OvertimeRequestRepository extends JpaRepository<OvertimeRequest, Long>, JpaSpecificationExecutor<OvertimeRequest> {
}
