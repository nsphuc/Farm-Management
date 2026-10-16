package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.InventoryReceiptDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository quản lý chi tiết dòng hàng Nhập kho (bảng warehouse_receipt_items).
 */
@Repository
public interface InventoryReceiptDetailRepository extends JpaRepository<InventoryReceiptDetail, Long> {

    List<InventoryReceiptDetail> findAllByReceiptId(Long receiptId);
}
