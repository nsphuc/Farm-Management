package com.farmsaas.modules.finance.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.finance.dto.CostCategoryRequest;
import com.farmsaas.modules.finance.dto.CostCategoryResponse;
import com.farmsaas.modules.finance.entity.CostCategory;
import com.farmsaas.modules.finance.entity.enums.CostType;
import com.farmsaas.modules.finance.repository.CostCategoryRepository;
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
public class CostCategoryServiceImpl implements CostCategoryService {

    private final CostCategoryRepository costCategoryRepository;

    @Override
    @Transactional
    public CostCategoryResponse createCategory(CostCategoryRequest request) {
        Long tenantId = getRequiredTenantId();

        String code = request.getCode().trim().toUpperCase();
        if (costCategoryRepository.existsByTenantIdAndCode(tenantId, code)) {
            throw new BusinessException("Mã danh mục chi phí '" + code + "' đã tồn tại.");
        }

        CostCategory category = CostCategory.builder()
                .code(code)
                .name(request.getName().trim())
                .costType(request.getCostType())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();
        category.setTenantId(tenantId);

        CostCategory saved = costCategoryRepository.save(category);
        log.info("Created cost category: {} with ID: {}", saved.getCode(), saved.getId());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CostCategoryResponse updateCategory(Long id, CostCategoryRequest request) {
        Long tenantId = getRequiredTenantId();

        CostCategory category = costCategoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục chi phí ID: " + id));

        String code = request.getCode().trim().toUpperCase();
        if (!category.getCode().equalsIgnoreCase(code) && costCategoryRepository.existsByTenantIdAndCode(tenantId, code)) {
            throw new BusinessException("Mã danh mục chi phí '" + code + "' đã tồn tại.");
        }

        category.setCode(code);
        category.setName(request.getName().trim());
        category.setCostType(request.getCostType());
        category.setDescription(request.getDescription());
        if (request.getStatus() != null) category.setStatus(request.getStatus());

        CostCategory updated = costCategoryRepository.save(category);
        log.info("Updated cost category ID: {}", updated.getId());
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public CostCategoryResponse getCategoryById(Long id) {
        Long tenantId = getRequiredTenantId();
        CostCategory category = costCategoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục chi phí ID: " + id));
        return mapToResponse(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CostCategoryResponse> getAllCategories(CostType costType) {
        Long tenantId = getRequiredTenantId();
        List<CostCategory> list = (costType != null)
                ? costCategoryRepository.findByTenantIdAndCostType(tenantId, costType)
                : costCategoryRepository.findByTenantId(tenantId);

        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void initDefaultCategories() {
        Long tenantId = getRequiredTenantId();
        List<CostCategory> existing = costCategoryRepository.findByTenantId(tenantId);
        if (!existing.isEmpty()) {
            return;
        }

        List<CostCategory> defaults = List.of(
                CostCategory.builder().code("CP-VT-GIONG").name("Hạt giống / Cây con / Con giống").costType(CostType.TRUC_TIEP_VAT_TU).description("Chi phí mua giống đầu vào").status("ACTIVE").build(),
                CostCategory.builder().code("CP-VT-PHAN").name("Phân bón & Dinh dưỡng cây trồng").costType(CostType.TRUC_TIEP_VAT_TU).description("Phân NPK, hữu cơ vi sinh").status("ACTIVE").build(),
                CostCategory.builder().code("CP-VT-THUOC").name("Thuốc BVTV & Vắc-xin").costType(CostType.TRUC_TIEP_VAT_TU).description("Thuốc sinh học, kháng sinh thú y").status("ACTIVE").build(),
                CostCategory.builder().code("CP-VT-THUCAN").name("Thức ăn chăn nuôi (Cám / Cỏ)").costType(CostType.TRUC_TIEP_VAT_TU).description("Cám hỗn hợp, thức ăn ủ chua").status("ACTIVE").build(),
                CostCategory.builder().code("CP-NC-DONG").name("Nhân công làm đồng / Chăm sóc đàn").costType(CostType.TRUC_TIEP_NHAN_CONG).description("Công cấy, làm cỏ, thu hái, cho ăn").status("ACTIVE").build(),
                CostCategory.builder().code("CP-MAY-XANG").name("Xăng dầu & Nhiên liệu máy nông nghiệp").costType(CostType.MAY_MOC).description("Dầu máy cày, máy bơm nước").status("ACTIVE").build(),
                CostCategory.builder().code("CP-KH-NHA").name("Khấu hao nhà lưới / Chuồng trại").costType(CostType.KHAU_HAO).description("Khấu hao tài sản cố định trang trại").status("ACTIVE").build(),
                CostCategory.builder().code("CP-GT-DIEN").name("Điện, nước & Chi phí chung trang trại").costType(CostType.GIAN_TIEP).description("Hóa đơn điện lực, nước tưới giếng khoan").status("ACTIVE").build()
        );

        for (CostCategory cat : defaults) {
            cat.setTenantId(tenantId);
            costCategoryRepository.save(cat);
        }
        log.info("Initialized {} default cost categories for tenant ID: {}", defaults.size(), tenantId);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Long tenantId = getRequiredTenantId();
        CostCategory category = costCategoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục chi phí ID: " + id));

        costCategoryRepository.delete(category);
        log.info("Deleted cost category ID: {}", id);
    }

    private CostCategoryResponse mapToResponse(CostCategory c) {
        return CostCategoryResponse.builder()
                .id(c.getId())
                .tenantId(c.getTenantId())
                .code(c.getCode())
                .name(c.getName())
                .costType(c.getCostType())
                .description(c.getDescription())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
