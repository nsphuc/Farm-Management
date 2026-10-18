package com.farm.saas.modules.livestock.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLivestockIndividualRequest {

    @NotNull(message = "Khu sản xuất không được để trống")
    private Long zoneId;

    private Long groupId;

    @NotBlank(message = "Mã RFID không được để trống")
    @Size(max = 50, message = "Mã RFID tối đa 50 ký tự")
    private String rfidTagCode;

    @NotBlank(message = "Giới tính không được để trống")
    @Pattern(regexp = "^(MALE|FEMALE|CASTRATED)$", message = "Giới tính phải là MALE, FEMALE hoặc CASTRATED")
    private String gender;

    private LocalDate birthDate;

    @Size(max = 50, message = "Mã RFID mẹ tối đa 50 ký tự")
    private String motherTagCode;

    @Size(max = 50, message = "Mã RFID cha tối đa 50 ký tự")
    private String fatherTagCode;

    @DecimalMin(value = "0.00", message = "Cân nặng hiện tại không được âm")
    private BigDecimal currentWeightKg;

    @Pattern(regexp = "^(HEALTHY|SICK|INJURED|QUARANTINED|DECEASED|SOLD)$", message = "Tình trạng sức khỏe không hợp lệ")
    private String healthStatus;
}
