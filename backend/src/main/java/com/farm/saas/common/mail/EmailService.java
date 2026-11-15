package com.farm.saas.common.mail;

public interface EmailService {
    /**
     * Tự động gửi thông tin tài khoản đăng nhập (Username, Mật khẩu khởi tạo, URL đăng nhập) tới email người dùng
     */
    void sendAccountCredentialsEmail(String toEmail, String fullName, String username, String initialPassword, String loginUrl);
}

