package com.farmsaas.modules.livestock.dto;

import com.farmsaas.modules.livestock.entity.enums.Gender;
import com.farmsaas.modules.livestock.entity.enums.HealthStatus;
import com.farmsaas.modules.livestock.entity.enums.LivestockSpecies;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivestockIndividualRequest {

    @NotNull(message = "Phân khu chuồng trại không được để trống.")
    private Long zoneId;

    /**
     * Mã RFID / Thẻ tai (nếu để trống, hệ thống tự động sinh theo chuẩn [SPECIES]-[YEAR]-[SEQUENCE]).
     */
    @Size(max = 50, message = "Mã RFID/Thẻ tai tối đa 50 ký tự.")
    private String rfidTagCode;

    /**
     * Loài vật nuôi (dùng để sinh mã RFID nếu rfidTagCode để trống).
     */
    private LivestockSpecies species;

    private Long groupId;

    @Builder.Default
    private Gender gender = Gender.DUC;

    private LocalDate birthDate;

    @Size(max = 50, message = "Mã mẹ tối đa 50 ký tự.")
    private String motherTagCode;

    @Size(max = 50, message = "Mã cha tối đa 50 ký tự.")
    private String fatherTagCode;

    private BigDecimal currentWeightKg;

    @Builder.Default
    private HealthStatus healthStatus = HealthStatus.KHOE_MANH;

    private String notes;
}
