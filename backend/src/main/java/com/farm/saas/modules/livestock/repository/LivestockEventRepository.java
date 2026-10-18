package com.farm.saas.modules.livestock.repository;

import com.farm.saas.modules.livestock.entity.LivestockEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface LivestockEventRepository extends JpaRepository<LivestockEvent, Long>, JpaSpecificationExecutor<LivestockEvent> {
}
