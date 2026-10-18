package com.farm.saas.modules.inventory.dto.request;

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
public class CreateStocktakeRequest {

    @NotNull(message = "Kho kiểm kê không được để trống")
    private Long warehouseId;

    @Size(max = 50, message = "Mã đợt kiểm kê tối đa 50 ký tự")
    private String stocktakeCode;

    @NotNull(message = "Ngày kiểm kê không được để trống")
    private LocalDate stocktakeDate;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String notes;
}
