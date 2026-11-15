package com.farm.saas.modules.livestock.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchCreateIndividualsRequest {

    @NotNull(message = "Đàn nuôi không được để trống")
    private Long groupId;

    @NotNull(message = "Khu sản xuất không được để trống")
    private Long zoneId;

    /**
     * Chế độ sinh thẻ tai:
     * - 'RANGE': Tự động sinh dải thẻ tai theo số thứ tự liên tục (VD: BO-26-0001 -> BO-26-0050)
     * - 'LIST': Danh sách cá thể chi tiết từ file Excel / CSV hoặc nhập dạng bảng
     */
    @Builder.Default
    private String mode = "RANGE";

    // --- Cấu hình cho mode = 'RANGE' ---
    private String prefix;           // Tiền tố mã (VD: "BO-26-", "PIG-")
    private Integer startNumber;     // Số thứ tự bắt đầu (VD: 1)
    private Integer count;           // Số lượng cá thể cần sinh (VD: 50)
    private Integer digits;          // Số chữ số padding 0 (VD: 4 -> 0001)
    private String defaultGender;    // "FEMALE", "MALE", "CASTRATED", "MIXED" (xen kẽ đực/cái)
    private BigDecimal defaultWeightKg;
    private String defaultHealthStatus;
    private LocalDate defaultBirthDate;

    // --- Cấu hình cho mode = 'LIST' (Excel import hoặc Stream scan) ---
    private List<CreateLivestockIndividualRequest> individuals;

    // --- Tùy chọn Tự Động Xuất Kho Thẻ Tai RFID & Hạch Toán Kế Toán ---
    @Builder.Default
    private Boolean autoDeductTagInventory = false;
    private Long warehouseId;
    private String storageBinCode;
    private Long tagMaterialId;
    private BigDecimal tagUnitPrice;
}

