package com.farmsaas.modules.farm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAssignmentRequest {

    @NotNull(message = "Nhân viên không được để trống")
    private Long userId;

    @NotBlank(message = "Vai trò trong trang trại không được để trống")
    private String roleInFarm; // FARM_MANAGER, CHIEF_TECHNICIAN, VETERINARIAN, WAREHOUSE_SUPERVISOR, FIELD_LEAD, WORKER

    @NotNull(message = "Ngày bắt đầu phân công không được để trống")
    private LocalDate assignedFrom;

    private LocalDate assignedTo;
}
