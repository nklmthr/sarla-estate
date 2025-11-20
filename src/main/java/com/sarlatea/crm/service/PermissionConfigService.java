package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.PermissionConfigDTO;
import com.sarlatea.crm.exception.DataIntegrityException;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.PermissionConfig;
import com.sarlatea.crm.repository.PermissionConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionConfigService {

    private final PermissionConfigRepository permissionConfigRepository;

    @Transactional(readOnly = true)
    public List<PermissionConfigDTO> getAllPermissionConfigs() {
        log.debug("Fetching all permission configurations");
        return permissionConfigRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PermissionConfigDTO> getActivePermissionConfigs() {
        log.debug("Fetching active permission configurations");
        return permissionConfigRepository.findByIsActiveTrueOrderByResourceTypeAsc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PermissionConfigDTO getPermissionConfigById(String id) {
        log.debug("Fetching permission config with id: {}", id);
        PermissionConfig config = permissionConfigRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permission config not found with id: " + id));
        return convertToDTO(config);
    }

    @Transactional(readOnly = true)
    public List<PermissionConfigDTO> getPermissionConfigsByResource(String resourceType) {
        log.debug("Fetching permission configs for resource: {}", resourceType);
        return permissionConfigRepository
                .findByResourceTypeAndIsActiveTrueOrderByOperationTypeAsc(resourceType)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public PermissionConfigDTO createPermissionConfig(PermissionConfigDTO configDTO) {
        log.debug("Creating new permission config: {}:{}", 
                configDTO.getResourceType(), configDTO.getOperationType());

        // Check for duplicates
        if (permissionConfigRepository.existsByResourceTypeAndOperationType(
                configDTO.getResourceType(), configDTO.getOperationType())) {
            throw new DataIntegrityException(
                    "Permission configuration already exists for " + 
                    configDTO.getResourceType() + ":" + configDTO.getOperationType());
        }

        PermissionConfig config = new PermissionConfig();
        config.setResourceType(configDTO.getResourceType());
        config.setOperationType(configDTO.getOperationType());
        config.setRequiredPermission(configDTO.getRequiredPermission());
        config.setDescription(configDTO.getDescription());
        config.setIsActive(configDTO.getIsActive() != null ? configDTO.getIsActive() : true);

        PermissionConfig savedConfig = permissionConfigRepository.save(config);
        log.info("Permission config created successfully: {}", savedConfig.getKey());
        
        return convertToDTO(savedConfig);
    }

    @Transactional
    public PermissionConfigDTO updatePermissionConfig(String id, PermissionConfigDTO configDTO) {
        log.debug("Updating permission config with id: {}", id);

        PermissionConfig config = permissionConfigRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permission config not found with id: " + id));

        // Check for duplicates (excluding current config)
        PermissionConfig existingConfig = permissionConfigRepository
                .findByResourceAndOperation(configDTO.getResourceType(), configDTO.getOperationType())
                .orElse(null);
        
        if (existingConfig != null && !existingConfig.getId().equals(id)) {
            throw new DataIntegrityException(
                    "Permission configuration already exists for " + 
                    configDTO.getResourceType() + ":" + configDTO.getOperationType());
        }

        config.setResourceType(configDTO.getResourceType());
        config.setOperationType(configDTO.getOperationType());
        config.setRequiredPermission(configDTO.getRequiredPermission());
        config.setDescription(configDTO.getDescription());
        config.setIsActive(configDTO.getIsActive());

        PermissionConfig updatedConfig = permissionConfigRepository.save(config);
        log.info("Permission config updated successfully: {}", updatedConfig.getKey());
        
        return convertToDTO(updatedConfig);
    }

    @Transactional
    public void deletePermissionConfig(String id) {
        log.debug("Deleting permission config with id: {}", id);

        PermissionConfig config = permissionConfigRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permission config not found with id: " + id));

        permissionConfigRepository.delete(config);
        log.info("Permission config deleted successfully: {}", config.getKey());
    }

    private PermissionConfigDTO convertToDTO(PermissionConfig config) {
        PermissionConfigDTO dto = new PermissionConfigDTO();
        dto.setId(config.getId());
        dto.setResourceType(config.getResourceType());
        dto.setOperationType(config.getOperationType());
        dto.setRequiredPermission(config.getRequiredPermission());
        dto.setDescription(config.getDescription());
        dto.setIsActive(config.getIsActive());
        dto.setCreatedAt(config.getCreatedAt() != null ? config.getCreatedAt().toString() : null);
        dto.setUpdatedAt(config.getUpdatedAt() != null ? config.getUpdatedAt().toString() : null);
        return dto;
    }
}

