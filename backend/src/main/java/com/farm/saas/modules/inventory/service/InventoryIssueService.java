package com.farm.saas.modules.inventory.service;

import com.farm.saas.common.exception.AppException;
import com.farm.saas.modules.inventory.dto.request.InventoryIssueCreateRequest;
import com.farm.saas.modules.inventory.dto.request.InventoryIssueItemRequest;
import com.farm.saas.modules.inventory.dto.response.InventoryIssueItemResponse;
import com.farm.saas.modules.inventory.dto.response.InventoryIssueResponse;
import com.farm.saas.modules.inventory.entity.*;
import com.farm.saas.modules.inventory.exception.InsufficientInventoryException;
import com.farm.saas.modules.inventory.repository.*;
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
 * Service xử lý nghiệp vụ Xuất kho (Nghiệp vụ: 3.4. Xuất kho - Inventory Issues).
 * 
 * QUY TẮC BẤT BIẾN & KIẾN TRÚC:
 * 1. Tenant Isolation: Chỉ cho phép xuất từ kho và vật tư thuộc đúng tenant_id của user.
 * 2. The Farm Barrier Guard: Kiểm tra user có quyền truy cập Farm sở hữu kho bãi.
 * 3. ACID & Concurrency: Bọc trong một @Transactional duy nhất.
 *    Dùng Pessimistic Locking (@Lock(LockModeType.PESSIMISTIC_WRITE)) để khóa bản ghi tồn kho trước khi trừ.
 * 4. InsufficientInventoryException: Nếu số lượng xuất vượt quá tồn kho hiện có, NÉM NGAY ngoại lệ để trả về HTTP 400 Bad Request.
 * 5. Không xóa vật lý: Chỉ hủy phiếu bằng trạng thái CANCELLED.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryIssueService {

    private static final Logger log = LoggerFactory.getLogger(InventoryIssueService.class);

    private final InventoryIssueRepository issueRepository;
    private final InventoryIssueDetailRepository issueDetailRepository;
    private final InventoryBalanceRepository balanceRepository;
    private final WarehouseInventoryTransactionRepository transactionRepository;
    private final WarehouseRepository warehouseRepository;
    private final MaterialRepository materialRepository;

    /**
     * Tạo mới Phiếu Xuất kho và trừ tồn kho tức thời (ACID).
     * Ném InsufficientInventoryException (HTTP 400) nếu không đủ số lượng tồn kho.
     */
    @Transactional
    public InventoryIssueResponse createIssue(InventoryIssueCreateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        log.info("Bắt đầu tạo phiếu xuất kho: WarehouseId={}, TenantId={}", request.getWarehouseId(), tenantId);

        // 1. Kiểm tra Kho bãi thuộc Tenant (Tenant Isolation)
        Warehouse warehouse = warehouseRepository.findByIdAndTenantId(request.getWarehouseId(), tenantId)
                .orElseThrow(() -> AppException.notFound("Kho bãi", String.valueOf(request.getWarehouseId())));

        // 2. Kiểm tra quyền truy cập Farm sở hữu Kho (The Farm Barrier Guard)
        SecurityUtils.validateFarmAccess(warehouse.getFarmId());
        Long farmId = warehouse.getFarmId();

        // 3. Kiểm tra mã phiếu xuất (tự sinh nếu không truyền)
        String issueCode = request.getIssueCode();
        if (issueCode == null || issueCode.trim().isBlank()) {
            issueCode = generateIssueCode(tenantId, farmId);
        } else {
            issueCode = issueCode.trim().toUpperCase();
            if (issueRepository.existsByTenantIdAndFarmIdAndIssueCode(tenantId, farmId, issueCode)) {
                throw AppException.conflict("Mã phiếu xuất kho '" + issueCode + "' đã tồn tại trong trang trại!");
            }
        }

        // 4. Kiểm tra từng mặt hàng vật tư xuất kho
        Map<Long, Material> materialMap = new HashMap<>();
        for (InventoryIssueItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw AppException.badRequest("Số lượng xuất kho phải lớn hơn 0!");
            }
            if (itemReq.getUnitPrice() != null && itemReq.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw AppException.badRequest("Đơn giá xuất kho không được âm!");
            }

            // Kiểm tra vật tư thuộc Tenant (Tenant Isolation)
            Material mat = materialMap.computeIfAbsent(itemReq.getMaterialId(), matId ->
                    materialRepository.findByIdAndTenantId(matId, tenantId)
                            .orElseThrow(() -> AppException.notFound("Vật tư", String.valueOf(matId)))
            );
        }

        // 5. Khóa bi quan (Pessimistic Write Lock) & Kiểm tra tồn kho khả dụng cho TẤT CẢ các dòng hàng
        // Nếu phát hiện bất kỳ dòng hàng nào vượt tồn kho, Ném InsufficientInventoryException (HTTP 400 Bad Request)
        List<InventoryBalance> lockedBalances = new ArrayList<>();
        List<BigDecimal> unitPrices = new ArrayList<>();
        List<BigDecimal> itemTotals = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (InventoryIssueItemRequest itemReq : request.getItems()) {
            InventoryBalance balance = balanceRepository
                    .findWithLockByWarehouseIdAndMaterialIdAndBatchNumber(
                            warehouse.getId(), itemReq.getMaterialId(), itemReq.getBatchNumber().trim())
                    .orElse(null);

            BigDecimal availableQty = balance != null ? balance.getQuantityOnHand() : BigDecimal.ZERO;

            // KIỂM TRA TỒN KHO: Nếu số lượng yêu cầu xuất > số lượng tồn khả dụng
            if (balance == null || availableQty.compareTo(itemReq.getQuantity()) < 0) {
                log.warn("Lỗi xuất kho vượt tồn: MaterialId={}, Batch={}, Requested={}, Available={}",
                        itemReq.getMaterialId(), itemReq.getBatchNumber(), itemReq.getQuantity(), availableQty);
                throw new InsufficientInventoryException(
                        itemReq.getMaterialId(), itemReq.getBatchNumber(), itemReq.getQuantity(), availableQty);
            }

            // Xác định đơn giá xuất: Nếu request có truyền thì lấy, nếu không lấy đơn giá vốn tồn kho
            BigDecimal unitPrice = itemReq.getUnitPrice();
            if (unitPrice == null) {
                unitPrice = balance.getUnitCost();
            }

            BigDecimal itemTotal = itemReq.getQuantity().multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
            totalAmount = totalAmount.add(itemTotal);

            lockedBalances.add(balance);
            unitPrices.add(unitPrice);
            itemTotals.add(itemTotal);
        }

        // 6. Khởi tạo Entity Phiếu xuất kho (warehouse_issues)
        InventoryIssue issue = InventoryIssue.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .warehouseId(warehouse.getId())
                .issueCode(issueCode)
                .issueType(request.getIssueType())
                .receiverName(request.getReceiverName())
                .seasonId(request.getSeasonId())
                .farmingLogId(request.getFarmingLogId())
                .livestockEventId(request.getLivestockEventId())
                .isBackflushed(false)
                .issueDate(request.getIssueDate())
                .totalAmount(totalAmount)
                .notes(request.getNotes())
                .status(IssueStatus.COMPLETED)
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();

        // 7. Thêm chi tiết các dòng hàng (warehouse_issue_items)
        for (int i = 0; i < request.getItems().size(); i++) {
            InventoryIssueItemRequest itemReq = request.getItems().get(i);
            BigDecimal unitPrice = unitPrices.get(i);
            BigDecimal itemTotal = itemTotals.get(i);

            InventoryIssueDetail detail = InventoryIssueDetail.builder()
                    .tenantId(tenantId)
                    .materialId(itemReq.getMaterialId())
                    .batchNumber(itemReq.getBatchNumber().trim())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .totalPrice(itemTotal)
                    .createdBy(currentUserId)
                    .updatedBy(currentUserId)
                    .build();

            issue.addItem(detail);
        }

        // Lưu chứng từ và các dòng chi tiết
        InventoryIssue savedIssue = issueRepository.save(issue);

        // 8. Trừ số lượng tồn kho và ghi Sổ cái biến động kho (Audit Stock Ledger)
        for (int i = 0; i < savedIssue.getItems().size(); i++) {
            InventoryIssueDetail detail = savedIssue.getItems().get(i);
            InventoryBalance balance = lockedBalances.get(i);

            BigDecimal balanceBefore = balance.getQuantityOnHand();
            BigDecimal balanceAfter = balanceBefore.subtract(detail.getQuantity());

            balance.setQuantityOnHand(balanceAfter);
            balance.setUpdatedBy(currentUserId);
            balanceRepository.save(balance);

            // Ghi nhận biến động xuất kho vào Sổ cái
            WarehouseInventoryTransaction transaction = WarehouseInventoryTransaction.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .warehouseId(warehouse.getId())
                    .materialId(detail.getMaterialId())
                    .batchNumber(detail.getBatchNumber())
                    .transactionType(TransactionType.OUTWARD)
                    .referenceDocType(ReferenceDocType.WAREHOUSE_ISSUE)
                    .referenceDocId(savedIssue.getId())
                    .referenceItemId(detail.getId())
                    .direction(TransactionDirection.OUT)
                    .quantity(detail.getQuantity())
                    .unitPrice(detail.getUnitPrice())
                    .totalAmount(detail.getTotalPrice())
                    .balanceBefore(balanceBefore)
                    .balanceAfter(balanceAfter)
                    .transactionDate(savedIssue.getIssueDate())
                    .notes("Xuất kho theo chứng từ số: " + savedIssue.getIssueCode())
                    .createdBy(currentUserId)
                    .build();

            transactionRepository.save(transaction);
        }

        log.info("Tạo thành công phiếu xuất kho ID={}, Mã={}", savedIssue.getId(), savedIssue.getIssueCode());
        return mapToResponse(savedIssue, warehouse.getName(), materialMap);
    }

    /**
     * Lấy danh sách phiếu xuất kho theo Trang trại có phân trang.
     */
    public Page<InventoryIssueResponse> getIssues(Long farmId, Long warehouseId, Pageable pageable) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        if (farmId != null) {
            SecurityUtils.validateFarmAccess(farmId);
        }

        Page<InventoryIssue> page;
        if (farmId != null && warehouseId != null) {
            page = issueRepository.findAllByTenantIdAndFarmIdAndWarehouseId(tenantId, farmId, warehouseId, pageable);
        } else if (farmId != null) {
            page = issueRepository.findAllByTenantIdAndFarmId(tenantId, farmId, pageable);
        } else {
            page = issueRepository.findAllByTenantId(tenantId, pageable);
        }

        return page.map(i -> {
            Warehouse wh = warehouseRepository.findByIdAndTenantId(i.getWarehouseId(), tenantId).orElse(null);
            return mapToResponse(i, wh != null ? wh.getName() : null, null);
        });
    }

    /**
     * Lấy chi tiết một Phiếu Xuất kho.
     */
    public InventoryIssueResponse getIssueById(Long id) {
        Long tenantId = SecurityUtils.getRequiredTenantId();

        InventoryIssue issue = issueRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Phiếu xuất kho", String.valueOf(id)));

        SecurityUtils.validateFarmAccess(issue.getFarmId());

        Warehouse wh = warehouseRepository.findByIdAndTenantId(issue.getWarehouseId(), tenantId).orElse(null);

        Map<Long, Material> materialMap = new HashMap<>();
        for (InventoryIssueDetail d : issue.getItems()) {
            materialRepository.findByIdAndTenantId(d.getMaterialId(), tenantId)
                    .ifPresent(m -> materialMap.put(m.getId(), m));
        }

        return mapToResponse(issue, wh != null ? wh.getName() : null, materialMap);
    }

    /**
     * Hủy Phiếu Xuất kho (Chuyển trạng thái CANCELLED, hoàn cộng lại tồn kho an toàn).
     */
    @Transactional
    public void cancelIssue(Long id, String reason) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        InventoryIssue issue = issueRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Phiếu xuất kho", String.valueOf(id)));

        SecurityUtils.validateFarmAccess(issue.getFarmId());

        if (issue.getStatus() == IssueStatus.CANCELLED) {
            throw AppException.badRequest("Phiếu xuất kho này đã được hủy trước đó!");
        }

        // Hoàn cộng lại tồn kho cho từng dòng hàng
        for (InventoryIssueDetail detail : issue.getItems()) {
            InventoryBalance balance = balanceRepository
                    .findWithLockByWarehouseIdAndMaterialIdAndBatchNumber(
                            issue.getWarehouseId(), detail.getMaterialId(), detail.getBatchNumber())
                    .orElseThrow(() -> AppException.badRequest("Không tìm thấy tồn kho để hoàn hủy phiếu!"));

            BigDecimal balanceBefore = balance.getQuantityOnHand();
            BigDecimal balanceAfter = balanceBefore.add(detail.getQuantity());
            balance.setQuantityOnHand(balanceAfter);
            balance.setUpdatedBy(currentUserId);
            balanceRepository.save(balance);

            // Ghi nhận biến động hủy xuất kho vào sổ cái (chiều IN)
            WarehouseInventoryTransaction trans = WarehouseInventoryTransaction.builder()
                    .tenantId(tenantId)
                    .farmId(issue.getFarmId())
                    .warehouseId(issue.getWarehouseId())
                    .materialId(detail.getMaterialId())
                    .batchNumber(detail.getBatchNumber())
                    .transactionType(TransactionType.CANCELLATION_REVERSAL)
                    .referenceDocType(ReferenceDocType.WAREHOUSE_ISSUE)
                    .referenceDocId(issue.getId())
                    .referenceItemId(detail.getId())
                    .direction(TransactionDirection.IN)
                    .quantity(detail.getQuantity())
                    .unitPrice(detail.getUnitPrice())
                    .totalAmount(detail.getTotalPrice())
                    .balanceBefore(balanceBefore)
                    .balanceAfter(balanceAfter)
                    .transactionDate(LocalDate.now())
                    .notes("Hủy phiếu xuất kho số: " + issue.getIssueCode() + ". Lý do: " + reason)
                    .createdBy(currentUserId)
                    .build();

            transactionRepository.save(trans);
        }

        issue.setStatus(IssueStatus.CANCELLED);
        issue.setCancelledAt(Instant.now());
        issue.setCancelledBy(currentUserId);
        issue.setCancellationReason(reason);
        issue.setUpdatedBy(currentUserId);
        issueRepository.save(issue);

        log.info("Đã hủy thành công phiếu xuất kho ID={}", id);
    }

    private String generateIssueCode(Long tenantId, Long farmId) {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randPart = String.format("%04d", ThreadLocalRandom.current().nextInt(1000, 9999));
        return "PXK-" + datePart + "-" + randPart;
    }

    private InventoryIssueResponse mapToResponse(
            InventoryIssue issue, String warehouseName, Map<Long, Material> materialMap) {
        List<InventoryIssueItemResponse> itemResponses = issue.getItems().stream().map(d -> {
            Material m = materialMap != null ? materialMap.get(d.getMaterialId()) : null;
            return InventoryIssueItemResponse.builder()
                    .id(d.getId())
                    .materialId(d.getMaterialId())
                    .materialCode(m != null ? m.getSkuCode() : null)
                    .materialName(m != null ? m.getName() : null)
                    .standardUnit(m != null ? m.getStandardUnit() : null)
                    .batchNumber(d.getBatchNumber())
                    .quantity(d.getQuantity())
                    .unitPrice(d.getUnitPrice())
                    .totalPrice(d.getTotalPrice())
                    .build();
        }).collect(Collectors.toList());

        return InventoryIssueResponse.builder()
                .id(issue.getId())
                .tenantId(issue.getTenantId())
                .farmId(issue.getFarmId())
                .warehouseId(issue.getWarehouseId())
                .warehouseName(warehouseName)
                .issueCode(issue.getIssueCode())
                .issueType(issue.getIssueType())
                .receiverName(issue.getReceiverName())
                .seasonId(issue.getSeasonId())
                .farmingLogId(issue.getFarmingLogId())
                .livestockEventId(issue.getLivestockEventId())
                .isBackflushed(issue.getIsBackflushed())
                .issueDate(issue.getIssueDate())
                .totalAmount(issue.getTotalAmount())
                .notes(issue.getNotes())
                .status(issue.getStatus())
                .items(itemResponses)
                .createdAt(issue.getCreatedAt())
                .createdBy(issue.getCreatedBy())
                .build();
    }
}
