package com.sarlatea.crm.controller;

import com.sarlatea.crm.dto.PermissionConfigDTO;
import com.sarlatea.crm.service.PermissionConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Permission Configuration management
 * Allows admins to dynamically configure resource-operation-permission mappings
 */
@RestController
@RequestMapping("/api/permission-configs")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS},
             allowCredentials = "true")
@RequiredArgsConstructor
@Slf4j
public class PermissionConfigController {

    private final PermissionConfigService permissionConfigService;

    @GetMapping
    @PreAuthorize("hasAuthority('SYSTEM_ADMIN')")
    public ResponseEntity<List<PermissionConfigDTO>> getAllPermissionConfigs() {
        log.info("GET request to fetch all permission configurations");
        List<PermissionConfigDTO> configs = permissionConfigService.getAllPermissionConfigs();
        return ResponseEntity.ok(configs);
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('SYSTEM_ADMIN')")
    public ResponseEntity<List<PermissionConfigDTO>> getActivePermissionConfigs() {
        log.info("GET request to fetch active permission configurations");
        List<PermissionConfigDTO> configs = permissionConfigService.getActivePermissionConfigs();
        return ResponseEntity.ok(configs);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SYSTEM_ADMIN')")
    public ResponseEntity<PermissionConfigDTO> getPermissionConfigById(@PathVariable String id) {
        log.info("GET request to fetch permission config with id: {}", id);
        PermissionConfigDTO config = permissionConfigService.getPermissionConfigById(id);
        return ResponseEntity.ok(config);
    }

    @GetMapping("/resource/{resourceType}")
    @PreAuthorize("hasAuthority('SYSTEM_ADMIN')")
    public ResponseEntity<List<PermissionConfigDTO>> getPermissionConfigsByResource(
            @PathVariable String resourceType) {
        log.info("GET request to fetch permission configs for resource: {}", resourceType);
        List<PermissionConfigDTO> configs = permissionConfigService.getPermissionConfigsByResource(resourceType);
        return ResponseEntity.ok(configs);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SYSTEM_ADMIN')")
    public ResponseEntity<PermissionConfigDTO> createPermissionConfig(
            @RequestBody PermissionConfigDTO configDTO) {
        log.info("POST request to create permission config: {}:{}", 
                configDTO.getResourceType(), configDTO.getOperationType());
        PermissionConfigDTO createdConfig = permissionConfigService.createPermissionConfig(configDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdConfig);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SYSTEM_ADMIN')")
    public ResponseEntity<PermissionConfigDTO> updatePermissionConfig(
            @PathVariable String id, 
            @RequestBody PermissionConfigDTO configDTO) {
        log.info("PUT request to update permission config with id: {}", id);
        PermissionConfigDTO updatedConfig = permissionConfigService.updatePermissionConfig(id, configDTO);
        return ResponseEntity.ok(updatedConfig);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('SYSTEM_ADMIN')")
    public ResponseEntity<Void> deletePermissionConfig(@PathVariable String id) {
        log.info("DELETE request to delete permission config with id: {}", id);
        permissionConfigService.deletePermissionConfig(id);
        return ResponseEntity.noContent().build();
    }
}

