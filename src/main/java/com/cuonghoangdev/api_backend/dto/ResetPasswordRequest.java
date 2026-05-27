package com.cuonghoangdev.api_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ResetPasswordRequest {

    @NotBlank(message = "Token khong duoc trong")
    private String token;

    @NotBlank(message = "Password khong duoc trong")
    @Size(min = 6, message = "Password phai tu 6 ky tu tro len")
    private String newPassword;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
