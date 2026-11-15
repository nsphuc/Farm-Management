package com.farm.saas.common.mail;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    @Value("${app.frontend.url:http://localhost:5173}")
    private String defaultFrontendUrl;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    private final JavaMailSender mailSender;

    public EmailServiceImpl(@Autowired ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSender = mailSenderProvider.getIfAvailable();
    }

    @Async
    @Override
    public void sendAccountCredentialsEmail(String toEmail, String fullName, String username, String initialPassword, String loginUrl) {
        String effectiveLoginUrl = (loginUrl != null && !loginUrl.isBlank()) ? loginUrl : defaultFrontendUrl + "/login";

        log.info("""
                \n========================================================================================
                📧 [EMAIL SERVICE] THÔNG BÁO TÀI KHOẢN VÀ MẬT KHẨU KHỞI TẠO HỆ THỐNG
                ----------------------------------------------------------------------------------------
                Người nhận: {} <{}>
                Tên đăng nhập: {}
                Mật khẩu ban đầu: {}
                Đường dẫn đăng nhập: {}
                Lưu ý: Vui lòng đổi mật khẩu trong lần đăng nhập đầu tiên để đảm bảo an toàn tài khoản!
                ========================================================================================
                """,
                fullName, toEmail, username, initialPassword, effectiveLoginUrl
        );

        // Gửi email thực tế qua SMTP nếu cấu hình spring.mail đã được cung cấp
        if (mailSender != null && mailFrom != null && !mailFrom.isBlank()) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom(mailFrom, "Hệ Thống Agri-ERP SaaS");
                helper.setTo(toEmail);
                helper.setSubject("[Agri-ERP] Thông tin tài khoản truy cập hệ thống Quản lý Nông trại");

                String htmlContent = String.format("""
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <h2 style="color: #059669; margin: 0;">Agri-ERP Platform</h2>
                                <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Hệ thống Quản lý Nông nghiệp Thông minh</p>
                            </div>
                            
                            <p style="color: #1e293b; font-size: 14px;">Xin chào <strong>%s</strong>,</p>
                            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                                Tài khoản của bạn đã được khởi tạo thành công trên nền tảng Quản trị Nông nghiệp Thông minh Agri-ERP. Dưới đây là thông tin đăng nhập chính thức:
                            </p>
                            
                            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
                                <table style="width: 100%%; font-size: 14px; color: #334155;">
                                    <tr>
                                        <td style="padding: 6px 0; font-weight: bold; width: 140px;">Tên đăng nhập:</td>
                                        <td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-size: 15px;"><strong>%s</strong></td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-weight: bold;">Mật khẩu ban đầu:</td>
                                        <td style="padding: 6px 0; color: #e11d48; font-family: monospace; font-size: 15px;"><strong>%s</strong></td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-weight: bold;">Cổng đăng nhập:</td>
                                        <td style="padding: 6px 0;"><a href="%s" style="color: #2563eb; text-decoration: none;">%s</a></td>
                                    </tr>
                                </table>
                            </div>
                            
                            <p style="color: #e11d48; font-size: 12px; font-style: italic;">
                                ⚠️ Lưu ý bảo mật: Vì lý do an toàn, hệ thống sẽ yêu cầu bạn đổi mật khẩu mới trong lần đăng nhập đầu tiên.
                            </p>
                            
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="%s" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 28px; font-weight: bold; text-decoration: none; border-radius: 8px; font-size: 14px;">
                                    Đăng Nhập Ngay
                                </a>
                            </div>
                            
                            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0 16px 0;" />
                            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
                                Thư này được gửi tự động từ hệ thống Agri-ERP. Vui lòng không trả lời thư này.
                            </p>
                        </div>
                        """,
                        fullName, username, initialPassword, effectiveLoginUrl, effectiveLoginUrl, effectiveLoginUrl
                );

                helper.setText(htmlContent, true);
                mailSender.send(message);
                log.info("Successfully sent account credentials email to {}", toEmail);
            } catch (Exception ex) {
                log.error("Failed to send account credentials email to {}: {}", toEmail, ex.getMessage());
            }
        } else {
            log.warn("JavaMailSender or spring.mail.username is not configured. Email was logged to console only.");
        }
    }
}


