package com.farm.saas.modules.common.scheduler;

import com.farm.saas.modules.crop.entity.CropSeason;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.crop.repository.FarmingLogRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.hr.service.FarmTaskService;
import com.farm.saas.modules.livestock.entity.LivestockGroup;
import com.farm.saas.modules.livestock.repository.LivestockEventRepository;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Lịch trình tự động hóa các tiến trình định kỳ của hệ thống trang trại SaaS:
 * - Quy trình 3: Cron 00:01 sáng mỗi ngày tự động quét đàn/vụ mùa ACTIVE để sinh công việc thường nhật (Daily Routine Tasks).
 * - Quy trình 4: Cron 00:05 sáng mỗi ngày tự động quét và gỡ cấm xuất chuồng / gỡ cách ly an toàn (Quarantine Auto-Unlock).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FarmAutomationsScheduler {

    private final FarmRepository farmRepository;
    private final FarmTaskService farmTaskService;
    private final LivestockGroupRepository livestockGroupRepository;
    private final LivestockEventRepository livestockEventRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final FarmingLogRepository farmingLogRepository;
    private final NotificationService notificationService;

    /**
     * Quy trình 3: Tự động khởi tạo nhiệm vụ thường nhật (Daily Routine) vào 00:01 sáng hàng ngày (GMT+7)
     */
    @Scheduled(cron = "0 1 0 * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void scheduleDailyRoutineTasks() {
        log.info("[CRON-JOB-00:01] Bắt đầu tự động quét và sinh công việc thường nhật cho toàn bộ trang trại...");
        List<Farm> activeFarms = farmRepository.findAll().stream()
                .filter(f -> "ACTIVE".equalsIgnoreCase(f.getStatus()))
                .toList();

        int totalGenerated = 0;
        for (Farm farm : activeFarms) {
            try {
                var generatedList = farmTaskService.generateDailyRoutines(farm.getId());
                int count = (generatedList != null) ? generatedList.size() : 0;
                totalGenerated += count;
                log.info("[CRON-JOB-00:01] Trang trại '{}' (id={}): Đã sinh {} việc thường nhật hôm nay.",
                        farm.getName(), farm.getId(), count);
            } catch (Exception ex) {
                log.error("[CRON-JOB-00:01] Lỗi khi sinh việc thường nhật cho farmId={}: {}", farm.getId(), ex.getMessage(), ex);
            }
        }
        log.info("[CRON-JOB-00:01] Hoàn tất quét công việc thường nhật. Tổng số nhiệm vụ đã sinh: {}", totalGenerated);
    }

    /**
     * Quy trình 4: Tự động gỡ cờ cách ly ngưng thuốc (Withdrawal) & cách ly thuốc BVTV (PHI) vào 00:05 sáng hàng ngày (GMT+7)
     */
    @Scheduled(cron = "0 5 0 * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void scheduleQuarantineAutoUnlock() {
        log.info("[CRON-JOB-00:05] Bắt đầu quét kiểm tra thời hạn cách ly ngưng thuốc thú y và cách ly nông dược PHI...");
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        // 1. Quét Đàn vật nuôi (Livestock Groups)
        List<LivestockGroup> groups = livestockGroupRepository.findAll();
        int groupsUnlocked = 0;
        for (LivestockGroup group : groups) {
            if ("SOLD".equalsIgnoreCase(group.getStatus()) || "CULLED".equalsIgnoreCase(group.getStatus()) || "CLOSED".equalsIgnoreCase(group.getStatus())) {
                continue;
            }

            LocalDate maxWithdrawal = livestockEventRepository.findMaxWithdrawalEndDateByGroupId(group.getId());
            if (maxWithdrawal != null) {
                // Đã vượt qua ngày ngưng thuốc
                if (!today.isBefore(maxWithdrawal)) {
                    boolean wasQuarantined = "QUARANTINED".equalsIgnoreCase(group.getStatus());
                    if (wasQuarantined) {
                        group.setStatus("ACTIVE");
                        group.setUpdatedAt(Instant.now());
                        livestockGroupRepository.save(group);
                        groupsUnlocked++;
                        log.info("[CRON-JOB-00:05] Đàn [{}] đã được tự động mở khóa trạng thái ACTIVE do hết hạn cách ly thuốc ({})",
                                group.getGroupCode(), maxWithdrawal);
                    }

                    // Nếu vừa hết hạn (hôm qua hoặc hôm nay), gửi thông báo cho Ban quản lý trại
                    if (maxWithdrawal.isEqual(yesterday) || maxWithdrawal.isEqual(today) || wasQuarantined) {
                        sendQuarantineUnlockedNotification(
                                group.getTenantId(),
                                group.getFarmId(),
                                "Đã hết thời hạn cách ly ngưng thuốc (Withdrawal Period)",
                                String.format("Đàn vật nuôi [%s] đã hoàn tất thời gian ngưng thuốc thú y an toàn (hết hạn ngày %s). Đàn hiện đã an toàn để xuất chuồng / thu hoạch.",
                                        group.getGroupCode(), maxWithdrawal),
                                "LIVESTOCK_GROUP",
                                group.getId()
                        );
                    }
                }
            }
        }

        // 2. Quét Vụ mùa trồng trọt (Crop Seasons)
        List<CropSeason> seasons = cropSeasonRepository.findAll();
        int seasonsUnlocked = 0;
        for (CropSeason season : seasons) {
            if ("CLOSED".equalsIgnoreCase(season.getStatus()) || "CANCELLED".equalsIgnoreCase(season.getStatus())) {
                continue;
            }

            LocalDate maxPhi = farmingLogRepository.findMaxPhiEndDateBySeasonId(season.getId());
            if (maxPhi != null) {
                // Đã vượt qua thời gian cách ly nông dược PHI
                if (!today.isBefore(maxPhi)) {
                    boolean wasQuarantined = "QUARANTINED".equalsIgnoreCase(season.getStatus());
                    if (wasQuarantined) {
                        season.setStatus("GROWING");
                        season.setUpdatedAt(Instant.now());
                        cropSeasonRepository.save(season);
                        seasonsUnlocked++;
                        log.info("[CRON-JOB-00:05] Mùa vụ [{}] đã được tự động mở khóa trạng thái GROWING do hết hạn PHI ({})",
                                season.getSeasonCode(), maxPhi);
                    }

                    if (maxPhi.isEqual(yesterday) || maxPhi.isEqual(today) || wasQuarantined) {
                        sendQuarantineUnlockedNotification(
                                season.getTenantId(),
                                season.getFarmId(),
                                "Đã hết thời hạn cách ly an toàn nông dược (PHI)",
                                String.format("Vụ mùa [%s] đã hoàn tất thời gian cách ly an toàn nông dược PHI (hết hạn ngày %s). Nông sản hiện đã an toàn tuyệt đối để thu hoạch.",
                                        season.getSeasonCode(), maxPhi),
                                "CROP_SEASON",
                                season.getId()
                        );
                    }
                }
            }
        }

        log.info("[CRON-JOB-00:05] Hoàn tất quét kiểm tra cách ly. Đã tự động mở khóa {} đàn vật nuôi và {} vụ mùa.",
                groupsUnlocked, seasonsUnlocked);
    }

    private void sendQuarantineUnlockedNotification(Long tenantId, Long farmId, String title, String message, String refType, Long refId) {
        if (notificationService == null || farmId == null) {
            return;
        }
        try {
            farmRepository.findById(farmId).ifPresent(farm -> {
                if (farm.getManagerUserId() != null) {
                    notificationService.sendNotification(
                            tenantId,
                            farm.getManagerUserId(),
                            title,
                            message,
                            "QC",
                            refType,
                            refId,
                            "/app/farming"
                    );
                }
            });
        } catch (Exception ex) {
            log.warn("[CRON] Gửi thông báo hết hạn cách ly thất bại: {}", ex.getMessage());
        }
    }
}

