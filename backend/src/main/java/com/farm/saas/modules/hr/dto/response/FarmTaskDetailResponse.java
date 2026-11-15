package com.farm.saas.modules.hr.dto.response;

import lombok.*;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmTaskDetailResponse {
    private Long id;
    private Long farmId;
    private String farmName;
    private Long zoneId;
    private String zoneName;
    private Long locationId;
    private String locationName;
    private String locationCode;
    private String taskTitle;
    private String taskType;
    private String priority;
    private String status;
    private Long assignedToEmployeeId;
    private String assignedToEmployeeName;
    private Boolean assignedToHasAccount;
    private Long assignedToUserId;
    private Long assignedByUserId;
    private String assignedByName;
    private Instant deadline;
    private Long shiftId;
    private String shiftName;
    private String shiftCode;
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;
    private String recurrenceDays;
    private String assignmentMode;
    private Long warehouseId;
    private String warehouseName;
    private Long materialId;
    private String materialName;
    private String materialSku;
    private String materialUnit;
    private java.math.BigDecimal standardQuantity;
    private java.math.BigDecimal actualQuantity;
    private Long cropSeasonId;
    private String cropSeasonName;
    private Long livestockGroupId;
    private String livestockGroupName;
    private String completionNotes;
    private String photosJson;
    private Boolean isOverdue;
    private Long overdueMinutes;
    private List<FarmTaskAssigneeResponse> assignees;
    private Instant createdAt;
    private Instant updatedAt;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FarmTaskAssigneeResponse {
        private Long employeeId;
        private String employeeName;
        private String employeeCode;
        private Boolean hasUserAccount;
        private Long userId;
        private String roleInTask;
        private Instant assignedAt;
    }
}
