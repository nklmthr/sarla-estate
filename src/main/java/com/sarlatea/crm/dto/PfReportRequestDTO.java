package com.sarlatea.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PfReportRequestDTO {
    private Integer month; // 1-12
    private Integer year;  // e.g., 2025
}

