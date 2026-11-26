package com.farm.saas.modules.auth.repository;

import com.farm.saas.modules.auth.entity.EmailVerificationOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface EmailVerificationOtpRepository extends JpaRepository<EmailVerificationOtp, Long> {
    Optional<EmailVerificationOtp> findTopByEmailAndOtpTypeAndIsUsedFalseOrderByCreatedAtDesc(String email, String otpType);
    Optional<EmailVerificationOtp> findTopByEmailAndOtpCodeAndOtpTypeAndIsUsedFalseAndExpiresAtAfter(
            String email, String otpCode, String otpType, Instant now
    );
}
