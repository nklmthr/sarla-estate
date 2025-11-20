package com.sarlatea.crm.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Health check controller
 * This endpoint should be simple and not depend on external services
 */
@RestController
@RequestMapping("/api/health")
@Slf4j
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, String>> healthCheck() {
        // Simple health check - no database dependency
        // Just confirms the application container is running
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("application", "Sarla Tea Estates CRM");
        response.put("version", "1.0.0");
        response.put("timestamp", String.valueOf(System.currentTimeMillis()));
        return ResponseEntity.ok(response);
    }
}

