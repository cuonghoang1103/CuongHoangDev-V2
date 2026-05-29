package com.cuonghoangdev.api_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ContactRequest {

    @NotBlank(message = "Ten khong duoc de trong")
    @Size(max = 100, message = "Ten khong qua 100 ky tu")
    private String name;

    @NotBlank(message = "Email khong duoc de trong")
    @Email(message = "Email khong hop le")
    @Size(max = 150, message = "Email khong qua 150 ky tu")
    private String email;

    @Size(max = 200, message = "Chu de khong qua 200 ky tu")
    private String subject;

    @NotBlank(message = "Noi dung khong duoc de trong")
    @Size(max = 2000, message = "Noi dung khong qua 2000 ky tu")
    private String message;

    public ContactRequest() {}

    public ContactRequest(String name, String email, String subject, String message) {
        this.name = name;
        this.email = email;
        this.subject = subject;
        this.message = message;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
