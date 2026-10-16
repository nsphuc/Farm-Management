package com.farm.saas.modules.organization.dto.response;

import com.farm.saas.modules.organization.entity.PartnerStatus;
import com.farm.saas.modules.organization.entity.PartnerType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.Instant;

/**
 * DTO trả về thông tin chi tiết Đối tác cho Client.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerResponse {

    @Schema(description = "ID đối tác", example = "1")
    private Long id;

    @Schema(description = "Mã đối tác", example = "NCC-VINASEED")
    private String code;

    @Schema(description = "Tên công ty / cá nhân đối tác", example = "Công ty CP Tập đoàn Giống cây trồng Việt Nam")
    private String name;

    @Schema(description = "Phân loại đối tác: SUPPLIER, BUYER, LOGISTICS, AGENT", example = "SUPPLIER")
    private PartnerType partnerType;

    @Schema(description = "Mã số thuế", example = "0100108390")
    private String taxCode;

    @Schema(description = "Người đại diện liên hệ", example = "Nguyễn Văn Đại")
    private String contactPerson;

    @Schema(description = "Số điện thoại liên hệ", example = "02438523294")
    private String phone;

    @Schema(description = "Email liên hệ", example = "contact@vinaseed.com.vn")
    private String email;

    @Schema(description = "Địa chỉ văn phòng / kho", example = "Số 1 Lương Định Của, Đống Đa, Hà Nội")
    private String address;

    @Schema(description = "Thông tin tài khoản ngân hàng", example = "Vietcombank - CN Hà Nội - 0011001234567")
    private String bankAccountInfo;

    @Schema(description = "Xếp hạng tín dụng", example = "A")
    private String creditRating;

    @Schema(description = "Trạng thái hợp tác: ACTIVE, INACTIVE, BLACKLISTED", example = "ACTIVE")
    private PartnerStatus status;

    @Schema(description = "Thời điểm khởi tạo bản ghi")
    private Instant createdAt;

    @Schema(description = "Thời điểm cập nhật mới nhất")
    private Instant updatedAt;
}
