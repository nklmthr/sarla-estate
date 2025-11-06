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
 */
@RestController
@RequestMapping("/api/health")
@Slf4j
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, String>> healthCheck() {
        log.debug("Health check requested");
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("application", "Sarla Tea Estates CRM");
        response.put("version", "1.0.0");
        return ResponseEntity.ok(response);
    }
}

