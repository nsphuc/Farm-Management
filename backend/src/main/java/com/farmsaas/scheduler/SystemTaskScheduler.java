package com.farmsaas.scheduler;

import com.farmsaas.modules.notification.repository.NotificationRepository;
import com.farmsaas.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * System background task scheduler for recurring maintenance and health checks.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SystemTaskScheduler {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Cron Job chạy mỗi đêm lúc 00:00:00 để dọn dẹp dữ liệu rác, token/thông báo cũ
     * và tự động mở khóa các tài khoản đã hết hạn tạm khóa.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void runMidnightCleanupJob() {
        log.info("[SystemScheduler] Bắt đầu chạy tác vụ bảo trì và dọn dẹp hệ thống định kỳ (Midnight Job)...");

        // 1. Dọn dẹp các thông báo đã đọc cũ hơn 30 ngày
        try {
            Instant cutoffDate = Instant.now().minus(30, ChronoUnit.DAYS);
            int deletedNotifications = notificationRepository.deleteOldReadNotifications(cutoffDate);
            log.info("[SystemScheduler] Đã xóa {} thông báo cũ đã đọc (trước {}).", deletedNotifications, cutoffDate);
        } catch (Exception e) {
            log.error("[SystemScheduler] Lỗi khi dọn dẹp thông báo cũ: {}", e.getMessage(), e);
        }

        // 2. Mở khóa tự động cho các tài khoản người dùng đã hết thời gian phạt tạm khóa (lock_until <= NOW)
        try {
            int unlockedCount = userRepository.unlockExpiredLockedUsers(Instant.now());
            if (unlockedCount > 0) {
                log.info("[SystemScheduler] Đã mở khóa tự động cho {} tài khoản hết hạn tạm khóa.", unlockedCount);
            }
        } catch (Exception e) {
            log.error("[SystemScheduler] Lỗi khi mở khóa tài khoản tạm khóa: {}", e.getMessage(), e);
        }

        log.info("[SystemScheduler] Tác vụ Midnight Job hoàn tất.");
    }

    /**
     * Kiểm tra sức khỏe hệ thống và ghi nhận thông số định kỳ mỗi 5 phút (300,000 ms).
     */
    @Scheduled(fixedRate = 300000, initialDelay = 30000)
    public void reportSystemHealthHeartbeat() {
        Runtime runtime = Runtime.getRuntime();
        long totalMemoryMb = runtime.totalMemory() / (1024 * 1024);
        long freeMemoryMb = runtime.freeMemory() / (1024 * 1024);
        long usedMemoryMb = totalMemoryMb - freeMemoryMb;
        long maxMemoryMb = runtime.maxMemory() / (1024 * 1024);
        int availableProcessors = runtime.availableProcessors();
        int activeThreads = Thread.activeCount();

        log.info("[SystemHeartbeat] OK | Memory: {}MB / {}MB (Max: {}MB) | CPU Cores: {} | Active Threads: {}",
                usedMemoryMb, totalMemoryMb, maxMemoryMb, availableProcessors, activeThreads);
    }
}
