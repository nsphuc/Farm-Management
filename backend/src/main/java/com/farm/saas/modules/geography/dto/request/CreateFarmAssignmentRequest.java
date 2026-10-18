package com.farm.saas.modules.geography.dto.request;

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
public class CreateFarmAssignmentRequest {

    private Long zoneId;

    @NotNull(message = "Nhân viên không được để trống")
    private Long userId;

    @NotBlank(message = "Vai trò tại trang trại không được để trống")
    private String roleInFarm;

    @NotNull(message = "Ngày bắt đầu phân công không được để trống")
    private LocalDate assignedFrom;

    private LocalDate assignedTo;
}
