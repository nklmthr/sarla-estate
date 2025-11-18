package com.sarlatea.crm.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

/**
 * Configuration properties for salary and PF (Provident Fund) calculations
 * Values are loaded from application.properties
 */
@Configuration
@ConfigurationProperties(prefix = "salary")
@Data
public class SalaryConfiguration {
    
    /**
     * Mandatory employee PF contribution percentage (default 12%)
     */
    private BigDecimal employeePfPercentage = new BigDecimal("12.00");
    
    /**
     * Employer PF contribution percentage (default 12%)
     * This remains fixed regardless of employee's voluntary contributions
     */
    private BigDecimal employerPfPercentage = new BigDecimal("12.00");
}

