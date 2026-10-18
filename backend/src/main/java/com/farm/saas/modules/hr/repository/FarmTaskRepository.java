package com.farm.saas.modules.hr.repository;

import com.farm.saas.modules.hr.entity.FarmTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmTaskRepository extends JpaRepository<FarmTask, Long>, JpaSpecificationExecutor<FarmTask> {
}
