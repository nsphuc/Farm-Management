package com.farmsaas.modules.traceability.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.traceability.dto.PublicTraceabilityResponse;
import com.farmsaas.modules.traceability.entity.ProductBatch;
import com.farmsaas.modules.traceability.entity.TraceabilitySnapshot;
import com.farmsaas.modules.traceability.entity.enums.ProductBatchStatus;
import com.farmsaas.modules.traceability.repository.ProductBatchRepository;
import com.farmsaas.modules.traceability.repository.TraceabilitySnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PublicTraceabilityServiceImpl implements PublicTraceabilityService {

    private final ProductBatchRepository productBatchRepository;
    private final TraceabilitySnapshotRepository snapshotRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public PublicTraceabilityResponse getPublicTraceability(String traceabilityCode) {
        if (traceabilityCode == null || traceabilityCode.isBlank()) {
            throw new EntityNotFoundException("Mã truy xuất nguồn gốc không hợp lệ.");
        }

        ProductBatch batch = productBatchRepository.findByTraceabilityCode(traceabilityCode.trim())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông tin nông sản với mã truy xuất: " + traceabilityCode));

        // Nếu lô đang chờ duyệt hoặc đã bị từ chối -> Không công khai
        if (batch.getStatus() == ProductBatchStatus.PENDING_APPROVAL || batch.getStatus() == ProductBatchStatus.REJECTED) {
            throw new EntityNotFoundException("Lô nông sản này chưa được kiểm định phê duyệt an toàn để công bố công khai.");
        }

        TraceabilitySnapshot snapshot = snapshotRepository.findByProductBatchId(batch.getId()).orElse(null);

        Map<String, Object> enterpriseInfo = Collections.emptyMap();
        Map<String, Object> vietgapCert = Collections.emptyMap();
        Map<String, Object> harvestInfo = Collections.emptyMap();
        List<Map<String, Object>> timeline = Collections.emptyList();

        if (snapshot != null) {
            try {
                if (snapshot.getEnterpriseInfoJson() != null) {
                    enterpriseInfo = objectMapper.readValue(snapshot.getEnterpriseInfoJson(), new TypeReference<>() {});
                }
                if (snapshot.getVietgapCertJson() != null) {
                    vietgapCert = objectMapper.readValue(snapshot.getVietgapCertJson(), new TypeReference<>() {});
                }
                if (snapshot.getHarvestInfoJson() != null) {
                    harvestInfo = objectMapper.readValue(snapshot.getHarvestInfoJson(), new TypeReference<>() {});
                }
                if (snapshot.getFarmingTimelineJson() != null) {
                    timeline = objectMapper.readValue(snapshot.getFarmingTimelineJson(), new TypeReference<>() {});
                }
            } catch (Exception e) {
                log.error("Error deserializing traceability snapshot for Batch ID: {}", batch.getId(), e);
            }
        }

        boolean isRecalled = (batch.getStatus() == ProductBatchStatus.RECALLED);

        return PublicTraceabilityResponse.builder()
                .traceabilityCode(batch.getTraceabilityCode())
                .productName(batch.getProductName())
                .qualityGrade(batch.getQualityGrade())
                .harvestDate(batch.getHarvestDate())
                .expiryDate(batch.getExpiryDate())
                .unit(batch.getUnit())
                .qrImageUrl(batch.getQrImageUrl())
                .recalled(isRecalled)
                .recallReason(isRecalled ? batch.getRecallReason() : null)
                .enterpriseInfo(enterpriseInfo)
                .vietgapCert(vietgapCert)
                .harvestInfo(harvestInfo)
                .farmingTimeline(timeline)
                .build();
    }
}
