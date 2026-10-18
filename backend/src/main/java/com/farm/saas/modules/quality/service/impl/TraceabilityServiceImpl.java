package com.farm.saas.modules.quality.service.impl;

import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.modules.quality.dto.response.PublicTraceabilityResponse;
import com.farm.saas.modules.quality.entity.ProductBatch;
import com.farm.saas.modules.quality.entity.TraceabilitySnapshot;
import com.farm.saas.modules.quality.repository.ProductBatchRepository;
import com.farm.saas.modules.quality.repository.TraceabilitySnapshotRepository;
import com.farm.saas.modules.quality.service.TraceabilityService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class TraceabilityServiceImpl implements TraceabilityService {

    private final ProductBatchRepository productBatchRepository;
    private final TraceabilitySnapshotRepository traceabilitySnapshotRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public PublicTraceabilityResponse getPublicTraceability(String traceabilityCode) {
        ProductBatch batch = productBatchRepository.findByTraceabilityCode(traceabilityCode)
                .orElseThrow(() -> new ResourceNotFoundException("ProductBatch", "traceabilityCode", traceabilityCode));

        TraceabilitySnapshot snapshot = traceabilitySnapshotRepository.findByProductBatchId(batch.getId())
                .orElseThrow(() -> new ResourceNotFoundException("TraceabilitySnapshot", "productBatchId", batch.getId()));

        // Tăng bộ đếm quét QR công khai (Atomic append/update)
        long currentScans = snapshot.getScanCount() != null ? snapshot.getScanCount() : 0L;
        snapshot.setScanCount(currentScans + 1);
        snapshot.setLastScannedAt(Instant.now());
        snapshot = traceabilitySnapshotRepository.save(snapshot);

        boolean isRecalled = "RECALLED".equals(batch.getStatus());

        Object enterprise = parseJson(snapshot.getEnterpriseInfoJson());
        Object certs = parseJson(snapshot.getVietgapCertJson());
        Object timeline = parseJson(snapshot.getFarmingTimelineJson());
        Object harvest = parseJson(snapshot.getHarvestInfoJson());
        Object qc = parseJson(snapshot.getQcInspectionJson());

        log.info("Public scan for traceabilityCode={}, product={}, scanCount={}", traceabilityCode, batch.getProductName(), snapshot.getScanCount());

        return PublicTraceabilityResponse.builder()
                .traceabilityCode(batch.getTraceabilityCode())
                .productName(batch.getProductName())
                .qualityGrade(batch.getQualityGrade())
                .batchCode(batch.getBatchCode())
                .harvestDate(batch.getHarvestDate())
                .expiryDate(batch.getExpiryDate())
                .storageConditions(batch.getStorageConditions())
                .batchStatus(batch.getStatus())
                .isRecalled(isRecalled)
                .recallReason(isRecalled ? batch.getRecallReason() : null)
                .recalledAt(isRecalled ? batch.getRecalledAt() : null)
                .scanCount(snapshot.getScanCount())
                .lastScannedAt(snapshot.getLastScannedAt())
                .enterprise(enterprise)
                .certifications(certs)
                .farmingTimeline(timeline)
                .harvestInfo(harvest)
                .qcInspection(qc)
                .build();
    }

    private Object parseJson(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception ex) {
            log.warn("Failed to parse JSON snapshot field: {}", ex.getMessage());
            return json;
        }
    }
}
