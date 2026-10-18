package com.farm.saas.modules.masterdata.repository;

import com.farm.saas.modules.masterdata.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long>, JpaSpecificationExecutor<Warehouse> {
    java.util.List<Warehouse> findByFarmId(Long farmId);
    java.util.List<Warehouse> findByFarmIdAndWarehouseType(Long farmId, String warehouseType);
    java.util.Optional<Warehouse> findByFarmIdAndId(Long farmId, Long id);
    java.util.Optional<Warehouse> findByFarmIdAndCode(Long farmId, String code);
    boolean existsByFarmIdAndCode(Long farmId, String code);
}
