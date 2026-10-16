package com.farm.saas.modules.organization.dto.request;

import com.farm.saas.modules.organization.entity.PartnerType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO yêu cầu tạo mới Đối tác (Nhà cung cấp / Khách mua / Vận chuyển).
 * Tuyệt đối không chứa tenantId (Backend tự trích xuất từ Token).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerCreateRequest {

    @NotBlank(message = "Mã đối tác không được để trống")
    @Size(max = 50, message = "Mã đối tác không được vượt quá 50 ký tự")
    @Schema(description = "Mã đối tác duy nhất theo Tenant", example = "NCC-VINASEED")
    private String code;

    @NotBlank(message = "Tên đối tác không được để trống")
    @Size(max = 255, message = "Tên đối tác không được vượt quá 255 ký tự")
    @Schema(description = "Tên công ty hoặc tên cá nhân đối tác", example = "Công ty CP Tập đoàn Giống cây trồng Việt Nam")
    private String name;

    @NotNull(message = "Loại đối tác không được để trống (SUPPLIER, BUYER, LOGISTICS, AGENT)")
    @Schema(description = "Phân loại đối tác", example = "SUPPLIER")
    private PartnerType partnerType;

    @Size(max = 50, message = "Mã số thuế không được vượt quá 50 ký tự")
    @Schema(description = "Mã số thuế doanh nghiệp", example = "0100108390")
    private String taxCode;

    @Size(max = 150, message = "Tên người liên hệ không được vượt quá 150 ký tự")
    @Schema(description = "Người đại diện liên hệ", example = "Nguyễn Văn Đại")
    private String contactPerson;

    @Size(max = 30, message = "Số điện thoại không được vượt quá 30 ký tự")
    @Schema(description = "Số điện thoại liên hệ", example = "02438523294")
    private String phone;

    @Email(message = "Định dạng email không hợp lệ")
    @Size(max = 100, message = "Email không được vượt quá 100 ký tự")
    @Schema(description = "Email liên hệ", example = "contact@vinaseed.com.vn")
    private String email;

    @Size(max = 500, message = "Địa chỉ không được vượt quá 500 ký tự")
    @Schema(description = "Địa chỉ văn phòng / kho bãi", example = "Số 1 Lương Định Của, Đống Đa, Hà Nội")
    private String address;

    @Size(max = 255, message = "Thông tin ngân hàng không được vượt quá 255 ký tự")
    @Schema(description = "Thông tin tài khoản ngân hàng", example = "Vietcombank - CN Hà Nội - 0011001234567")
    private String bankAccountInfo;

    @Size(max = 30, message = "Xếp hạng tín dụng không được vượt quá 30 ký tự")
    @Schema(description = "Xếp hạng tín dụng nội bộ: A, B, C, UNRATED", example = "A")
    private String creditRating;
}
