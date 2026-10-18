package com.farm.saas.modules.geography.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOperationalCycleRequest {

    @NotBlank(message = "Tên chu kỳ sản xuất không được để trống")
    private String name;

    private Integer fiscalYear;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status; // 'PLANNING', 'ACTIVE', 'CLOSED'
}
