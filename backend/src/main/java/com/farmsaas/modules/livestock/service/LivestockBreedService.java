package com.farmsaas.modules.livestock.service;

import com.farmsaas.modules.livestock.dto.LivestockBreedRequest;
import com.farmsaas.modules.livestock.dto.LivestockBreedResponse;
import com.farmsaas.modules.livestock.entity.enums.LivestockSpecies;

import java.util.List;

public interface LivestockBreedService {

    List<LivestockBreedResponse> getAllBreeds(LivestockSpecies species);

    LivestockBreedResponse getBreedById(Long id);

    LivestockBreedResponse createBreed(LivestockBreedRequest request);

    LivestockBreedResponse updateBreed(Long id, LivestockBreedRequest request);

    void deleteBreed(Long id);
}
