package com.sarlatea.crm.dto;

import lombok.Data;

@Data
public class UpdateProfileDTO {
    private String fullName;
    private String email;
    private String timezone;
}
