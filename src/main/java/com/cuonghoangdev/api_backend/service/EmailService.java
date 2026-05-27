package com.cuonghoangdev.api_backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromEmail;
    private final String appName;

    public EmailService(
            @Value("${spring.mail.username:}") String username,
            @Value("${spring.mail.password:}") String password,
            @Value("${spring.mail.host:}") String host,
            @Value("${spring.mail.port:587}") int port,
            @Value("${app.email.from:noreply@cuonghoangdev.com}") String fromEmail,
            @Value("${app.name:CUONG HOANG DEV}") String appName) {

        this.fromEmail = fromEmail;
        this.appName = appName;

        if (username != null && !username.isBlank()) {
            JavaMailSenderImpl sender = new JavaMailSenderImpl();
            sender.setHost(host);
            sender.setPort(port);
            sender.setUsername(username);
            sender.setPassword(password);
            Properties props = sender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.connectiontimeout", "5000");
            props.put("mail.smtp.timeout", "5000");
            props.put("mail.smtp.writetimeout", "5000");
            this.mailSender = sender;
        } else {
            this.mailSender = null;
        }
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        if (mailSender == null) {
            System.out.println("[EMAIL MOCK] Password reset to: " + toEmail + " | Token: " + token);
            return;
        }

        String resetLink = "http://localhost:3002/reset-password?token=" + token;
        String subject = "[" + appName + "] Reset Mat Khau";
        String body = "Xin chao,\n\n"
                + "Ban yeu cau dat lai mat khau cho tai khoan tai " + appName + ".\n"
                + "Nhan vao link sau de dat mat khau moi:\n\n"
                + resetLink + "\n\n"
                + "Link nay chi co hieu luc trong 15 phut.\n"
                + "Neu ban khong yeu cau dat lai mat khau, vui long bo qua email nay.\n\n"
                + "Tran trong,\n" + appName;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }

    public void sendWelcomeEmail(String toEmail, String username) {
        if (mailSender == null) {
            System.out.println("[EMAIL MOCK] Welcome email to: " + toEmail + " | User: " + username);
            return;
        }

        String subject = "Chao Mung Ban Den Voi " + appName;
        String body = "Xin chao " + username + ",\n\n"
                + "Tai khoan cua ban da duoc tao thanh cong!\n"
                + "Chuc ban co nhieu tran minh cung " + appName + ".\n\n"
                + "Tran trong,\n" + appName;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }
}
