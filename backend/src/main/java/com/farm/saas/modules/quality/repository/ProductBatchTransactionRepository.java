package com.farm.saas.modules.quality.repository;

import com.farm.saas.modules.quality.entity.ProductBatchTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductBatchTransactionRepository extends JpaRepository<ProductBatchTransaction, Long>, JpaSpecificationExecutor<ProductBatchTransaction> {
}
