package com.farm.saas.modules.quality.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.quality.dto.request.QcInspectionRequest;
import com.farm.saas.modules.quality.dto.response.QcInspectionDetailResponse;
import com.farm.saas.modules.quality.entity.ProductBatch;
import com.farm.saas.modules.quality.entity.QcInspection;
import com.farm.saas.modules.quality.entity.QcInspectionItem;
import com.farm.saas.modules.quality.repository.ProductBatchRepository;
import com.farm.saas.modules.quality.repository.QcInspectionItemRepository;
import com.farm.saas.modules.quality.repository.QcInspectionRepository;
import com.farm.saas.modules.quality.service.QcInspectionService;
import com.farm.saas.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class QcInspectionServiceImpl implements QcInspectionService {

    private final QcInspectionRepository qcInspectionRepository;
    private final QcInspectionItemRepository qcInspectionItemRepository;
    private final ProductBatchRepository productBatchRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public QcInspectionDetailResponse createInspection(Long farmId, QcInspectionRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        ProductBatch batch = productBatchRepository.findById(request.getProductBatchId())
                .filter(b -> b.getFarmId().equals(farmId))
                .orElseThrow(() -> new ResourceNotFoundException("ProductBatch", "id", request.getProductBatchId()));

        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        boolean isSuperAdmin = currentUser != null && (currentUser.isSuperAdmin() || currentUser.hasRole("ROLE_SUPER_ADMIN"));
        if (!isSuperAdmin && (tenantId == null || !batch.getTenantId().equals(tenantId))) {
            throw new BusinessException("BATCH_ACCESS_DENIED", "Lô thành phẩm không thuộc quyền quản lý của khách thuê hiện tại");
        }

        // Chuẩn hóa overallResult: FAILED -> REJECTED để thỏa mãn SQL check constraint chk_qc_result
        String rawResult = request.getOverallResult();
        String dbOverallResult = "FAILED".equalsIgnoreCase(rawResult) ? "REJECTED" : rawResult;
        if (dbOverallResult == null || dbOverallResult.isBlank()) {
            dbOverallResult = "PENDING";
        }

        // Hỗ trợ lưu trữ thông tin ảnh minh chứng photosJson nếu có
        String notes = request.getNotes();
        if (request.getPhotosJson() != null && !request.getPhotosJson().isBlank()) {
            String photoTag = "[Photos: " + request.getPhotosJson().trim() + "]";
            if (notes == null || notes.isBlank()) {
                notes = photoTag;
            } else if (!notes.contains(request.getPhotosJson().trim())) {
                notes = notes + " " + photoTag;
            }
            if (notes.length() > 500) {
                notes = notes.substring(0, 497) + "...";
            }
        }

        QcInspection inspection = QcInspection.builder()
                .tenantId(tenantId != null ? tenantId : batch.getTenantId())
                .farmId(farmId)
                .productBatchId(batch.getId())
                .inspectionCode(request.getInspectionCode())
                .inspectionDate(request.getInspectionDate())
                .inspectorUserId(currentUserId)
                .sampleSize(request.getSampleSize())
                .sampleUnit(request.getSampleUnit())
                .overallResult(dbOverallResult)
                .notes(notes)
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        inspection = qcInspectionRepository.save(inspection);

        List<QcInspectionItem> savedItems = new ArrayList<>();
        if (request.getItems() != null) {
            for (QcInspectionRequest.QcInspectionItemRequest itemReq : request.getItems()) {
                String paramName = itemReq.getParameterName() != null ? itemReq.getParameterName() : itemReq.getCriterionName();
                String threshold = itemReq.getStandardThreshold() != null ? itemReq.getStandardThreshold() : itemReq.getStandardValue();
                String measured = itemReq.getMeasuredValue() != null ? itemReq.getMeasuredValue() : itemReq.getActualValue();
                Boolean passed = itemReq.getIsPassed() != null ? itemReq.getIsPassed() : itemReq.getPassed();

                String itemNotes = itemReq.getNotes();
                if (itemReq.getUnit() != null && !itemReq.getUnit().isBlank()) {
                    String unitTag = "[ĐVT: " + itemReq.getUnit().trim() + "]";
                    if (itemNotes == null || itemNotes.isBlank()) {
                        itemNotes = unitTag;
                    } else if (!itemNotes.contains(itemReq.getUnit().trim())) {
                        itemNotes = itemNotes + " " + unitTag;
                    }
                    if (itemNotes.length() > 255) {
                        itemNotes = itemNotes.substring(0, 252) + "...";
                    }
                }

                QcInspectionItem item = QcInspectionItem.builder()
                        .inspectionId(inspection.getId())
                        .parameterName(paramName != null ? paramName : "Chỉ tiêu kiểm định")
                        .standardThreshold(threshold != null ? threshold : "Đạt chuẩn")
                        .measuredValue(measured != null ? measured : "0.0")
                        .isPassed(passed != null ? passed : true)
                        .notes(itemNotes)
                        .createdAt(Instant.now())
                        .build();
                savedItems.add(qcInspectionItemRepository.save(item));
            }
        }

        // Cập nhật timestamp của ProductBatch (giữ nguyên status = PENDING_APPROVAL)
        batch.setUpdatedAt(Instant.now());
        batch.setUpdatedBy(currentUserId);
        productBatchRepository.save(batch);

        // Bắn thông báo tự động cho Giám đốc trang trại
        try {
            if (notificationService != null) {
                farmRepository.findById(farmId).ifPresent(farm -> {
                    if (farm.getManagerUserId() != null) {
                        String resultDisplay = "PASSED".equalsIgnoreCase(rawResult) ? "PASSED" : "FAILED";
                        notificationService.sendNotification(
                                batch.getTenantId(),
                                farm.getManagerUserId(),
                                "Biên bản kiểm định KCS lô thành phẩm",
                                String.format("Lô thành phẩm [%s] đã được Kỹ sư KCS kiểm định với kết quả %s và đang chờ phê duyệt.",
                                        batch.getBatchCode(), resultDisplay),
                                "QC",
                                "PRODUCT_BATCH",
                                batch.getId(),
                                "/app/qa-traceability"
                        );
                    }
                });
            }
        } catch (Exception ex) {
            log.warn("Failed to send QC notification to farm manager: {}", ex.getMessage());
        }

        log.info("Created QC inspection id={}, code={}, rawResult={}, dbResult={} for batchId={}",
                inspection.getId(), inspection.getInspectionCode(), rawResult, inspection.getOverallResult(), batch.getId());
        return mapToDetailResponse(inspection, batch, savedItems);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<QcInspectionDetailResponse> getInspections(Long farmId, Pageable pageable) {
        return qcInspectionRepository.findByFarmId(farmId, pageable).map(ins -> {
            ProductBatch batch = productBatchRepository.findById(ins.getProductBatchId()).orElse(null);
            List<QcInspectionItem> items = qcInspectionItemRepository.findByInspectionId(ins.getId());
            return mapToDetailResponse(ins, batch, items);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public QcInspectionDetailResponse getInspectionById(Long farmId, Long id) {
        QcInspection inspection = qcInspectionRepository.findById(id)
                .filter(i -> i.getFarmId().equals(farmId))
                .orElseThrow(() -> new ResourceNotFoundException("QcInspection", "id", id));
        ProductBatch batch = productBatchRepository.findById(inspection.getProductBatchId()).orElse(null);
        List<QcInspectionItem> items = qcInspectionItemRepository.findByInspectionId(inspection.getId());
        return mapToDetailResponse(inspection, batch, items);
    }

    private QcInspectionDetailResponse mapToDetailResponse(QcInspection ins, ProductBatch batch, List<QcInspectionItem> items) {
        String farmName = farmRepository.findById(ins.getFarmId()).map(f -> f.getName()).orElse(null);
        String inspectorName = null;
        if (ins.getInspectorUserId() != null) {
            inspectorName = userRepository.findById(ins.getInspectorUserId())
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername()).orElse(null);
        }

        List<QcInspectionDetailResponse.QcInspectionItemResponse> itemResponses = new ArrayList<>();
        if (items != null) {
            for (QcInspectionItem it : items) {
                itemResponses.add(QcInspectionDetailResponse.QcInspectionItemResponse.builder()
                        .id(it.getId())
                        .parameterName(it.getParameterName())
                        .standardThreshold(it.getStandardThreshold())
                        .measuredValue(it.getMeasuredValue())
                        .isPassed(it.getIsPassed())
                        .notes(it.getNotes())
                        .build());
            }
        }

        return QcInspectionDetailResponse.builder()
                .id(ins.getId())
                .farmId(ins.getFarmId())
                .farmName(farmName)
                .productBatchId(ins.getProductBatchId())
                .batchCode(batch != null ? batch.getBatchCode() : null)
                .productName(batch != null ? batch.getProductName() : null)
                .inspectionCode(ins.getInspectionCode())
                .inspectionDate(ins.getInspectionDate())
                .inspectorUserId(ins.getInspectorUserId())
                .inspectorName(inspectorName)
                .sampleSize(ins.getSampleSize())
                .sampleUnit(ins.getSampleUnit())
                .overallResult(ins.getOverallResult())
                .notes(ins.getNotes())
                .items(itemResponses)
                .createdAt(ins.getCreatedAt())
                .updatedAt(ins.getUpdatedAt())
                .build();
    }
}
