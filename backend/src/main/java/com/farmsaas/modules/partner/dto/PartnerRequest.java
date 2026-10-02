package com.farmsaas.modules.partner.dto;

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
public class PartnerRequest {

    @NotBlank(message = "Mã đối tác không được để trống")
    @Size(max = 50, message = "Mã đối tác tối đa 50 ký tự")
    private String code;

    @NotBlank(message = "Tên đối tác không được để trống")
    @Size(max = 255, message = "Tên đối tác tối đa 255 ký tự")
    private String name;

    @NotBlank(message = "Loại đối tác không được để trống")
    private String partnerType; // SUPPLIER, DISTRIBUTOR, TRANSPORTER

    private String taxCode;
    private String contactPerson;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    private String email;
    private String address;
    private String bankAccountInfo;

    private String creditRating; // A, B, C, D
    private String status; // ACTIVE, INACTIVE
    private String notes;
}
