package com.farm.saas.modules.platform.dto.request;

import jakarta.validation.constraints.Email;
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
public class UpdateEnterpriseProfileRequest {

    @Size(max = 50, message = "Mã số thuế tối đa 50 ký tự")
    private String taxNumber;

    @Size(max = 150, message = "Người đại diện pháp luật tối đa 150 ký tự")
    private String legalRepresentative;

    @Size(max = 255, message = "Địa chỉ trụ sở tối đa 255 ký tự")
    private String headquarterAddress;

    private LocalDate establishedDate;

    @Size(max = 500, message = "Đường dẫn logo tối đa 500 ký tự")
    private String logoUrl;

    @Size(max = 30, message = "Số điện thoại tối đa 30 ký tự")
    private String contactPhone;

    @Email(message = "Email liên hệ không hợp lệ")
    @Size(max = 150, message = "Email tối đa 150 ký tự")
    private String contactEmail;

    @Size(max = 20, message = "Mã định danh ngân hàng (BIN) tối đa 20 ký tự")
    private String bankBin;

    @Size(max = 150, message = "Tên ngân hàng tối đa 150 ký tự")
    private String bankName;

    @Size(max = 50, message = "Số tài khoản ngân hàng tối đa 50 ký tự")
    private String bankAccountNo;

    @Size(max = 150, message = "Tên chủ tài khoản tối đa 150 ký tự")
    private String bankAccountName;

    private String certificationsJson;
}
