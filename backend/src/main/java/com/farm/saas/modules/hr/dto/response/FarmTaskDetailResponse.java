package com.farm.saas.modules.hr.dto.response;

import lombok.*;

import java.time.Instant;
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
    private String completionNotes;
    private String photosJson;
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
