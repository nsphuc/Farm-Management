package com.farm.saas.modules.quality.repository;

import com.farm.saas.modules.quality.entity.ProductBatchTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Repository ghi nhận và truy xuất sổ cái biến động (Append-only Ledger) của lô thành phẩm.
 */
@Repository
public interface ProductBatchTransactionRepository extends JpaRepository<ProductBatchTransaction, Long>, JpaSpecificationExecutor<ProductBatchTransaction> {

    /**
     * Tìm danh sách lịch sử biến động số lượng của lô sản phẩm theo thứ tự thời gian giảm dần.
     *
     * @param productBatchId ID lô sản phẩm thành phẩm
     * @return Danh sách lịch sử giao dịch biến động số lượng
     */
    java.util.List<ProductBatchTransaction> findByProductBatchIdOrderByCreatedAtDesc(Long productBatchId);
}
