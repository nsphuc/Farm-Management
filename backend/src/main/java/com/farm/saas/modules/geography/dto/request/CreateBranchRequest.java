package com.farm.saas.modules.geography.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBranchRequest {

    @NotBlank(message = "Mã chi nhánh không được để trống")
    @Size(max = 50, message = "Mã chi nhánh tối đa 50 ký tự")
    private String code;

    @NotBlank(message = "Tên chi nhánh không được để trống")
    @Size(max = 150, message = "Tên chi nhánh tối đa 150 ký tự")
    private String name;

    @NotBlank(message = "Loại hình chăn nuôi không được để trống")
    private String livestockType; // LIVESTOCK_MEAT, POULTRY_MEAT, AQUACULTURE

    private String address;
    private String phone;
    private Boolean isDefault;
}
