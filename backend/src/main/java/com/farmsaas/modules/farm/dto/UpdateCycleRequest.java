package com.farmsaas.modules.farm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCycleRequest {

    @NotBlank(message = "Tên chu kỳ vận hành không được để trống")
    @Size(max = 255, message = "Tên chu kỳ tối đa 255 ký tự")
    private String name;

    @NotNull(message = "Năm tài chính không được để trống")
    private Integer fiscalYear;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate endDate;

    private String status;
    private String notes;
}
