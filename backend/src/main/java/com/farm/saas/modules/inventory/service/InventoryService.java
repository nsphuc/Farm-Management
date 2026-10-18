package com.farm.saas.modules.inventory.service;

import com.farm.saas.modules.inventory.dto.request.*;
import com.farm.saas.modules.inventory.dto.response.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface InventoryService {

    // --- 1. Query Inventory & Ledger ---
    Page<InventoryItemResponse> getInventory(
            Long farmId, Long warehouseId, Long materialId, String batchNumber,
            Boolean lowStock, Boolean nearExpiry, Pageable pageable);

    Page<InventoryTransactionResponse> getTransactions(
            Long farmId, Long warehouseId, Long materialId, String batchNumber,
            String transactionType, LocalDate fromDate, LocalDate toDate, Pageable pageable);

    // --- 2. Warehouse Receipts ---
    WarehouseReceiptDetailResponse createReceipt(Long farmId, CreateWarehouseReceiptRequest request);
    WarehouseReceiptDetailResponse getReceiptById(Long farmId, Long id);
    WarehouseReceiptDetailResponse completeReceipt(Long farmId, Long id);
    WarehouseReceiptDetailResponse cancelReceipt(Long farmId, Long id, CancelWarehouseReceiptRequest request);

    // --- 3. Warehouse Issues ---
    WarehouseIssueDetailResponse createIssue(Long farmId, CreateWarehouseIssueRequest request);
    WarehouseIssueDetailResponse getIssueById(Long farmId, Long id);
    WarehouseIssueDetailResponse completeIssue(Long farmId, Long id);
    WarehouseIssueDetailResponse cancelIssue(Long farmId, Long id, CancelWarehouseIssueRequest request);

    // --- 4. Warehouse Transfers ---
    WarehouseTransferDetailResponse createTransfer(Long farmId, CreateWarehouseTransferRequest request);
    WarehouseTransferDetailResponse getTransferById(Long farmId, Long id);
    WarehouseTransferDetailResponse dispatchTransfer(Long farmId, Long id);
    WarehouseTransferDetailResponse receiveTransfer(Long farmId, Long id);

    // --- 5. Stocktakes ---
    StocktakeDetailResponse createStocktake(Long farmId, CreateStocktakeRequest request);
    StocktakeDetailResponse getStocktakeById(Long farmId, Long id);
    StocktakeDetailResponse recordStocktakeCount(Long farmId, Long id, RecordStocktakeCountRequest request);
    StocktakeDetailResponse adjustStocktake(Long farmId, Long id);
}
