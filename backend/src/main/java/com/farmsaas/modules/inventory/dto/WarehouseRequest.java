package com.farmsaas.modules.inventory.dto;

import com.farmsaas.modules.inventory.entity.Warehouse;
import com.farmsaas.modules.inventory.entity.enums.WarehouseType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseRequest {

    @NotBlank(message = "Mã kho không được để trống.")
    @Size(max = 50, message = "Mã kho tối đa 50 ký tự.")
    private String code;

    @NotBlank(message = "Tên kho không được để trống.")
    @Size(max = 150, message = "Tên kho tối đa 150 ký tự.")
    private String name;

    @NotNull(message = "Loại kho không được để trống.")
    private WarehouseType warehouseType;

    @Size(max = 500, message = "Mô tả vị trí tối đa 500 ký tự.")
    private String locationDesc;

    private Long managerUserId;

    private String status;
}
