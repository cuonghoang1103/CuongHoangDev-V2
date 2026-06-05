package com.cuonghoangdev.api_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateSemesterRequest {

    @NotBlank(message = "Ten hoc ky khong duoc de trong")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "Ma hoc ky khong duoc de trong")
    @Size(max = 20)
    private String code;

    @NotNull(message = "Thu tu hoc ky khong duoc de trong")
    private Integer ordinal;

    private String description;

    private Boolean isActive = true;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public Integer getOrdinal() { return ordinal; }
    public void setOrdinal(Integer ordinal) { this.ordinal = ordinal; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
