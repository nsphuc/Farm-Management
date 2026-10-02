package com.farmsaas.modules.livestock.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.livestock.dto.LivestockBreedRequest;
import com.farmsaas.modules.livestock.dto.LivestockBreedResponse;
import com.farmsaas.modules.livestock.entity.LivestockBreed;
import com.farmsaas.modules.livestock.entity.enums.LivestockSpecies;
import com.farmsaas.modules.livestock.repository.LivestockBreedRepository;
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
public class LivestockBreedServiceImpl implements LivestockBreedService {

    private final LivestockBreedRepository breedRepository;

    @Override
    @Transactional(readOnly = true)
    public List<LivestockBreedResponse> getAllBreeds(LivestockSpecies species) {
        Long tenantId = TenantContextHolder.getRequiredTenantId();
        List<LivestockBreed> list = (species != null)
                ? breedRepository.findByTenantIdAndSpecies(tenantId, species)
                : breedRepository.findByTenantId(tenantId);
        return list.stream()
                .map(LivestockBreedResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public LivestockBreedResponse getBreedById(Long id) {
        Long tenantId = TenantContextHolder.getRequiredTenantId();
        LivestockBreed breed = breedRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy giống vật nuôi với ID: " + id));
        return LivestockBreedResponse.fromEntity(breed);
    }

    @Override
    @Transactional
    public LivestockBreedResponse createBreed(LivestockBreedRequest request) {
        Long tenantId = TenantContextHolder.getRequiredTenantId();
        String name = request.getBreedName().trim();

        if (breedRepository.existsByTenantIdAndSpeciesAndBreedName(tenantId, request.getSpecies(), name)) {
            throw new BusinessException("Giống vật nuôi '" + name + "' thuộc loài " + request.getSpecies() + " đã tồn tại trong tổ chức.");
        }

        LivestockBreed breed = LivestockBreed.builder()
                .species(request.getSpecies())
                .breedName(name)
                .standardGrowthDays(request.getStandardGrowthDays())
                .targetWeightKg(request.getTargetWeightKg())
                .build();
        breed.setTenantId(tenantId);

        LivestockBreed saved = breedRepository.save(breed);
        log.info("Created livestock breed '{}' (ID: {}) for Tenant ID: {}", saved.getBreedName(), saved.getId(), tenantId);
        return LivestockBreedResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public LivestockBreedResponse updateBreed(Long id, LivestockBreedRequest request) {
        Long tenantId = TenantContextHolder.getRequiredTenantId();
        LivestockBreed breed = breedRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy giống vật nuôi với ID: " + id));

        String newName = request.getBreedName().trim();
        if ((!breed.getBreedName().equalsIgnoreCase(newName) || breed.getSpecies() != request.getSpecies()) &&
                breedRepository.existsByTenantIdAndSpeciesAndBreedName(tenantId, request.getSpecies(), newName)) {
            throw new BusinessException("Giống vật nuôi '" + newName + "' thuộc loài " + request.getSpecies() + " đã tồn tại trong tổ chức.");
        }

        breed.setSpecies(request.getSpecies());
        breed.setBreedName(newName);
        breed.setStandardGrowthDays(request.getStandardGrowthDays());
        breed.setTargetWeightKg(request.getTargetWeightKg());

        LivestockBreed updated = breedRepository.save(breed);
        log.info("Updated livestock breed ID: {} for Tenant ID: {}", id, tenantId);
        return LivestockBreedResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public void deleteBreed(Long id) {
        Long tenantId = TenantContextHolder.getRequiredTenantId();
        LivestockBreed breed = breedRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy giống vật nuôi với ID: " + id));

        breedRepository.delete(breed);
        log.info("Deleted livestock breed ID: {} for Tenant ID: {}", id, tenantId);
    }
}
