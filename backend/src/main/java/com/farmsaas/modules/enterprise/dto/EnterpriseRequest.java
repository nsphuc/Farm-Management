package com.farmsaas.modules.enterprise.dto;

import jakarta.validation.constraints.NotBlank;
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
public class EnterpriseRequest {

    @NotBlank(message = "Tên doanh nghiệp hoặc hợp tác xã không được để trống")
    @Size(max = 255, message = "Tên không được vượt quá 255 ký tự")
    private String name;

    @NotBlank(message = "Mã số thuế không được để trống")
    @Size(max = 50, message = "Mã số thuế không được vượt quá 50 ký tự")
    private String taxNumber;

    @NotBlank(message = "Người đại diện pháp luật không được để trống")
    @Size(max = 100, message = "Tên người đại diện không được vượt quá 100 ký tự")
    private String legalRepresentative;

    @NotBlank(message = "Địa chỉ trụ sở chính không được để trống")
    @Size(max = 500, message = "Địa chỉ không được vượt quá 500 ký tự")
    private String headquarterAddress;

    private String phone;
    private String email;
    private String website;
    private String logoUrl;
    private LocalDate establishedDate;
    private String certificationsJson;
}
