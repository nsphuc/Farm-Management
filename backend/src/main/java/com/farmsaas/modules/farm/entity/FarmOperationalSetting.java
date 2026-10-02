package com.farmsaas.modules.farm.entity;

import com.farmsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * FarmOperationalSetting Entity: Cấu hình tham số vận hành riêng của từng trang trại.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "farm_operational_settings", uniqueConstraints = {
        @UniqueConstraint(name = "uk_farm_settings_farm", columnNames = { "farm_id" })
})
public class FarmOperationalSetting extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    /**
     * Ngưỡng độ ẩm đất, nhiệt độ kích hoạt tưới tiêu tự động
     */
    @Column(name = "irrigation_threshold_json", columnDefinition = "JSON")
    private String irrigationThresholdJson;

    /**
     * Khung giờ các ca làm việc ngoài đồng ruộng
     */
    @Column(name = "work_shift_config_json", columnDefinition = "JSON")
    private String workShiftConfigJson;

    /**
     * Các cài đặt mở rộng
     */
    @Column(name = "general_settings_json", columnDefinition = "JSON")
    private String generalSettingsJson;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;
}
