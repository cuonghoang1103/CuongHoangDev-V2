package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.ContactRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Service
public class ContactService {

    private static final Logger log = LoggerFactory.getLogger(ContactService.class);

    private final JavaMailSender mailSender;
    private final String adminEmail;
    private final String appName;
    private final boolean emailEnabled;

    public ContactService(
            @Value("${spring.mail.username:}") String username,
            @Value("${spring.mail.password:}") String password,
            @Value("${spring.mail.host:}") String host,
            @Value("${spring.mail.port:587}") int port,
            @Value("${app.contact.admin-email:admin@cuonghoangdev.com}") String adminEmail,
            @Value("${app.name:CUONG HOANG DEV}") String appName) {

        this.adminEmail = adminEmail;
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
            this.emailEnabled = true;
        } else {
            this.mailSender = null;
            this.emailEnabled = false;
        }
    }

    @Async
    public void processContact(ContactRequest request) {
        log.info("Processing contact from: {} <{}>, subject: {}",
                request.getName(), request.getEmail(), request.getSubject());

        if (!emailEnabled || mailSender == null) {
            log.info("[EMAIL MOCK] Contact form submission:");
            log.info("  From: {} <{}>", request.getName(), request.getEmail());
            log.info("  Subject: {}", request.getSubject());
            log.info("  Message:\n{}", request.getMessage());
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(request.getEmail());
            message.setTo(adminEmail);
            message.setSubject("[" + appName + "] Contact: " +
                    (request.getSubject() != null ? request.getSubject() : "(Khong co chu de)"));
            message.setText(buildEmailBody(request));
            mailSender.send(message);
            log.info("Contact email sent successfully to: {}", adminEmail);
        } catch (Exception e) {
            log.error("Failed to send contact email: {}", e.getMessage(), e);
        }
    }

    private String buildEmailBody(ContactRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("=== LIEN HE TU WEBSITE ===\n\n");
        sb.append("Ho va ten: ").append(request.getName()).append("\n");
        sb.append("Email: ").append(request.getEmail()).append("\n");
        sb.append("Chu de: ").append(
                request.getSubject() != null ? request.getSubject() : "(Khong co)").append("\n");
        sb.append("\n--- Noi dung ---\n\n");
        sb.append(request.getMessage());
        sb.append("\n\n---\nGui tu: ").append(appName);
        return sb.toString();
    }
}
