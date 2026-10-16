package com.farm.saas.modules.inventory.service;

import com.farm.saas.common.exception.AppException;
import com.farm.saas.modules.inventory.dto.request.InventoryReceiptCreateRequest;
import com.farm.saas.modules.inventory.dto.request.InventoryReceiptItemRequest;
import com.farm.saas.modules.inventory.dto.response.InventoryReceiptItemResponse;
import com.farm.saas.modules.inventory.dto.response.InventoryReceiptResponse;
import com.farm.saas.modules.inventory.entity.*;
import com.farm.saas.modules.inventory.repository.*;
import com.farm.saas.modules.organization.entity.Partner;
import com.farm.saas.modules.organization.repository.PartnerRepository;
import com.farm.saas.security.authorization.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

/**
 * Service xử lý nghiệp vụ Nhập kho (Nghiệp vụ: 3.3. Nhập kho - Inventory Receipts).
 * 
 * QUY TẮC BẤT BIẾN & KIẾN TRÚC:
 * 1. Tenant Isolation: Chỉ thao tác trên kho và vật tư thuộc đúng tenant_id của user hiện tại.
 * 2. The Farm Barrier Guard: Kiểm tra user có quyền truy cập Farm sở hữu kho bãi.
 * 3. ACID & Concurrency: Bọc trong @Transactional duy nhất, cập nhật tồn kho bằng Pessimistic Lock
 *    hoặc Optimistic Lock trên InventoryBalance để chống xung đột Race Condition.
 * 4. Không xóa vật lý: Chỉ hủy phiếu bằng cách đổi trạng thái CANCELLED.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryReceiptService {

    private static final Logger log = LoggerFactory.getLogger(InventoryReceiptService.class);

    private final InventoryReceiptRepository receiptRepository;
    private final InventoryReceiptDetailRepository receiptDetailRepository;
    private final InventoryBalanceRepository balanceRepository;
    private final WarehouseInventoryTransactionRepository transactionRepository;
    private final WarehouseRepository warehouseRepository;
    private final MaterialRepository materialRepository;
    private final PartnerRepository partnerRepository;

    /**
     * Tạo mới Phiếu Nhập kho và cập nhật tăng tồn kho tức thời (ACID).
     */
    @Transactional
    public InventoryReceiptResponse createReceipt(InventoryReceiptCreateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        log.info("Bắt đầu tạo phiếu nhập kho: WarehouseId={}, TenantId={}", request.getWarehouseId(), tenantId);

        // 1. Kiểm tra Kho bãi thuộc Tenant (Tenant Isolation)
        Warehouse warehouse = warehouseRepository.findByIdAndTenantId(request.getWarehouseId(), tenantId)
                .orElseThrow(() -> AppException.notFound("Kho bãi", String.valueOf(request.getWarehouseId())));

        // 2. Kiểm tra quyền truy cập Farm sở hữu Kho (The Farm Barrier Guard)
        SecurityUtils.validateFarmAccess(warehouse.getFarmId());
        Long farmId = warehouse.getFarmId();

        // 3. Kiểm tra Nhà cung cấp / Đối tác (nếu có truyền vào)
        Partner partner = null;
        if (request.getPartnerId() != null) {
            partner = partnerRepository.findByIdAndTenantId(request.getPartnerId(), tenantId)
                    .orElseThrow(() -> AppException.notFound("Nhà cung cấp", String.valueOf(request.getPartnerId())));
        }

        // 4. Kiểm tra mã phiếu nhập (tự sinh nếu không truyền)
        String receiptCode = request.getReceiptCode();
        if (receiptCode == null || receiptCode.trim().isBlank()) {
            receiptCode = generateReceiptCode(tenantId, farmId);
        } else {
            receiptCode = receiptCode.trim().toUpperCase();
            if (receiptRepository.existsByTenantIdAndFarmIdAndReceiptCode(tenantId, farmId, receiptCode)) {
                throw AppException.conflict("Mã phiếu nhập kho '" + receiptCode + "' đã tồn tại trong trang trại!");
            }
        }

        // 5. Kiểm tra tính hợp lệ của từng mặt hàng vật tư nhập kho
        Map<Long, Material> materialMap = new HashMap<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (InventoryReceiptItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw AppException.badRequest("Số lượng nhập kho phải lớn hơn 0!");
            }
            if (itemReq.getUnitPrice() == null || itemReq.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw AppException.badRequest("Đơn giá nhập kho không được âm!");
            }

            // Kiểm tra vật tư thuộc Tenant (Tenant Isolation)
            Material mat = materialMap.computeIfAbsent(itemReq.getMaterialId(), matId ->
                    materialRepository.findByIdAndTenantId(matId, tenantId)
                            .orElseThrow(() -> AppException.notFound("Vật tư", String.valueOf(matId)))
            );

            BigDecimal itemTotalPrice = itemReq.getQuantity().multiply(itemReq.getUnitPrice())
                    .setScale(2, RoundingMode.HALF_UP);
            totalAmount = totalAmount.add(itemTotalPrice);
        }

        // 6. Khởi tạo Entity Phiếu nhập kho (warehouse_receipts)
        InventoryReceipt receipt = InventoryReceipt.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .warehouseId(warehouse.getId())
                .receiptCode(receiptCode)
                .receiptType(request.getReceiptType())
                .partnerId(partner != null ? partner.getId() : null)
                .receiptDate(request.getReceiptDate())
                .totalAmount(totalAmount)
                .notes(request.getNotes())
                .status(ReceiptStatus.COMPLETED) // Nhập kho hoàn tất hạch toán vào thẻ kho
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();

        // 7. Thêm chi tiết các dòng hàng (warehouse_receipt_items)
        for (InventoryReceiptItemRequest itemReq : request.getItems()) {
            BigDecimal itemTotalPrice = itemReq.getQuantity().multiply(itemReq.getUnitPrice())
                    .setScale(2, RoundingMode.HALF_UP);

            InventoryReceiptDetail detail = InventoryReceiptDetail.builder()
                    .tenantId(tenantId)
                    .materialId(itemReq.getMaterialId())
                    .batchNumber(itemReq.getBatchNumber().trim())
                    .expiryDate(itemReq.getExpiryDate())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice())
                    .totalPrice(itemTotalPrice)
                    .storageBinCode(itemReq.getStorageBinCode())
                    .createdBy(currentUserId)
                    .updatedBy(currentUserId)
                    .build();

            receipt.addItem(detail);
        }

        // Lưu chứng từ và các dòng chi tiết
        InventoryReceipt savedReceipt = receiptRepository.save(receipt);

        // 8. Cập nhật Tồn kho (warehouse_inventory) và Ghi Sổ cái biến động kho (warehouse_inventory_transactions)
        // Áp dụng cơ chế Pessimistic Locking hoặc Optimistic Lock để bảo đảm ACID tuyệt đối
        for (InventoryReceiptDetail detail : savedReceipt.getItems()) {
            // Tìm bản ghi tồn kho có khóa ghi (Pessimistic Write Lock)
            Optional<InventoryBalance> balanceOpt = balanceRepository
                    .findWithLockByWarehouseIdAndMaterialIdAndBatchNumber(
                            warehouse.getId(), detail.getMaterialId(), detail.getBatchNumber());

            BigDecimal balanceBefore;
            BigDecimal balanceAfter;
            InventoryBalance balance;

            if (balanceOpt.isPresent()) {
                balance = balanceOpt.get();
                balanceBefore = balance.getQuantityOnHand();
                balanceAfter = balanceBefore.add(detail.getQuantity());

                // Tính toán đơn giá vốn bình quân gia quyền mới của lô
                BigDecimal currentTotalVal = balanceBefore.multiply(balance.getUnitCost());
                BigDecimal incomingVal = detail.getTotalPrice();
                BigDecimal newUnitCost = currentTotalVal.add(incomingVal)
                        .divide(balanceAfter, 2, RoundingMode.HALF_UP);

                balance.setQuantityOnHand(balanceAfter);
                balance.setUnitCost(newUnitCost);
                if (detail.getExpiryDate() != null) {
                    balance.setExpiryDate(detail.getExpiryDate());
                }
                balance.setUpdatedBy(currentUserId);
            } else {
                balanceBefore = BigDecimal.ZERO;
                balanceAfter = detail.getQuantity();

                balance = InventoryBalance.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .warehouseId(warehouse.getId())
                        .materialId(detail.getMaterialId())
                        .batchNumber(detail.getBatchNumber())
                        .inwardDate(savedReceipt.getReceiptDate())
                        .expiryDate(detail.getExpiryDate())
                        .unitCost(detail.getUnitPrice())
                        .quantityOnHand(detail.getQuantity())
                        .reservedQuantity(BigDecimal.ZERO)
                        .storageBinCode(detail.getStorageBinCode())
                        .createdBy(currentUserId)
                        .updatedBy(currentUserId)
                        .build();
            }

            balanceRepository.save(balance);

            // Ghi nhận dòng kiểm toán vào Sổ cái biến động kho (Audit Stock Ledger)
            WarehouseInventoryTransaction transaction = WarehouseInventoryTransaction.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .warehouseId(warehouse.getId())
                    .materialId(detail.getMaterialId())
                    .batchNumber(detail.getBatchNumber())
                    .transactionType(TransactionType.INWARD)
                    .referenceDocType(ReferenceDocType.WAREHOUSE_RECEIPT)
                    .referenceDocId(savedReceipt.getId())
                    .referenceItemId(detail.getId())
                    .direction(TransactionDirection.IN)
                    .quantity(detail.getQuantity())
                    .unitPrice(detail.getUnitPrice())
                    .totalAmount(detail.getTotalPrice())
                    .balanceBefore(balanceBefore)
                    .balanceAfter(balanceAfter)
                    .transactionDate(savedReceipt.getReceiptDate())
                    .notes("Nhập kho theo chứng từ số: " + savedReceipt.getReceiptCode())
                    .createdBy(currentUserId)
                    .build();

            transactionRepository.save(transaction);
        }

        log.info("Tạo thành công phiếu nhập kho ID={}, Mã={}", savedReceipt.getId(), savedReceipt.getReceiptCode());
        return mapToResponse(savedReceipt, warehouse.getName(), partner != null ? partner.getName() : null, materialMap);
    }

    /**
     * Lấy danh sách phiếu nhập kho theo Trang trại có phân trang.
     */
    public Page<InventoryReceiptResponse> getReceipts(Long farmId, Long warehouseId, Pageable pageable) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        if (farmId != null) {
            SecurityUtils.validateFarmAccess(farmId);
        }

        Page<InventoryReceipt> page;
        if (farmId != null && warehouseId != null) {
            page = receiptRepository.findAllByTenantIdAndFarmIdAndWarehouseId(tenantId, farmId, warehouseId, pageable);
        } else if (farmId != null) {
            page = receiptRepository.findAllByTenantIdAndFarmId(tenantId, farmId, pageable);
        } else {
            page = receiptRepository.findAllByTenantId(tenantId, pageable);
        }

        return page.map(r -> {
            Warehouse wh = warehouseRepository.findByIdAndTenantId(r.getWarehouseId(), tenantId).orElse(null);
            Partner p = r.getPartnerId() != null ? partnerRepository.findByIdAndTenantId(r.getPartnerId(), tenantId).orElse(null) : null;
            return mapToResponse(r, wh != null ? wh.getName() : null, p != null ? p.getName() : null, null);
        });
    }

    /**
     * Lấy chi tiết một Phiếu Nhập kho.
     */
    public InventoryReceiptResponse getReceiptById(Long id) {
        Long tenantId = SecurityUtils.getRequiredTenantId();

        InventoryReceipt receipt = receiptRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Phiếu nhập kho", String.valueOf(id)));

        SecurityUtils.validateFarmAccess(receipt.getFarmId());

        Warehouse wh = warehouseRepository.findByIdAndTenantId(receipt.getWarehouseId(), tenantId).orElse(null);
        Partner p = receipt.getPartnerId() != null ? partnerRepository.findByIdAndTenantId(receipt.getPartnerId(), tenantId).orElse(null) : null;

        Map<Long, Material> materialMap = new HashMap<>();
        for (InventoryReceiptDetail d : receipt.getItems()) {
            materialRepository.findByIdAndTenantId(d.getMaterialId(), tenantId)
                    .ifPresent(m -> materialMap.put(m.getId(), m));
        }

        return mapToResponse(receipt, wh != null ? wh.getName() : null, p != null ? p.getName() : null, materialMap);
    }

    /**
     * Hủy Phiếu Nhập kho (Chuyển trạng thái CANCELLED, hoàn trừ tồn kho an toàn).
     */
    @Transactional
    public void cancelReceipt(Long id, String reason) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        InventoryReceipt receipt = receiptRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Phiếu nhập kho", String.valueOf(id)));

        SecurityUtils.validateFarmAccess(receipt.getFarmId());

        if (receipt.getStatus() == ReceiptStatus.CANCELLED) {
            throw AppException.badRequest("Phiếu nhập kho này đã được hủy trước đó!");
        }

        // Hoàn trừ tồn kho cho từng dòng hàng
        for (InventoryReceiptDetail detail : receipt.getItems()) {
            InventoryBalance balance = balanceRepository
                    .findWithLockByWarehouseIdAndMaterialIdAndBatchNumber(
                            receipt.getWarehouseId(), detail.getMaterialId(), detail.getBatchNumber())
                    .orElseThrow(() -> AppException.badRequest("Không tìm thấy tồn kho để hoàn hủy phiếu!"));

            if (balance.getQuantityOnHand().compareTo(detail.getQuantity()) < 0) {
                throw AppException.badRequest(String.format(
                        "Không thể hủy phiếu nhập: Số lượng tồn kho hiện tại (%s) nhỏ hơn số lượng đã nhập (%s) do đã phát sinh xuất kho!",
                        balance.getQuantityOnHand(), detail.getQuantity()));
            }

            BigDecimal balanceBefore = balance.getQuantityOnHand();
            BigDecimal balanceAfter = balanceBefore.subtract(detail.getQuantity());
            balance.setQuantityOnHand(balanceAfter);
            balance.setUpdatedBy(currentUserId);
            balanceRepository.save(balance);

            // Ghi nhận biến động hủy nhập kho vào sổ cái
            WarehouseInventoryTransaction trans = WarehouseInventoryTransaction.builder()
                    .tenantId(tenantId)
                    .farmId(receipt.getFarmId())
                    .warehouseId(receipt.getWarehouseId())
                    .materialId(detail.getMaterialId())
                    .batchNumber(detail.getBatchNumber())
                    .transactionType(TransactionType.CANCELLATION_REVERSAL)
                    .referenceDocType(ReferenceDocType.WAREHOUSE_RECEIPT)
                    .referenceDocId(receipt.getId())
                    .referenceItemId(detail.getId())
                    .direction(TransactionDirection.OUT)
                    .quantity(detail.getQuantity())
                    .unitPrice(detail.getUnitPrice())
                    .totalAmount(detail.getTotalPrice())
                    .balanceBefore(balanceBefore)
                    .balanceAfter(balanceAfter)
                    .transactionDate(LocalDate.now())
                    .notes("Hủy phiếu nhập kho số: " + receipt.getReceiptCode() + ". Lý do: " + reason)
                    .createdBy(currentUserId)
                    .build();

            transactionRepository.save(trans);
        }

        receipt.setStatus(ReceiptStatus.CANCELLED);
        receipt.setCancelledAt(Instant.now());
        receipt.setCancelledBy(currentUserId);
        receipt.setCancellationReason(reason);
        receipt.setUpdatedBy(currentUserId);
        receiptRepository.save(receipt);

        log.info("Đã hủy thành công phiếu nhập kho ID={}", id);
    }

    private String generateReceiptCode(Long tenantId, Long farmId) {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randPart = String.format("%04d", ThreadLocalRandom.current().nextInt(1000, 9999));
        return "PNK-" + datePart + "-" + randPart;
    }

    private InventoryReceiptResponse mapToResponse(
            InventoryReceipt r, String warehouseName, String partnerName, Map<Long, Material> materialMap) {
        List<InventoryReceiptItemResponse> itemResponses = r.getItems().stream().map(d -> {
            Material m = materialMap != null ? materialMap.get(d.getMaterialId()) : null;
            return InventoryReceiptItemResponse.builder()
                    .id(d.getId())
                    .materialId(d.getMaterialId())
                    .materialCode(m != null ? m.getSkuCode() : null)
                    .materialName(m != null ? m.getName() : null)
                    .standardUnit(m != null ? m.getStandardUnit() : null)
                    .batchNumber(d.getBatchNumber())
                    .expiryDate(d.getExpiryDate())
                    .quantity(d.getQuantity())
                    .unitPrice(d.getUnitPrice())
                    .totalPrice(d.getTotalPrice())
                    .storageBinCode(d.getStorageBinCode())
                    .build();
        }).collect(Collectors.toList());

        return InventoryReceiptResponse.builder()
                .id(r.getId())
                .tenantId(r.getTenantId())
                .farmId(r.getFarmId())
                .warehouseId(r.getWarehouseId())
                .warehouseName(warehouseName)
                .receiptCode(r.getReceiptCode())
                .receiptType(r.getReceiptType())
                .partnerId(r.getPartnerId())
                .partnerName(partnerName)
                .receiptDate(r.getReceiptDate())
                .totalAmount(r.getTotalAmount())
                .notes(r.getNotes())
                .status(r.getStatus())
                .items(itemResponses)
                .createdAt(r.getCreatedAt())
                .createdBy(r.getCreatedBy())
                .build();
    }
}
