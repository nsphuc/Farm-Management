package com.farm.saas.modules.common.scheduler;

import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
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
 * Lich trinh tu dong hoa cac tien trinh dinh ky cua he thong trang trai SaaS:
 * - Quy trinh: Cron 00:05 sang moi ngay tu dong quet va go cam xuat chuong / go cach ly an toan (Quarantine Auto-Unlock).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FarmAutomationsScheduler {

    private final FarmRepository farmRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final LivestockEventRepository livestockEventRepository;
    private final NotificationService notificationService;

    /**
     * Quy trinh: Tu dong go co cach ly ngung thuoc (Withdrawal) vao 00:05 sang hang ngay (GMT+7)
     */
    @Scheduled(cron = "0 5 0 * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void scheduleQuarantineAutoUnlock() {
        log.info("[CRON-JOB-00:05] Bat dau quet kiem tra thoi han cach ly ngung thuoc thu y (Withdrawal Period)...");
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        // 1. Quet Dan vat nuoi (Livestock Groups)
        List<LivestockGroup> groups = livestockGroupRepository.findAll();
        int groupsUnlocked = 0;
        for (LivestockGroup group : groups) {
            if ("SOLD".equalsIgnoreCase(group.getStatus()) || "CULLED".equalsIgnoreCase(group.getStatus()) || "CLOSED".equalsIgnoreCase(group.getStatus())) {
                continue;
            }

            LocalDate maxWithdrawal = livestockEventRepository.findMaxWithdrawalEndDateByGroupId(group.getId());
            if (maxWithdrawal != null) {
                // Da vuot qua ngay ngung thuoc
                if (!today.isBefore(maxWithdrawal)) {
                    boolean wasQuarantined = "QUARANTINED".equalsIgnoreCase(group.getStatus());
                    if (wasQuarantined) {
                        group.setStatus("ACTIVE");
                        group.setUpdatedAt(Instant.now());
                        livestockGroupRepository.save(group);
                        groupsUnlocked++;
                        log.info("[CRON-JOB-00:05] Dan [{}] da duoc tu dong mo khoa trang thai ACTIVE do het han cach ly thuoc ({})",
                                group.getGroupCode(), maxWithdrawal);
                    }

                    // Neu vua het han (hom qua hoac hom nay), gui thong bao cho Ban quan ly trai
                    if (maxWithdrawal.isEqual(yesterday) || maxWithdrawal.isEqual(today) || wasQuarantined) {
                        sendQuarantineUnlockedNotification(
                                group.getTenantId(),
                                group.getFarmId(),
                                "Da het thoi han cach ly ngung thuoc (Withdrawal Period)",
                                String.format("Dan vat nuoi [%s] da hoan tat thoi gian ngung thuoc thu y an toan (het han ngay %s). Dan hien da an toan de xuat chuong / thu hoach.",
                                        group.getGroupCode(), maxWithdrawal),
                                "LIVESTOCK_GROUP",
                                group.getId()
                        );
                    }
                }
            }
        }

        log.info("[CRON-JOB-00:05] Hoan tat quet kiem tra cach ly. Da tu dong mo khoa {} dan vat nuoi.",
                groupsUnlocked);
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
                            "/app/barns"
                    );
                }
            });
        } catch (Exception ex) {
            log.warn("[CRON] Gui thong bao het han cach ly that bai: {}", ex.getMessage());
        }
    }
}
