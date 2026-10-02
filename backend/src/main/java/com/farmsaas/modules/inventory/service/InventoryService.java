package com.farmsaas.modules.inventory.service;

import com.farmsaas.modules.inventory.dto.*;
import com.farmsaas.modules.inventory.entity.enums.StocktakeStatus;
import com.farmsaas.modules.inventory.entity.enums.TransferStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface InventoryService {

    List<InventoryStockResponse> getInventory(Long farmId, Long warehouseId);

    List<InventoryStockResponse> getInventoryByWarehouse(Long farmId, Long warehouseId);

    List<InventoryStockResponse> getExpiringBatches(Integer days);

    WarehouseReceiptResponse createReceipt(Long farmId, WarehouseReceiptRequest request);

    WarehouseIssueResponse createIssue(Long farmId, WarehouseIssueRequest request);

    WarehouseIssueResponse backflushConsumption(
            Long farmId,
            Long warehouseId,
            Long seasonId,
            Long livestockGroupId,
            Long referenceLogId,
            List<InventoryBackflushRequest> items
    );

    WarehouseTransferResponse createTransfer(WarehouseTransferRequest request);

    WarehouseTransferResponse dispatchTransfer(Long transferId);

    WarehouseTransferResponse receiveTransfer(Long transferId);

    WarehouseTransferResponse cancelTransfer(Long transferId);

    StocktakeResponse createStocktake(Long farmId, StocktakeRequest request);

    StocktakeResponse reconcileStocktake(Long farmId, Long stocktakeId);

    Page<WarehouseReceiptResponse> searchReceipts(Long farmId, Long warehouseId, String status, Pageable pageable);

    Page<WarehouseIssueResponse> searchIssues(Long farmId, Long warehouseId, String issueType, Pageable pageable);

    Page<WarehouseTransferResponse> searchTransfers(Long fromWarehouseId, Long toWarehouseId, TransferStatus status, Pageable pageable);

    Page<StocktakeResponse> searchStocktakes(Long farmId, Long warehouseId, StocktakeStatus status, Pageable pageable);
}
