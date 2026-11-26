package com.farm.saas.modules.livestock.dto.request;

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
public class ApplyProgramRequest {

    @NotNull(message = "ID quy trình không được để trống")
    private Long programId;

    private LocalDate startDate;
}
