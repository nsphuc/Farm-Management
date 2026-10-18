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
public class CreateOperationalCycleRequest {

    @NotBlank(message = "Tên chu kỳ sản xuất không được để trống")
    private String name;

    @NotNull(message = "Năm tài chính không được để trống")
    private Integer fiscalYear;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate endDate;
}
