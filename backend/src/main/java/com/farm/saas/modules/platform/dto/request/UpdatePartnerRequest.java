package com.farm.saas.modules.platform.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePartnerRequest {

    @NotBlank(message = "Tên đối tác không được để trống")
    @Size(max = 150, message = "Tên đối tác tối đa 150 ký tự")
    private String name;

    @NotBlank(message = "Loại đối tác không được để trống")
    @Pattern(regexp = "^(SUPPLIER|BUYER|LOGISTICS|AGENT)$", message = "Loại đối tác phải là SUPPLIER, BUYER, LOGISTICS hoặc AGENT")
    private String partnerType;

    @Size(max = 50, message = "Mã số thuế tối đa 50 ký tự")
    private String taxCode;

    @Size(max = 30, message = "Số điện thoại tối đa 30 ký tự")
    private String phone;

    @Email(message = "Email không hợp lệ")
    @Size(max = 150, message = "Email tối đa 150 ký tự")
    private String email;

    @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
    private String address;

    @DecimalMin(value = "0.0", message = "Hạn mức tín dụng phải lớn hơn hoặc bằng 0")
    private BigDecimal creditLimit;

    @Min(value = 0, message = "Thời hạn thanh toán nợ phải lớn hơn hoặc bằng 0 ngày")
    private Integer paymentTermDays;

    @Pattern(regexp = "^(A|B|C)$", message = "Xếp hạng tín dụng phải là A, B hoặc C")
    private String creditRating;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String notes;
}
