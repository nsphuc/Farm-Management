package com.farmsaas.modules.analytics.service;

import com.farmsaas.modules.analytics.dto.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

public interface AnalyticsService {
    ExecutiveSummaryDTO getExecutiveSummary(Long farmId);
    ProductionYieldReportDTO getProductionYieldReport(Long farmId, Integer year);
    InventoryReportDTO getInventoryReport(Long farmId);
    FinancialPLReportDTO getFinancialPLReport(Long farmId, Integer year);
    List<EarlyAlertDTO> getEarlyAlerts(Long farmId);
    byte[] exportReportData(Long farmId, String type, String format) throws IOException;
}
