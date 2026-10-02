package com.farmsaas.modules.crop.service;

import com.farmsaas.modules.crop.dto.CropTypeRequest;
import com.farmsaas.modules.crop.dto.CropTypeResponse;

import java.util.List;

public interface CropTypeService {

    List<CropTypeResponse> getAllCropTypes();

    CropTypeResponse getCropTypeById(Long id);

    CropTypeResponse createCropType(CropTypeRequest request);

    CropTypeResponse updateCropType(Long id, CropTypeRequest request);

    void deleteCropType(Long id);
}
