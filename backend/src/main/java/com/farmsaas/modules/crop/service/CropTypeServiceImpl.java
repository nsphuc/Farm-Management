package com.farmsaas.modules.crop.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.crop.dto.CropTypeRequest;
import com.farmsaas.modules.crop.dto.CropTypeResponse;
import com.farmsaas.modules.crop.entity.CropType;
import com.farmsaas.modules.crop.repository.CropTypeRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CropTypeServiceImpl implements CropTypeService {

    private final CropTypeRepository cropTypeRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CropTypeResponse> getAllCropTypes() {
        Long tenantId = TenantContextHolder.getRequiredTenantId();
        return cropTypeRepository.findByTenantId(tenantId).stream()
                .map(CropTypeResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CropTypeResponse getCropTypeById(Long id) {
        Long tenantId = TenantContextHolder.getRequiredTenantId();
        CropType cropType = cropTypeRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy giống cây trồng với ID: " + id));
        return CropTypeResponse.fromEntity(cropType);
    }

    @Override
    @Transactional
    public CropTypeResponse createCropType(CropTypeRequest request) {
        Long tenantId = TenantContextHolder.getRequiredTenantId();
        String varietyCode = request.getVarietyCode().trim().toUpperCase();

        if (cropTypeRepository.existsByTenantIdAndVarietyCode(tenantId, varietyCode)) {
            throw new BusinessException("Mã giống cây trồng '" + varietyCode + "' đã tồn tại trong tổ chức.");
        }

        CropType cropType = CropType.builder()
                .name(request.getName().trim())
                .varietyCode(varietyCode)
                .growthDaysStandard(request.getGrowthDaysStandard())
                .waterNeedM3Day(request.getWaterNeedM3Day())
                .optimalTempMin(request.getOptimalTempMin())
                .optimalTempMax(request.getOptimalTempMax())
                .build();
        cropType.setTenantId(tenantId);

        CropType saved = cropTypeRepository.save(cropType);
        log.info("Created crop type '{}' (ID: {}) for Tenant ID: {}", saved.getName(), saved.getId(), tenantId);
        return CropTypeResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public CropTypeResponse updateCropType(Long id, CropTypeRequest request) {
        Long tenantId = TenantContextHolder.getRequiredTenantId();
        CropType cropType = cropTypeRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy giống cây trồng với ID: " + id));

        String newVarietyCode = request.getVarietyCode().trim().toUpperCase();
        if (!cropType.getVarietyCode().equalsIgnoreCase(newVarietyCode) &&
                cropTypeRepository.existsByTenantIdAndVarietyCode(tenantId, newVarietyCode)) {
            throw new BusinessException("Mã giống cây trồng '" + newVarietyCode + "' đã tồn tại trong tổ chức.");
        }

        cropType.setName(request.getName().trim());
        cropType.setVarietyCode(newVarietyCode);
        cropType.setGrowthDaysStandard(request.getGrowthDaysStandard());
        cropType.setWaterNeedM3Day(request.getWaterNeedM3Day());
        cropType.setOptimalTempMin(request.getOptimalTempMin());
        cropType.setOptimalTempMax(request.getOptimalTempMax());

        CropType updated = cropTypeRepository.save(cropType);
        log.info("Updated crop type ID: {} for Tenant ID: {}", id, tenantId);
        return CropTypeResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public void deleteCropType(Long id) {
        Long tenantId = TenantContextHolder.getRequiredTenantId();
        CropType cropType = cropTypeRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy giống cây trồng với ID: " + id));

        cropTypeRepository.delete(cropType);
        log.info("Deleted crop type ID: {} for Tenant ID: {}", id, tenantId);
    }
}
