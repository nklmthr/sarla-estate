package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.RoleDTO;
import com.sarlatea.crm.exception.DataIntegrityException;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.Permission;
import com.sarlatea.crm.model.Role;
import com.sarlatea.crm.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoleService {

    private final RoleRepository roleRepository;

    @Transactional(readOnly = true)
    public List<RoleDTO> getAllRoles() {
        log.debug("Fetching all roles");
        return roleRepository.findAllByOrderByNameAsc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RoleDTO> getActiveRoles() {
        log.debug("Fetching active roles");
        return roleRepository.findByIsActiveTrueOrderByNameAsc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoleDTO getRoleById(String id) {
        log.debug("Fetching role with id: {}", id);
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));
        return convertToDTO(role);
    }

    @Transactional(readOnly = true)
    public RoleDTO getRoleByName(String name) {
        log.debug("Fetching role with name: {}", name);
        Role role = roleRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with name: " + name));
        return convertToDTO(role);
    }

    @Transactional
    public RoleDTO createRole(RoleDTO roleDTO) {
        log.debug("Creating new role: {}", roleDTO.getName());
        
        if (roleRepository.existsByName(roleDTO.getName())) {
            throw new DataIntegrityException("Role already exists with name: " + roleDTO.getName());
        }
        
        Role role = new Role();
        role.setName(roleDTO.getName());
        role.setDescription(roleDTO.getDescription());
        role.setPermissions(roleDTO.getPermissions() != null ? new HashSet<>(roleDTO.getPermissions()) : new HashSet<>());
        role.setIsSystemRole(false); // User-created roles are not system roles
        role.setIsActive(roleDTO.getIsActive() != null ? roleDTO.getIsActive() : true);
        
        Role savedRole = roleRepository.save(role);
        log.info("Role created successfully: {}", savedRole.getName());
        
        return convertToDTO(savedRole);
    }

    @Transactional
    public RoleDTO updateRole(String id, RoleDTO roleDTO) {
        log.debug("Updating role with id: {}", id);
        
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));
        
        if (role.getIsSystemRole()) {
            throw new DataIntegrityException("Cannot modify system role: " + role.getName());
        }
        
        // Check for duplicate name (excluding current role)
        if (!role.getName().equals(roleDTO.getName()) && roleRepository.existsByName(roleDTO.getName())) {
            throw new DataIntegrityException("Role already exists with name: " + roleDTO.getName());
        }
        
        role.setName(roleDTO.getName());
        role.setDescription(roleDTO.getDescription());
        role.setPermissions(roleDTO.getPermissions() != null ? new HashSet<>(roleDTO.getPermissions()) : new HashSet<>());
        
        if (roleDTO.getIsActive() != null) {
            role.setIsActive(roleDTO.getIsActive());
        }
        
        Role updatedRole = roleRepository.save(role);
        log.info("Role updated successfully: {}", updatedRole.getName());
        
        return convertToDTO(updatedRole);
    }

    @Transactional
    public void deleteRole(String id) {
        log.debug("Deleting role with id: {}", id);
        
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));
        
        if (role.getIsSystemRole()) {
            throw new DataIntegrityException("Cannot delete system role: " + role.getName());
        }
        
        // TODO: Check if any users are assigned to this role
        // For now, we'll allow deletion. In production, you might want to prevent this
        // or reassign users to a different role
        
        roleRepository.delete(role);
        log.info("Role deleted successfully: {}", role.getName());
    }

    @Transactional(readOnly = true)
    public List<Permission> getAllPermissions() {
        log.debug("Fetching all permissions");
        return List.of(Permission.values());
    }

    private RoleDTO convertToDTO(Role role) {
        RoleDTO dto = new RoleDTO();
        dto.setId(role.getId());
        dto.setName(role.getName());
        dto.setDescription(role.getDescription());
        dto.setPermissions(role.getPermissions());
        dto.setIsSystemRole(role.getIsSystemRole());
        dto.setIsActive(role.getIsActive());
        dto.setCreatedAt(role.getCreatedAt());
        dto.setUpdatedAt(role.getUpdatedAt());
        return dto;
    }
}

