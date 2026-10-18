package com.farm.saas.modules.quality.repository;

import com.farm.saas.modules.quality.entity.ProductBatchSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductBatchSourceRepository extends JpaRepository<ProductBatchSource, Long>, JpaSpecificationExecutor<ProductBatchSource> {
}
