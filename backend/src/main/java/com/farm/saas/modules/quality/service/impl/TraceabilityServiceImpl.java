package com.farm.saas.modules.quality.service.impl;

import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.modules.quality.dto.response.PublicTraceabilityResponse;
import com.farm.saas.modules.quality.entity.ProductBatch;
import com.farm.saas.modules.quality.entity.TraceabilitySnapshot;
import com.farm.saas.modules.quality.repository.ProductBatchRepository;
import com.farm.saas.modules.quality.repository.TraceabilitySnapshotRepository;
import com.farm.saas.modules.quality.service.TraceabilityService;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.masterdata.entity.CropType;
import com.farm.saas.modules.masterdata.entity.LivestockBreed;
import com.farm.saas.modules.masterdata.repository.CropTypeRepository;
import com.farm.saas.modules.masterdata.repository.LivestockBreedRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

/**
 * Cung cấp dịch vụ tra cứu thông tin truy xuất nguồn gốc công khai (Public Traceability).
 * Phục vụ người tiêu dùng quét mã QR để tra cứu nhật ký canh tác, chứng chỉ an toàn VietGAP,
 * biên bản KCS kiểm định chất lượng và trạng thái thu hồi của sản phẩm.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TraceabilityServiceImpl implements TraceabilityService {

    private final ProductBatchRepository productBatchRepository;
    private final TraceabilitySnapshotRepository traceabilitySnapshotRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final CropTypeRepository cropTypeRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final LivestockBreedRepository livestockBreedRepository;
    private final ObjectMapper objectMapper;

    /**
     * Tra cứu thông tin truy xuất nguồn gốc công khai từ mã chuỗi quét QR.
     * Tự động tăng bộ đếm số lượt quét (atomic scan counter) và cập nhật thời gian quét mới nhất.
     *
     * @param traceabilityCode Mã chuỗi tem QR của lô thành phẩm
     * @return Đối tượng phản hồi thông tin truy xuất nguồn gốc công khai hoàn chỉnh
     * @throws ResourceNotFoundException nếu không tìm thấy lô sản phẩm hoặc bản chụp truy xuất tương ứng
     */
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

        // Tìm ảnh thật của sản phẩm từ Master Data (Crop Type / Livestock Breed)
        String productImageUrl = null;
        if (batch.getSeasonId() != null) {
            productImageUrl = cropSeasonRepository.findById(batch.getSeasonId())
                    .flatMap(s -> cropTypeRepository.findById(s.getCropTypeId()))
                    .map(CropType::getImageUrl)
                    .orElse(null);
        } else if (batch.getLivestockGroupId() != null) {
            productImageUrl = livestockGroupRepository.findById(batch.getLivestockGroupId())
                    .flatMap(g -> livestockBreedRepository.findById(g.getBreedId()))
                    .map(LivestockBreed::getImageUrl)
                    .orElse(null);
        }

        if (productImageUrl == null && harvest instanceof Map<?, ?> hMap) {
            Object img = hMap.get("productImageUrl");
            if (img instanceof String s && !s.contains("/qr/") && !s.isBlank()) {
                productImageUrl = s;
            }
        }

        log.info("Public scan for traceabilityCode={}, product={}, scanCount={}", traceabilityCode, batch.getProductName(), snapshot.getScanCount());

        return PublicTraceabilityResponse.builder()
                .traceabilityCode(batch.getTraceabilityCode())
                .productName(batch.getProductName())
                .productImageUrl(productImageUrl)
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

    /**
     * Chuyển đổi chuỗi định dạng JSON thành đối tượng Java Object (Map hoặc List) phục vụ trả về giao diện.
     *
     * @param json Chuỗi JSON đầu vào từ bản chụp snapshot
     * @return Đối tượng Java sau khi phân tích hoặc chuỗi gốc nếu xảy ra lỗi chuyển đổi
     */
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
