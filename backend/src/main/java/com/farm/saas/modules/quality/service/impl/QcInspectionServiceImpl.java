package com.farm.saas.modules.quality.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.ResourceNotFoundException;
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

    @Override
    @Transactional
    public QcInspectionDetailResponse createInspection(Long farmId, QcInspectionRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        ProductBatch batch = productBatchRepository.findById(request.getProductBatchId())
                .filter(b -> b.getFarmId().equals(farmId))
                .orElseThrow(() -> new ResourceNotFoundException("ProductBatch", "id", request.getProductBatchId()));

        if (!batch.getTenantId().equals(tenantId)) {
            throw new BusinessException("BATCH_ACCESS_DENIED", "Lô thành phẩm không thuộc quyền quản lý của khách thuê hiện tại");
        }

        QcInspection inspection = QcInspection.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .productBatchId(batch.getId())
                .inspectionCode(request.getInspectionCode())
                .inspectionDate(request.getInspectionDate())
                .inspectorUserId(currentUserId)
                .sampleSize(request.getSampleSize())
                .sampleUnit(request.getSampleUnit())
                .overallResult(request.getOverallResult())
                .notes(request.getNotes())
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        inspection = qcInspectionRepository.save(inspection);

        List<QcInspectionItem> savedItems = new ArrayList<>();
        if (request.getItems() != null) {
            for (QcInspectionRequest.QcInspectionItemRequest itemReq : request.getItems()) {
                QcInspectionItem item = QcInspectionItem.builder()
                        .inspectionId(inspection.getId())
                        .parameterName(itemReq.getParameterName())
                        .standardThreshold(itemReq.getStandardThreshold())
                        .measuredValue(itemReq.getMeasuredValue())
                        .isPassed(itemReq.getIsPassed())
                        .notes(itemReq.getNotes())
                        .createdAt(Instant.now())
                        .build();
                savedItems.add(qcInspectionItemRepository.save(item));
            }
        }

        log.info("Created QC inspection id={}, code={}, result={} for batchId={}", inspection.getId(), inspection.getInspectionCode(), inspection.getOverallResult(), batch.getId());
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
