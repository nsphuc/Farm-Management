package com.farm.saas.modules.livestock.service;

import com.farm.saas.modules.livestock.dto.request.CreateDailyLogRequest;
import com.farm.saas.modules.livestock.dto.response.DailyLogRemindersResponse;
import com.farm.saas.modules.livestock.dto.response.DailyLogResponse;

import java.time.LocalDate;
import java.util.List;

public interface DailyLogService {

    DailyLogRemindersResponse getReminders(Long farmId, Long barnId, Long batchId);

    List<DailyLogResponse> getDailyLogs(Long farmId, LocalDate date, Long barnId, Long batchId);

    DailyLogResponse createDailyLog(CreateDailyLogRequest request);

    DailyLogResponse updateDailyLog(Long id, CreateDailyLogRequest request);

    void deleteDailyLog(Long id);
}
