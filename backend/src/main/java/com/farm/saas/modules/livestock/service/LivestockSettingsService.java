package com.farm.saas.modules.livestock.service;

import com.farm.saas.modules.livestock.dto.request.*;
import com.farm.saas.modules.livestock.dto.response.ProgramDetailResponse;

import java.util.List;

public interface LivestockSettingsService {

    List<ProgramDetailResponse> getPrograms(Long farmId);

    ProgramDetailResponse getProgramById(Long id);

    ProgramDetailResponse createProgram(Long farmId, CreateProgramRequest request);

    ProgramDetailResponse updateProgram(Long id, CreateProgramRequest request);

    void deleteProgram(Long id);

    ProgramDetailResponse.FeedStandardItem addFeedStandard(Long programId, FeedStandardRequest request);

    ProgramDetailResponse.FeedStandardItem updateFeedStandard(Long programId, Long quotaId, FeedStandardRequest request);

    void deleteQuota(Long quotaId);

    List<ProgramDetailResponse.FeedStandardItem> batchRangeFeed(Long programId, BatchRangeFeedRequest request);

    ProgramDetailResponse.VaccineTimelineItem addVaccine(Long programId, VaccineTimelineRequest request);

    ProgramDetailResponse.VaccineTimelineItem updateVaccine(Long programId, Long quotaId, VaccineTimelineRequest request);

    String getEnvMetrics(Long farmId);

    void updateEnvMetrics(Long farmId, String envMetricsJson);

    String getKpis(Long farmId);

    void updateKpis(Long farmId, String kpisJson);
}
